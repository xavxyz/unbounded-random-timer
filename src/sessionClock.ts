import type { Bounds, Phase } from './phase';

export type Random = () => number;

/** Wall-clock milliseconds since the epoch, as returned by `Date.now()`. */
export type Timestamp = number;

/** The enabled phases, in round order, each with its bounds. */
export type SessionSetup = readonly { phase: Phase; bounds: Bounds }[];

export type SessionSnapshot = {
  round: number;
  phase: Phase;
  elapsedMs: number;
  /**
   * True only on the first move that reaches a new phase, round 1's first
   * phase included. Several phases crossed in one move are reported once.
   */
  phaseBegan: boolean;
};

export type Session = {
  /**
   * Moves the session to `now`. Moving to the same instant again reports the
   * same phase without reporting its start again.
   */
  advanceTo(now: Timestamp): SessionSnapshot;
};

function drawPhaseMs({ minSeconds, maxSeconds }: Bounds, random: Random): number {
  const span = maxSeconds - minSeconds + 1;
  return (minSeconds + Math.floor(random() * span)) * 1000;
}

export function startSession(setup: SessionSetup, startedAt: Timestamp, random: Random): Session {
  // Elapsed time (ms) at which each phase reached so far ends, counted across
  // rounds (phase n of the session is setup[n % setup.length]); grows lazily.
  const phaseEnds: number[] = [];
  let lastReported = -1;

  return {
    advanceTo(now) {
      const elapsedMs = Math.max(0, now - startedAt);
      let index = 0;
      for (;; index++) {
        if (phaseEnds.length <= index) {
          const { bounds } = setup[index % setup.length];
          phaseEnds.push((phaseEnds[index - 1] ?? 0) + drawPhaseMs(bounds, random));
        }
        if (elapsedMs < phaseEnds[index]) break;
      }
      const phaseBegan = index > lastReported;
      lastReported = Math.max(lastReported, index);
      return {
        round: Math.floor(index / setup.length) + 1,
        phase: setup[index % setup.length].phase,
        elapsedMs,
        phaseBegan,
      };
    },
  };
}

/** `mm:ss` below one hour, `h:mm:ss` from one hour on. */
export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
