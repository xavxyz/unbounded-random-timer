import {
  DEFAULT_SETUP,
  cardsOf,
  formatBounds,
  restoreSetup,
  sessionSetupOf,
  setPhaseEnabled,
  swapOrder,
} from './setup';

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

describe('restoring a saved setup', () => {
  it('gives the defaults when nothing was saved', () => {
    expect(restoreSetup(null)).toEqual(DEFAULT_SETUP);
  });

  it('restores a saved setup exactly', () => {
    const saved = {
      order: ['black', 'white'],
      phases: {
        white: { enabled: false, bounds: { minSeconds: 60, maxSeconds: 95 } },
        black: { enabled: true, bounds: { minSeconds: 5, maxSeconds: 3595 } },
      },
    };
    expect(restoreSetup(JSON.stringify(saved))).toEqual(saved);
  });

  it.each(['', '{not json', 'null', '42', '"setup"', '[]'])(
    'gives the defaults when the saved value is unreadable: %j',
    (stored) => {
      expect(restoreSetup(stored)).toEqual(DEFAULT_SETUP);
    },
  );

  it('fills in from the defaults whatever a partial save is missing', () => {
    expect(restoreSetup('{"order":["black","white"]}')).toEqual(swapOrder(DEFAULT_SETUP));
    expect(restoreSetup('{"phases":{"black":{"enabled":false}}}')).toEqual(
      setPhaseEnabled(DEFAULT_SETUP, 'black', false),
    );
    expect(restoreSetup('{"phases":{"white":{"bounds":{"minSeconds":60}}}}').phases.white.bounds).toEqual({
      minSeconds: 60,
      maxSeconds: 420,
    });
  });

  it.each([
    '"white"',
    '["white"]',
    '["white","white"]',
    '["white","grey"]',
    '["black","white","black"]',
    '{"0":"black","1":"white"}',
  ])('keeps the default order when the saved order is invalid: %s', (order) => {
    expect(restoreSetup(`{"order":${order}}`).order).toEqual(['white', 'black']);
  });

  it('keeps the default for a phase turned on or off with anything but true or false', () => {
    expect(restoreSetup('{"phases":{"white":{"enabled":"no"},"black":{"enabled":0}}}')).toEqual(DEFAULT_SETUP);
  });

  it('turns both phases back on when the save has them both off, keeping the order and bounds', () => {
    const saved = {
      order: ['black', 'white'],
      phases: {
        white: { enabled: false, bounds: { minSeconds: 60, maxSeconds: 95 } },
        black: { enabled: false, bounds: { minSeconds: 5, maxSeconds: 10 } },
      },
    };
    expect(restoreSetup(JSON.stringify(saved))).toEqual({
      order: ['black', 'white'],
      phases: {
        white: { enabled: true, bounds: { minSeconds: 60, maxSeconds: 95 } },
        black: { enabled: true, bounds: { minSeconds: 5, maxSeconds: 10 } },
      },
    });
  });

  it.each([
    ['not numbers', '"1:00"', '"2:00"'],
    ['shorter than 0:05', 0, 60],
    ['longer than 59:55', 60, 3600],
    ['off the 5 s steps', 62, 120],
    ['not whole seconds', 60, 120.5],
    ['shortest above longest', 300, 120],
  ])('keeps the default bounds when the saved bounds are %s', (_, minSeconds, maxSeconds) => {
    const stored = JSON.stringify({ phases: { white: { bounds: { minSeconds, maxSeconds } } } });
    expect(restoreSetup(stored).phases.white.bounds).toEqual({ minSeconds: 180, maxSeconds: 420 });
  });
});
