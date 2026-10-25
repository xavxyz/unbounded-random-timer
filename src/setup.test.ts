import { DEFAULT_SETUP, cardsOf, formatBounds, sessionSetupOf, setBounds, setPhaseEnabled, swapOrder } from './setup';

describe('setup', () => {
  it('defaults to both phases enabled, White first, White 3:00–7:00 and Black 0:20–0:40', () => {
    expect(cardsOf(DEFAULT_SETUP)).toEqual([
      { phase: 'white', enabled: true, bounds: { minSeconds: 180, maxSeconds: 420 }, canTurnOff: true },
      { phase: 'black', enabled: true, bounds: { minSeconds: 20, maxSeconds: 40 }, canTurnOff: true },
    ]);
    expect(sessionSetupOf(DEFAULT_SETUP)).toEqual([
      { phase: 'white', bounds: { minSeconds: 180, maxSeconds: 420 } },
      { phase: 'black', bounds: { minSeconds: 20, maxSeconds: 40 } },
    ]);
  });

  it('turning a phase off leaves the other alone in each round, and it can no longer be turned off', () => {
    const blackOnly = setPhaseEnabled(DEFAULT_SETUP, 'white', false);
    expect(sessionSetupOf(blackOnly)).toEqual([{ phase: 'black', bounds: { minSeconds: 20, maxSeconds: 40 } }]);
    expect(cardsOf(blackOnly).map(({ phase, enabled, canTurnOff }) => ({ phase, enabled, canTurnOff }))).toEqual([
      { phase: 'white', enabled: false, canTurnOff: true },
      { phase: 'black', enabled: true, canTurnOff: false },
    ]);
  });

  it('refuses to turn off the last enabled phase', () => {
    const blackOnly = setPhaseEnabled(DEFAULT_SETUP, 'white', false);
    expect(setPhaseEnabled(blackOnly, 'black', false)).toEqual(blackOnly);
  });

  it('turns a phase back on in its place in the order', () => {
    const blackOnly = setPhaseEnabled(DEFAULT_SETUP, 'white', false);
    expect(setPhaseEnabled(blackOnly, 'white', true)).toEqual(DEFAULT_SETUP);
  });

  it('swapping the order starts each round with Black, and swapping again restores it', () => {
    const blackFirst = swapOrder(DEFAULT_SETUP);
    expect(cardsOf(blackFirst).map((card) => card.phase)).toEqual(['black', 'white']);
    expect(sessionSetupOf(blackFirst)).toEqual([
      { phase: 'black', bounds: { minSeconds: 20, maxSeconds: 40 } },
      { phase: 'white', bounds: { minSeconds: 180, maxSeconds: 420 } },
    ]);
    expect(swapOrder(blackFirst)).toEqual(DEFAULT_SETUP);
  });

  it('swapping keeps which phases are enabled', () => {
    const whiteOnly = swapOrder(setPhaseEnabled(DEFAULT_SETUP, 'black', false));
    expect(sessionSetupOf(whiteOnly)).toEqual([{ phase: 'white', bounds: { minSeconds: 180, maxSeconds: 420 } }]);
  });
});

describe('setting bounds', () => {
  const blackBounds = (setup: typeof DEFAULT_SETUP) => cardsOf(setup).find((card) => card.phase === 'black')!.bounds;

  it("sets a phase's shortest and longest durations, leaving the other phase alone", () => {
    const changed = setBounds(DEFAULT_SETUP, 'black', { minSeconds: 30, maxSeconds: 90 });
    expect(sessionSetupOf(changed)).toEqual([
      { phase: 'white', bounds: { minSeconds: 180, maxSeconds: 420 } },
      { phase: 'black', bounds: { minSeconds: 30, maxSeconds: 90 } },
    ]);
  });

  it('snaps each bound to the nearest 5 seconds', () => {
    expect(blackBounds(setBounds(DEFAULT_SETUP, 'black', { minSeconds: 22, maxSeconds: 38 }))).toEqual({
      minSeconds: 20,
      maxSeconds: 40,
    });
    expect(blackBounds(setBounds(DEFAULT_SETUP, 'black', { minSeconds: 23, maxSeconds: 61.4 }))).toEqual({
      minSeconds: 25,
      maxSeconds: 60,
    });
  });

  it('keeps each bound between 0:05 and 59:55', () => {
    expect(blackBounds(setBounds(DEFAULT_SETUP, 'black', { minSeconds: 0, maxSeconds: 3600 }))).toEqual({
      minSeconds: 5,
      maxSeconds: 3595,
    });
    expect(blackBounds(setBounds(DEFAULT_SETUP, 'black', { minSeconds: -40, maxSeconds: 2 }))).toEqual({
      minSeconds: 5,
      maxSeconds: 5,
    });
    expect(blackBounds(setBounds(DEFAULT_SETUP, 'black', { minSeconds: 7200, maxSeconds: 9000 }))).toEqual({
      minSeconds: 3595,
      maxSeconds: 3595,
    });
  });

  it('allows the shortest and longest to be equal, for a phase of fixed length', () => {
    expect(blackBounds(setBounds(DEFAULT_SETUP, 'black', { minSeconds: 30, maxSeconds: 30 }))).toEqual({
      minSeconds: 30,
      maxSeconds: 30,
    });
  });

  it('sets one bound at a time, keeping the other', () => {
    expect(blackBounds(setBounds(DEFAULT_SETUP, 'black', { minSeconds: 25 }))).toEqual({ minSeconds: 25, maxSeconds: 40 });
    expect(blackBounds(setBounds(DEFAULT_SETUP, 'black', { maxSeconds: 60 }))).toEqual({ minSeconds: 20, maxSeconds: 60 });
  });

  it('raising the shortest above the longest raises the longest with it', () => {
    expect(blackBounds(setBounds(DEFAULT_SETUP, 'black', { minSeconds: 90 }))).toEqual({ minSeconds: 90, maxSeconds: 90 });
  });

  it('lowering the longest below the shortest lowers the shortest with it', () => {
    expect(blackBounds(setBounds(DEFAULT_SETUP, 'black', { maxSeconds: 10 }))).toEqual({ minSeconds: 10, maxSeconds: 10 });
  });

  it('never leaves the shortest above the longest, even when both are given crossed', () => {
    expect(blackBounds(setBounds(DEFAULT_SETUP, 'black', { minSeconds: 120, maxSeconds: 60 }))).toEqual({
      minSeconds: 120,
      maxSeconds: 120,
    });
  });
});

describe('bounds label', () => {
  it('shows the shortest and longest durations as m:ss–m:ss', () => {
    expect(formatBounds({ minSeconds: 180, maxSeconds: 420 })).toBe('3:00–7:00');
    expect(formatBounds({ minSeconds: 20, maxSeconds: 40 })).toBe('0:20–0:40');
    expect(formatBounds({ minSeconds: 5, maxSeconds: 3595 })).toBe('0:05–59:55');
  });
});
