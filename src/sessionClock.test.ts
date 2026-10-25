import { formatElapsed, startSession, type Random, type SessionSetup } from './sessionClock';

const T0 = 1_700_000_000_000;
const lowest = () => 0;
// Math.random() never returns 1; this is as high as it gets.
const highest = () => 0.9999999999999999;

/** Park–Miller LCG: a deterministic stand-in for `Math.random`. */
function seededRandom(seed: number): Random {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Returns the given values in order, then repeats the last one.
function sequence(...values: number[]) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

// The default setup: White 3:00–7:00, then Black 0:20–0:40.
const WHITE_THEN_BLACK: SessionSetup = [
  { phase: 'white', bounds: { minSeconds: 180, maxSeconds: 420 } },
  { phase: 'black', bounds: { minSeconds: 20, maxSeconds: 40 } },
];

const CUSTOM_BOUNDS: SessionSetup = [
  { phase: 'white', bounds: { minSeconds: 65, maxSeconds: 90 } },
  { phase: 'black', bounds: { minSeconds: 5, maxSeconds: 15 } },
];

describe('session clock', () => {
  it('begins round 1 in its first phase, with no elapsed time, at the start', () => {
    const session = startSession(WHITE_THEN_BLACK, T0, lowest);
    expect(session.advanceTo(T0)).toEqual({ round: 1, phase: 'white', elapsedMs: 0, phaseBegan: true });
  });

  it('alternates White and Black, moving to the next round only when White comes back', () => {
    // At the lowest draws: White 3:00, Black 0:20, so a round lasts 3:20.
    const session = startSession(WHITE_THEN_BLACK, T0, lowest);
    const at = (ms: number) => {
      const { round, phase } = session.advanceTo(T0 + ms);
      return [round, phase];
    };
    expect(at(179_999)).toEqual([1, 'white']);
    expect(at(180_000)).toEqual([1, 'black']);
    expect(at(199_999)).toEqual([1, 'black']);
    expect(at(200_000)).toEqual([2, 'white']);
    expect(at(380_000)).toEqual([2, 'black']);
    expect(at(400_000)).toEqual([3, 'white']);
  });

  it('runs Black first when the setup puts it first', () => {
    const session = startSession([...WHITE_THEN_BLACK].reverse(), T0, lowest);
    expect(session.advanceTo(T0).phase).toBe('black');
    expect(session.advanceTo(T0 + 19_999)).toMatchObject({ round: 1, phase: 'black' });
    expect(session.advanceTo(T0 + 20_000)).toMatchObject({ round: 1, phase: 'white' });
    expect(session.advanceTo(T0 + 200_000)).toMatchObject({ round: 2, phase: 'black', phaseBegan: true });
  });

  it('makes each round that phase alone when only one phase is enabled', () => {
    const session = startSession([{ phase: 'black', bounds: { minSeconds: 20, maxSeconds: 40 } }], T0, lowest);
    expect(session.advanceTo(T0 + 19_999)).toMatchObject({ round: 1, phase: 'black' });
    expect(session.advanceTo(T0 + 20_000)).toMatchObject({ round: 2, phase: 'black', phaseBegan: true });
    expect(session.advanceTo(T0 + 40_000)).toMatchObject({ round: 3, phase: 'black', phaseBegan: true });
  });

  it('draws each phase exactly at its shortest when the random source is at its lowest', () => {
    const session = startSession(CUSTOM_BOUNDS, T0, lowest);
    expect(session.advanceTo(T0 + 64_999).phase).toBe('white');
    expect(session.advanceTo(T0 + 65_000).phase).toBe('black');
    expect(session.advanceTo(T0 + 69_999).phase).toBe('black');
    expect(session.advanceTo(T0 + 70_000)).toMatchObject({ round: 2, phase: 'white' });
  });

  it('draws each phase exactly at its longest when the random source is at its highest', () => {
    const session = startSession(CUSTOM_BOUNDS, T0, highest);
    expect(session.advanceTo(T0 + 89_999).phase).toBe('white');
    expect(session.advanceTo(T0 + 90_000).phase).toBe('black');
    expect(session.advanceTo(T0 + 104_999).phase).toBe('black');
    expect(session.advanceTo(T0 + 105_000)).toMatchObject({ round: 2, phase: 'white' });
  });

  it("always lasts exactly the bound when a phase's shortest and longest are equal", () => {
    const setup: SessionSetup = [
      { phase: 'white', bounds: { minSeconds: 30, maxSeconds: 30 } },
      { phase: 'black', bounds: { minSeconds: 10, maxSeconds: 10 } },
    ];
    for (const random of [lowest, highest, seededRandom(3)]) {
      const session = startSession(setup, T0, random);
      expect(session.advanceTo(T0 + 29_999).phase).toBe('white');
      expect(session.advanceTo(T0 + 30_000).phase).toBe('black');
      expect(session.advanceTo(T0 + 39_999).phase).toBe('black');
      expect(session.advanceTo(T0 + 40_000)).toMatchObject({ round: 2, phase: 'white' });
    }
  });

  it('changes phase exactly on a later boundary', () => {
    // White 3:00, Black 0:40, then White 3:00: round 2's Black begins at 6:40.
    const session = startSession(WHITE_THEN_BLACK, T0, sequence(0, highest(), 0));
    expect(session.advanceTo(T0 + 399_999)).toMatchObject({ round: 2, phase: 'white' });
    expect(session.advanceTo(T0 + 400_000)).toMatchObject({ round: 2, phase: 'black' });
  });

  it('reports a phase start exactly once', () => {
    const session = startSession(WHITE_THEN_BLACK, T0, lowest);
    expect(session.advanceTo(T0).phaseBegan).toBe(true);
    expect(session.advanceTo(T0 + 100).phaseBegan).toBe(false);
    expect(session.advanceTo(T0 + 179_900).phaseBegan).toBe(false);
    expect(session.advanceTo(T0 + 180_100).phaseBegan).toBe(true);
    expect(session.advanceTo(T0 + 180_300).phaseBegan).toBe(false);
    expect(session.advanceTo(T0 + 200_100).phaseBegan).toBe(true);
    expect(session.advanceTo(T0 + 200_300).phaseBegan).toBe(false);
  });

  it('lands on the right phase, reported once, after a jump across several phase starts', () => {
    const session = startSession(WHITE_THEN_BLACK, T0, lowest);
    session.advanceTo(T0);
    // 9 rounds of 3:20 end at 30:00, so round 10's Black begins at 33:00; 33:05 is in it.
    expect(session.advanceTo(T0 + 1_985_000)).toEqual({
      round: 10,
      phase: 'black',
      elapsedMs: 1_985_000,
      phaseBegan: true,
    });
    expect(session.advanceTo(T0 + 1_985_200).phaseBegan).toBe(false);
  });

  it('keeps counting rounds past 99', () => {
    const setup: SessionSetup = [
      { phase: 'white', bounds: { minSeconds: 5, maxSeconds: 5 } },
      { phase: 'black', bounds: { minSeconds: 5, maxSeconds: 5 } },
    ];
    const session = startSession(setup, T0, lowest);
    // Each round lasts 0:10, so round 100 begins at 16:30 and round 123 at 20:20.
    expect(session.advanceTo(T0 + 989_999).round).toBe(99);
    expect(session.advanceTo(T0 + 990_000)).toMatchObject({ round: 100, phase: 'white', phaseBegan: true });
    expect(session.advanceTo(T0 + 1_225_000)).toMatchObject({ round: 123, phase: 'black' });
  });

  it('keeps every phase a whole number of seconds within its bounds over a long session', () => {
    const session = startSession(WHITE_THEN_BLACK, T0, seededRandom(7));
    const starts: { s: number; phase: string }[] = [{ s: 0, phase: 'white' }];
    let current = session.advanceTo(T0);
    for (let s = 1; s <= 3 * 3600; s++) {
      const justBefore = session.advanceTo(T0 + s * 1000 - 1);
      expect([justBefore.round, justBefore.phase]).toEqual([current.round, current.phase]);
      const onTheSecond = session.advanceTo(T0 + s * 1000);
      if (onTheSecond.phase !== current.phase) {
        expect(onTheSecond.round).toBe(onTheSecond.phase === 'white' ? current.round + 1 : current.round);
        starts.push({ s, phase: onTheSecond.phase });
        current = onTheSecond;
      }
    }
    const lengths = (phase: string) =>
      starts.slice(0, -1).flatMap((start, i) => (start.phase === phase ? [starts[i + 1].s - start.s] : []));
    const white = lengths('white');
    const black = lengths('black');
    expect(white.length).toBeGreaterThan(25);
    expect(black.length).toBeGreaterThan(25);
    for (const d of white) {
      expect(d).toBeGreaterThanOrEqual(180);
      expect(d).toBeLessThanOrEqual(420);
    }
    for (const d of black) {
      expect(d).toBeGreaterThanOrEqual(20);
      expect(d).toBeLessThanOrEqual(40);
    }
    expect(new Set(white).size).toBeGreaterThan(1);
    expect(new Set(black).size).toBeGreaterThan(1);
  });

  it('never resets the elapsed time at a phase start', () => {
    const session = startSession(WHITE_THEN_BLACK, T0, lowest);
    expect(session.advanceTo(T0 + 180_000).elapsedMs).toBe(180_000);
    expect(session.advanceTo(T0 + 200_000).elapsedMs).toBe(200_000);
  });

  it('stays at the start if the wall clock moves back before it', () => {
    const session = startSession(WHITE_THEN_BLACK, T0, lowest);
    session.advanceTo(T0);
    expect(session.advanceTo(T0 - 5_000)).toEqual({ round: 1, phase: 'white', elapsedMs: 0, phaseBegan: false });
  });

  it('reports the same phase without reporting its start again when moved to the same instant twice', () => {
    const session = startSession(WHITE_THEN_BLACK, T0, seededRandom(42));
    const first = session.advanceTo(T0 + 3_600_000);
    expect(session.advanceTo(T0 + 3_600_000)).toEqual({ ...first, phaseBegan: false });
  });
});

describe('formatElapsed', () => {
  it.each([
    [0, '00:00'],
    [999, '00:00'],
    [65_000, '01:05'],
    [3_599_999, '59:59'],
    [3_600_000, '1:00:00'],
    [3_661_000, '1:01:01'],
    [36_005_000, '10:00:05'],
  ])('formats %d ms as %s', (ms, expected) => {
    expect(formatElapsed(ms)).toBe(expected);
  });
});
