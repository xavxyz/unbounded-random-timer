import { StatusBar } from 'expo-status-bar';
import { Unbounded_900Black, useFonts } from '@expo-google-fonts/unbounded';
import { useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { KeepAwake } from './src/KeepAwake';
import { PHASE_COLOURS, SETUP_GREY } from './src/palette';
import { formatElapsed } from './src/sessionClock';
import { DEFAULT_SETUP, sessionSetupOf } from './src/setup';
import { SetupCards } from './src/SetupCards';
import { useColourFade } from './src/useColourFade';
import { useScreenGesture } from './src/useScreenGesture';
import { useSession } from './src/useSession';

// Unbounded's digits average 0.87 em wide: 0.38 × 0.87 ≈ a third of the screen per digit.
const ROUND_FONT_SIZE_PER_WIDTH = 0.38;

export default function App() {
  const [setup, setSetup] = useState(DEFAULT_SETUP);
  const sessionSetup = useMemo(() => sessionSetupOf(setup), [setup]);
  const { snapshot, start, stop } = useSession(sessionSetup);
  const { width } = useWindowDimensions();
  const pressHandlers = useScreenGesture(snapshot != null, start, stop);
  // Until the face loads the round stays hidden, rather than flashing in the system font.
  // Should it fail to load, the round falls back to the system font.
  const [fontLoaded, fontError] = useFonts({ Unbounded_900Black });
  const colours = snapshot ? PHASE_COLOURS[snapshot.phase] : SETUP_GREY;
  const { background, ink } = useColourFade(colours);

  return (
    // The whole screen is the control: tapping the grey begins, holding stops.
    // Touches on the setup cards stay with the cards.
    <Pressable style={styles.screen} {...pressHandlers}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: background }]} />
      {snapshot && <KeepAwake />}
      {!snapshot && <SetupCards setup={setup} onChange={setSetup} />}
      {snapshot && (fontLoaded || fontError) && (
        <Animated.Text
          style={[styles.round, { color: ink, fontSize: width * ROUND_FONT_SIZE_PER_WIDTH }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {snapshot.round}
        </Animated.Text>
      )}
      {snapshot && (
        <Animated.Text style={[styles.elapsed, { color: ink }]}>{formatElapsed(snapshot.elapsedMs)}</Animated.Text>
      )}
      <Animated.Text style={[styles.hint, { color: ink }]}>
        {snapshot ? 'hold anywhere to stop' : 'tap to begin'}
      </Animated.Text>
      <StatusBar style={colours.statusBar} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: {
    fontFamily: 'Unbounded_900Black',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  elapsed: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    fontSize: 13,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  hint: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    fontSize: 12,
    fontWeight: '300',
    fontVariant: ['small-caps'],
    letterSpacing: 3,
  },
});
