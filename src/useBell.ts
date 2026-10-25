import { useCallback } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { ringPhase } from './bell';
import type { Phase } from './sessionClock';

// Synthesised by scripts/synthesize-bell.mjs; swap in any recording.
const BELL = require('../assets/bell.wav');
const BLACK = require('../assets/black.wav');

// Set once at load, before any ring: sound through the iOS silent switch, and
// mix with music rather than lowering or pausing it.
setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });

/**
 * Returns a function that rings a phase's sound from the top: the soft bell
 * for White, its own sound for Black.
 */
export function usePhaseSound() {
  const white = useAudioPlayer(BELL);
  const black = useAudioPlayer(BLACK);

  return useCallback(
    (phase: Phase) => {
      ringPhase({ white, black }, phase);
    },
    [white, black],
  );
}
