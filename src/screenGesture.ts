/** How long the practitioner must hold anywhere on the screen to stop a session. */
export const HOLD_TO_STOP_MS = 1200;

type ScreenGestureOptions = {
  isRunning: () => boolean;
  onStart: () => void;
  onStop: () => void;
  /** A hold to stop has begun: it lands `HOLD_TO_STOP_MS` later unless abandoned. */
  onHoldBegin: () => void;
  /** The hold to stop under way ended before landing: released early or cancelled. */
  onHoldAbandoned: () => void;
};

/**
 * The whole screen is the control. While idle, a tap starts a session. While
 * running, a plain tap does nothing (left free for a future tap-to-reveal) and
 * holding for `HOLD_TO_STOP_MS` stops it; releasing early abandons the hold.
 *
 * Feed it the screen's press-in, press-out and tap (a release on the screen,
 * never a touch the OS cancelled). A press belongs to the state it began in, so
 * releasing a completed hold doesn't start a new session.
 */
export function createScreenGesture({
  isRunning,
  onStart,
  onStop,
  onHoldBegin,
  onHoldAbandoned,
}: ScreenGestureOptions) {
  let pressBeganIdle = false;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;

  const abandonHold = () => {
    if (holdTimer === undefined) return;
    clearTimeout(holdTimer);
    holdTimer = undefined;
    onHoldAbandoned();
  };

  return {
    pressIn() {
      abandonHold();
      pressBeganIdle = !isRunning();
      if (pressBeganIdle) return;
      holdTimer = setTimeout(() => {
        holdTimer = undefined;
        // The session may have ended on its own mid-hold, e.g. on leaving the app.
        if (isRunning()) onStop();
      }, HOLD_TO_STOP_MS);
      onHoldBegin();
    },
    pressOut: abandonHold,
    tap() {
      if (pressBeganIdle) onStart();
      pressBeganIdle = false;
    },
    /** Drops the press under way, e.g. when the session ends on its own. */
    cancel() {
      abandonHold();
      pressBeganIdle = false;
    },
  };
}
