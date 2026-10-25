import { useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { AppState } from 'react-native';
import { keepsSessionRunning } from './appLifecycle';
import { startSession, type Phase, type Session, type SessionSetup, type SessionSnapshot } from './sessionClock';
import { usePhaseSound } from './useBell';

const POLL_MS = 250;

/**
 * Runs a session against the wall clock, ringing the phase's own sound with a
 * light haptic at every phase start, round 1's first phase included.
 * `snapshot` is null while idle. A session started with `start` uses `setup`
 * as it is then.
 */
export function useSession(setup: SessionSetup) {
  const ringPhase = usePhaseSound();
  const [session, setSession] = useState<Session | null>(null);
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);

  const signalPhase = useCallback(
    (phase: Phase) => {
      ringPhase(phase);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [ringPhase],
  );

  // One signal per report, even when several phase starts were crossed at once.
  const moveTo = useCallback(
    (current: Session, now: number) => {
      const next = current.advanceTo(now);
      if (next.phaseBegan) signalPhase(next.phase);
      setSnapshot(next);
    },
    [signalPhase],
  );

  const start = useCallback(() => {
    const now = Date.now();
    const next = startSession(setup, now, Math.random);
    setSession(next);
    moveTo(next, now);
  }, [setup, moveTo]);

  const stop = useCallback(() => {
    setSession(null);
    setSnapshot(null);
  }, []);

  useEffect(() => {
    if (!session) return;
    const poll = setInterval(() => moveTo(session, Date.now()), POLL_MS);
    return () => clearInterval(poll);
  }, [session, moveTo]);

  // Leaving the foreground stops the session silently rather than letting it
  // run without being able to ring.
  useEffect(() => {
    if (!session) return;
    if (!keepsSessionRunning(AppState.currentState)) {
      stop();
      return;
    }
    const subscription = AppState.addEventListener('change', (state) => {
      if (!keepsSessionRunning(state)) stop();
    });
    return () => subscription.remove();
  }, [session, stop]);

  return { snapshot, start, stop };
}
