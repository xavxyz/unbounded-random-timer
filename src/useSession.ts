import { useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import type { Phase } from './phase';
import { startSession, type Session, type SessionSetup, type SessionSnapshot } from './sessionClock';
import { useKeepAlive } from './useKeepAlive';
import { usePhaseSound } from './usePhaseSound';

const POLL_MS = 250;

/**
 * Runs a session against the wall clock, ringing the phase's own sound with a
 * light haptic at every phase start, round 1's first phase included.
 * `snapshot` is null while idle. A session started with `start` uses `setup`
 * as it is then.
 */
export function useSession(setup: SessionSetup) {
  const playPhaseSound = usePhaseSound();
  const [session, setSession] = useState<Session | null>(null);
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);

  const signalPhase = useCallback(
    (phase: Phase) => {
      playPhaseSound(phase);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [playPhaseSound],
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

  // SPIKE: the session runs on through a lock or leaving the app; only the hold stops it.
  useKeepAlive(snapshot?.round ?? null);

  return { snapshot, start, stop };
}
