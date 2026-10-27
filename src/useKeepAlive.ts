import { useEffect } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Asset } from 'expo-asset';
import { AppState } from 'react-native';

// SPIKE: iOS keeps a locked app running only while it plays, so a session loops
// silence underneath the phase sounds and owns Now Playing (docs/adr/0002).
const SILENCE = require('../assets/silence.wav');
// Stand-in until the Emblem (PR #31) lands: a still of it goes here.
const ARTWORK = Asset.fromModule(require('../assets/icon.png')).uri;
const ARTIST = 'Unbounded Random Timer';

const RESUME_CHECK_MS = 500;

/** Loops silence and shows "Round N" on the lock screen while `round` is set. */
export function useKeepAlive(round: number | null) {
  const player = useAudioPlayer(SILENCE);
  const running = round != null;

  useEffect(() => {
    if (!running) return;
    player.loop = true;
    player.play();
    player.setActiveForLockScreen(true, { title: 'Round 1', artist: ARTIST, artworkUrl: ARTWORK }, {
      isLiveStream: true,
      showSeekForward: false,
      showSeekBackward: false,
      showNextTrack: false,
      showPreviousTrack: false,
    });
    return () => {
      player.clearLockScreenControls();
      player.pause();
    };
  }, [running, player]);

  // A lock-screen pause, an unplugged headset or an interruption that doesn't
  // resume leaves the loop paused, and iOS would suspend the app within seconds.
  useEffect(() => {
    if (!running) return;
    const check = setInterval(() => {
      if (!player.playing) player.play();
    }, RESUME_CHECK_MS);
    // SPIKE diagnostics: while the JS thread lives, a line lands every 2 s.
    const log = setInterval(() => {
      console.log(`[keepAlive] ${new Date().toISOString().slice(11, 19)} app=${AppState.currentState} playing=${player.playing} t=${player.currentTime.toFixed(1)}`);
    }, 2000);
    const sub = AppState.addEventListener('change', (s) => console.log(`[keepAlive] AppState -> ${s}`));
    return () => {
      clearInterval(check);
      clearInterval(log);
      sub.remove();
    };
  }, [running, player]);

  useEffect(() => {
    if (round != null) player.updateLockScreenMetadata({ title: `Round ${round}`, artist: ARTIST, artworkUrl: ARTWORK });
  }, [round, player]);
}
