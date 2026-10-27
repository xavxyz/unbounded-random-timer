import { useCallback } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { ringFromTop } from './bell';
import type { Phase } from './phase';

// Each phase owns its sound, one singing bowl: struck once for White, twice for Black.
// Synthesised by scripts/synthesize-bell.mjs; swap in any recording.
const WHITE_SOUND = require('../assets/bell.wav');
const BLACK_SOUND = require('../assets/black.wav');

// Set once at load, before any ring: sound through the iOS silent switch, and
// mix with music rather than lowering or pausing it.
setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });

/** Returns a function that plays a phase's own sound from the top. */
export function usePhaseSound() {
  const white = useAudioPlayer(WHITE_SOUND);
  const black = useAudioPlayer(BLACK_SOUND);

  return useCallback(
    (phase: Phase) => {
      ringFromTop(phase === 'white' ? white : black);
    },
    [white, black],
  );
}
