import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { COLOUR_FADE_MS } from './palette';

/**
 * An opacity that fades in over `COLOUR_FADE_MS` when `shown` turns true and
 * out when it turns false, alongside the screen's colour fade. `mounted` stays
 * true until the fade out ends, so what fades can stay on screen until then.
 * A change mid-fade turns the fade round from where it is.
 */
export function useFade(shown: boolean) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(shown);

  if (shown && !mounted) setMounted(true);

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: shown ? 1 : 0,
      duration: COLOUR_FADE_MS,
      easing: Easing.inOut(Easing.ease),
      // Kept off the native driver, like the colour fade it shares views with.
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && !shown) setMounted(false);
    });
    return () => animation.stop();
  }, [shown, opacity]);

  return { opacity, mounted };
}
