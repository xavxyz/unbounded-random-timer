import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { COLOUR_FADE_MS, type Colours } from './palette';

/**
 * Fades the screen's background and ink to `target` over `COLOUR_FADE_MS`
 * whenever it changes. A change mid-fade starts the next fade from where the
 * previous one was heading.
 */
export function useColourFade(target: Colours) {
  const progress = useRef(new Animated.Value(1)).current;
  const [fade, setFade] = useState({ from: target, to: target });

  if (fade.to !== target) setFade({ from: fade.to, to: target });

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: COLOUR_FADE_MS,
      easing: Easing.inOut(Easing.ease),
      // Colours can't be animated on the native driver.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [fade, progress]);

  return {
    background: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [fade.from.background, fade.to.background],
    }),
    ink: progress.interpolate({ inputRange: [0, 1], outputRange: [fade.from.ink, fade.to.ink] }),
  };
}
