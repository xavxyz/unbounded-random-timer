import { DEFAULT_SETUP, cardsOf, formatBounds, sessionSetupOf, setPhaseEnabled, swapOrder } from './setup';

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

describe('bounds label', () => {
  it('shows the shortest and longest durations as m:ss–m:ss', () => {
    expect(formatBounds({ minSeconds: 180, maxSeconds: 420 })).toBe('3:00–7:00');
    expect(formatBounds({ minSeconds: 20, maxSeconds: 40 })).toBe('0:20–0:40');
    expect(formatBounds({ minSeconds: 5, maxSeconds: 3595 })).toBe('0:05–59:55');
  });
});
