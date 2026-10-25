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

/** Bounds are restored as a pair: a missing end comes from the defaults, but any invalid end drops the pair. */
function restoreBounds(saved: unknown, fallback: Bounds): Bounds {
  if (!isRecord(saved)) return fallback;
  const { minSeconds = fallback.minSeconds, maxSeconds = fallback.maxSeconds } = saved;
  if (!isBoundSeconds(minSeconds) || !isBoundSeconds(maxSeconds) || minSeconds > maxSeconds) return fallback;
  return { minSeconds, maxSeconds };
}

/** A bound is 0:05–59:55, in steps of 5 s. */
function isBoundSeconds(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value % 5 === 0 && value >= 5 && value <= 3595;
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
