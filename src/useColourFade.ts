import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { COLOUR_FADE_MS, type Colours } from './palette';

/**
 * Fades the screen's background and ink to `target` over `COLOUR_FADE_MS`
 * whenever it changes, and from `initial` to `target` on mount. A change
 * mid-fade starts the next fade from where the previous one was heading.
 */
export function useColourFade(target: Colours, initial: Colours = target) {
  // Each fade has its own progress, starting at 0, so the first frame of a
  // fade draws where it comes from rather than flashing where it's going.
  const [fade, setFade] = useState(() => ({ from: initial, to: target, progress: new Animated.Value(0) }));

  if (fade.to !== target) setFade({ from: fade.to, to: target, progress: new Animated.Value(0) });

  useEffect(() => {
    const animation = Animated.timing(fade.progress, {
      toValue: 1,
      duration: COLOUR_FADE_MS,
      easing: Easing.inOut(Easing.ease),
      // Colours can't be animated on the native driver.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [fade]);

  return {
    background: fade.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [fade.from.background, fade.to.background],
    }),
    ink: fade.progress.interpolate({ inputRange: [0, 1], outputRange: [fade.from.ink, fade.to.ink] }),
  };
}
