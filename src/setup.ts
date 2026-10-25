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

/**
 * Turns a saved setup (or `null` when nothing was saved) back into a valid setup.
 * Whatever is missing, unreadable or invalid comes from the defaults.
 */
export function restoreSetup(stored: string | null): Setup {
  const saved = parse(stored);
  if (!isRecord(saved)) return DEFAULT_SETUP;
  const phases = isRecord(saved.phases) ? saved.phases : {};
  const white = restorePhase(phases.white, DEFAULT_SETUP.phases.white);
  const black = restorePhase(phases.black, DEFAULT_SETUP.phases.black);
  // At least one phase is always enabled: a save with both off takes the default enabled phases.
  const noneEnabled = !white.enabled && !black.enabled;
  return {
    order: isOrder(saved.order) ? saved.order : DEFAULT_SETUP.order,
    phases: noneEnabled
      ? {
          white: { ...white, enabled: DEFAULT_SETUP.phases.white.enabled },
          black: { ...black, enabled: DEFAULT_SETUP.phases.black.enabled },
        }
      : { white, black },
  };
}

function restorePhase(saved: unknown, fallback: Setup['phases'][Phase]): Setup['phases'][Phase] {
  if (!isRecord(saved)) return fallback;
  return {
    enabled: typeof saved.enabled === 'boolean' ? saved.enabled : fallback.enabled,
    bounds: restoreBounds(saved.bounds, fallback.bounds),
  };
}

/**
 * Each end of the bounds is restored on its own, a missing or invalid end
 * coming from the defaults. Should the result have the shortest above the
 * longest, the default pair is used instead.
 */
function restoreBounds(saved: unknown, fallback: Bounds): Bounds {
  if (!isRecord(saved)) return fallback;
  const minSeconds = isBoundSeconds(saved.minSeconds) ? saved.minSeconds : fallback.minSeconds;
  const maxSeconds = isBoundSeconds(saved.maxSeconds) ? saved.maxSeconds : fallback.maxSeconds;
  return minSeconds > maxSeconds ? fallback : { minSeconds, maxSeconds };
}

/** A bound is one setBounds could produce: SHORTEST_BOUND_SECONDS–LONGEST_BOUND_SECONDS, in steps of BOUNDS_STEP_SECONDS. */
function isBoundSeconds(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value % BOUNDS_STEP_SECONDS === 0 &&
    value >= SHORTEST_BOUND_SECONDS &&
    value <= LONGEST_BOUND_SECONDS
  );
}

function parse(stored: string | null): unknown {
  if (stored == null) return undefined;
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
}

function isOrder(value: unknown): value is Setup['order'] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.includes('white') &&
    value.includes('black')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
