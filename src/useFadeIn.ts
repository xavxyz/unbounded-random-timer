import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { COLOUR_FADE_MS } from './palette';

/**
 * An opacity that fades in over `COLOUR_FADE_MS` each time `shown` turns true,
 * alongside the screen's colour fade, and drops to 0 while it is false.
 */
export function useFadeIn(shown: boolean) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shown) {
      opacity.setValue(0);
      return;
    }
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: COLOUR_FADE_MS,
      easing: Easing.inOut(Easing.ease),
      // Kept off the native driver, like the colour fade it shares views with.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [shown, opacity]);

  return opacity;
}
