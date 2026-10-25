import type { AudioPlayer } from 'expo-audio';
import type { Phase } from './sessionClock';

export type BellPlayer = Pick<AudioPlayer, 'seekTo' | 'play'>;

/**
 * Rings the bell from the top. Once a ring has played out the player rests at
 * the end of the sound, and `play` acts at once while `seekTo` lands later:
 * playing before the seek lands is silent.
 */
export async function ringFromTop(player: BellPlayer) {
  await player.seekTo(0);
  player.play();
}

/** Each phase owns its sound: the bell for White, a lower double strike for Black. */
export type PhaseSounds = Record<Phase, BellPlayer>;

/** Rings the sound of the phase that is beginning, from the top. */
export function ringPhase(sounds: PhaseSounds, phase: Phase) {
  return ringFromTop(sounds[phase]);
}
