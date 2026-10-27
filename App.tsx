import { StatusBar } from 'expo-status-bar';
import { Unbounded_900Black, useFonts } from '@expo-google-fonts/unbounded';
import { useCallback, useMemo } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Emblem } from './src/Emblem';
import { KeepAwake } from './src/KeepAwake';
import { PHASE_COLOURS, SETUP_COLOURS } from './src/palette';
import { formatElapsed } from './src/sessionClock';
import { DEFAULT_SETUP, sessionSetupOf } from './src/setup';
import { SetupCards } from './src/SetupCards';
import { useColourFade } from './src/useColourFade';
import { useFade } from './src/useFade';
import { useSavedSetup } from './src/useSavedSetup';
import { useScreenGesture } from './src/useScreenGesture';
import { useSession } from './src/useSession';

/** Beginning a session clears the setup screen quickly, ahead of the colour fade. */
const SETUP_FADE_OUT_MS = 300;

// Unbounded's digits average 0.87 em wide: 0.38 × 0.87 ≈ a third of the screen per digit.
const ROUND_FONT_SIZE_PER_WIDTH = 0.38;

export default function App() {
  // Until the saved setup loads the setup screen shows nothing, rather than flashing the defaults,
  // and tapping doesn't begin.
  const [setup, setSetup] = useSavedSetup();
  const sessionSetup = useMemo(() => sessionSetupOf(setup ?? DEFAULT_SETUP), [setup]);
  const { snapshot, start, stop } = useSession(sessionSetup);
  const startOnceLoaded = useCallback(() => {
    if (setup) start();
  }, [setup, start]);
  const { width } = useWindowDimensions();
  const { pressHandlers, roundOpacity } = useScreenGesture(snapshot != null, startOnceLoaded, stop);
  // Until the face loads the round stays hidden, rather than flashing in the system font.
  // Should it fail to load, the round falls back to the system font.
  const [fontLoaded, fontError] = useFonts({ Unbounded_900Black });
  const colours = snapshot ? PHASE_COLOURS[snapshot.phase] : SETUP_COLOURS;
  // The app opens on Black's black (app.json's backgroundColor) and fades up from it.
  const { background, ink } = useColourFade(colours, PHASE_COLOURS.black);
  // The setup screen fades in and out with the background, so nothing sits at full contrast on a fading White or Black.
  const showingSetup = !snapshot && setup != null;
  const setupFade = useFade(showingSetup, SETUP_FADE_OUT_MS);
  // Hidden during a session rather than unmounted: drawing the Emblem afresh on stop
  // would hold up the JS thread, and with it the fade back.
  const setupHidden = {
    pointerEvents: showingSetup ? ('auto' as const) : ('none' as const),
    accessibilityElementsHidden: !showingSetup,
    importantForAccessibility: showingSetup ? ('auto' as const) : ('no-hide-descendants' as const),
  };

  return (
    // The whole screen is the control: tapping it begins, holding stops.
    // Touches on the setup cards stay with the cards; the Emblem lets them through.
    <Pressable style={styles.screen} {...pressHandlers}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: background }]} />
      {snapshot && <KeepAwake />}
      {setup && (
        // Hidden, it lets touches through to hold to stop.
        <Animated.View style={[styles.setup, { opacity: setupFade.opacity }]} {...setupHidden}>
          <Emblem turning={setupFade.visible} />
          <SetupCards setup={setup} onChange={setSetup} />
        </Animated.View>
      )}
      {snapshot && (fontLoaded || fontError) && (
        // Fading the round's opacity over the solid background fades it into the background colour.
        <Animated.View style={{ opacity: roundOpacity }}>
          <Animated.Text
            style={[styles.round, { color: ink, fontSize: width * ROUND_FONT_SIZE_PER_WIDTH }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {snapshot.round}
          </Animated.Text>
        </Animated.View>
      )}
      {snapshot && (
        <Animated.Text style={[styles.elapsed, { color: ink }]}>{formatElapsed(snapshot.elapsedMs)}</Animated.Text>
      )}
      {setup && (
        <Animated.Text style={[styles.hint, { color: ink, opacity: setupFade.opacity }]} {...setupHidden}>
          tap to begin
        </Animated.Text>
      )}
      {snapshot && <Animated.Text style={[styles.hint, { color: ink }]}>hold anywhere to stop</Animated.Text>}
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
  // Laid over the screen, so the round stays centred while the setup fades out.
  setup: {
    position: 'absolute',
    inset: 0,
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
