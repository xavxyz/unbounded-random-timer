import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { COLOUR_FADE_MS } from './palette';

/**
 * An opacity that fades in over `COLOUR_FADE_MS` when `shown` turns true,
 * alongside the screen's colour fade, and out over `outMs` when it turns false.
 * `visible` stays true until the fade out ends.
 * A change mid-fade turns the fade round from where it is.
 */
export function useFade(shown: boolean, outMs = COLOUR_FADE_MS) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(shown);

  if (shown && !visible) setVisible(true);

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: shown ? 1 : 0,
      duration: shown ? COLOUR_FADE_MS : outMs,
      easing: Easing.inOut(Easing.ease),
      // Kept off the native driver, like the colour fade it shares views with.
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && !shown) setVisible(false);
    });
    return () => animation.stop();
  }, [shown, outMs, opacity]);

  return { opacity, visible };
}
