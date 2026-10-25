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

/** Bounds move in steps of this many seconds. */
export const BOUNDS_STEP_SECONDS = 5;
/** The shortest a bound can be: 0:05. */
export const SHORTEST_BOUND_SECONDS = 5;
/** The longest a bound can be: 59:55. */
export const LONGEST_BOUND_SECONDS = 3595;

/**
 * Sets one or both of a phase's bounds, snapping each to the nearest 5 seconds
 * within 0:05–59:55. The shortest never ends up above the longest: the bound
 * being set wins and pushes the other along (the shortest, if both are given).
 */
export function setBounds(setup: Setup, phase: Phase, change: Partial<Bounds>): Setup {
  const current = setup.phases[phase].bounds;
  let minSeconds = snap(change.minSeconds ?? current.minSeconds);
  let maxSeconds = snap(change.maxSeconds ?? current.maxSeconds);
  if (minSeconds > maxSeconds) {
    if (change.minSeconds !== undefined) maxSeconds = minSeconds;
    else minSeconds = maxSeconds;
  }
  const bounds = { minSeconds, maxSeconds };
  return { ...setup, phases: { ...setup.phases, [phase]: { ...setup.phases[phase], bounds } } };
}

function snap(seconds: number): number {
  const snapped = Math.round(seconds / BOUNDS_STEP_SECONDS) * BOUNDS_STEP_SECONDS;
  return Math.min(LONGEST_BOUND_SECONDS, Math.max(SHORTEST_BOUND_SECONDS, snapped));
}

/** A phase's bounds as `m:ss–m:ss`. */
export function formatBounds({ minSeconds, maxSeconds }: Bounds): string {
  return `${formatDuration(minSeconds)}–${formatDuration(maxSeconds)}`;
}

/** A duration as `m:ss`. */
export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
