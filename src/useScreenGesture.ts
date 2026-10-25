import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createScreenGesture, HOLD_TO_STOP_MS } from './screenGesture';

/** How fast the round number comes back when a hold to stop is abandoned. */
const HOLD_ABANDONED_RETURN_MS = 250;

/**
 * Press handlers for the whole screen: tap to start, hold to stop. While
 * holding, `roundOpacity` fades the round number into the background over
 * `HOLD_TO_STOP_MS`, and brings it back if the hold is abandoned. A firm
 * haptic marks the stop, with no bell.
 */
export function useScreenGesture(running: boolean, start: () => void, stop: () => void) {
  // Read at press time, so the gesture always sees the current session.
  const latest = useRef({ running, start, stop });
  latest.current = { running, start, stop };
  const roundOpacity = useRef(new Animated.Value(1)).current;

  const [gesture] = useState(() => {
    const fadeRoundTo = (toValue: number, duration: number) =>
      Animated.timing(roundOpacity, {
        toValue,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();

    return createScreenGesture({
      isRunning: () => latest.current.running,
      onStart: () => {
        roundOpacity.setValue(1);
        latest.current.start();
      },
      onStop: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        latest.current.stop();
      },
      onHoldBegin: () => fadeRoundTo(0, HOLD_TO_STOP_MS),
      onHoldAbandoned: () => fadeRoundTo(1, HOLD_ABANDONED_RETURN_MS),
    });
  });

  // A session that ends on its own (e.g. on leaving the app) takes the hold with it.
  useEffect(() => {
    if (!running) gesture.cancel();
  }, [running, gesture]);

  useEffect(() => () => gesture.cancel(), [gesture]);

  return {
    pressHandlers: { onPressIn: gesture.pressIn, onPressOut: gesture.pressOut, onPress: gesture.tap },
    roundOpacity,
  };
}
