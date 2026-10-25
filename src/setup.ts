import type { Bounds, Phase, SessionSetup } from './sessionClock';

/**
 * The practitioner's setup: both phases in round order, each with its bounds
 * and whether it's enabled. At least one phase is always enabled. Treat it as
 * immutable: every change returns a new setup.
 */
export type Setup = {
  readonly order: readonly [Phase, Phase];
  readonly phases: Readonly<Record<Phase, { readonly enabled: boolean; readonly bounds: Bounds }>>;
};

/** What a phase's card shows, in round order. */
export type Card = { phase: Phase; enabled: boolean; bounds: Bounds; canTurnOff: boolean };

export const DEFAULT_SETUP: Setup = {
  order: ['white', 'black'],
  phases: {
    white: { enabled: true, bounds: { minSeconds: 180, maxSeconds: 420 } },
    black: { enabled: true, bounds: { minSeconds: 20, maxSeconds: 40 } },
  },
};

export function cardsOf(setup: Setup): Card[] {
  return setup.order.map((phase) => ({
    phase,
    ...setup.phases[phase],
    canTurnOff: !isLastEnabled(setup, phase),
  }));
}

function isLastEnabled(setup: Setup, phase: Phase): boolean {
  return setup.order.every((other) => setup.phases[other].enabled === (other === phase));
}

/** Turns a phase on or off. Turning off the last enabled phase is refused: the setup comes back unchanged. */
export function setPhaseEnabled(setup: Setup, phase: Phase, enabled: boolean): Setup {
  if (!enabled && isLastEnabled(setup, phase)) return setup;
  return { ...setup, phases: { ...setup.phases, [phase]: { ...setup.phases[phase], enabled } } };
}

/** The enabled phases in round order, as a session takes them. */
export function sessionSetupOf(setup: Setup): SessionSetup {
  return setup.order
    .filter((phase) => setup.phases[phase].enabled)
    .map((phase) => ({ phase, bounds: setup.phases[phase].bounds }));
}

/** Reverses the round order, so a round can start with Black. */
export function swapOrder(setup: Setup): Setup {
  const [first, second] = setup.order;
  return { ...setup, order: [second, first] };
}

/** A phase's bounds as `m:ss–m:ss`. */
export function formatBounds({ minSeconds, maxSeconds }: Bounds): string {
  const format = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return `${format(minSeconds)}–${format(maxSeconds)}`;
}
