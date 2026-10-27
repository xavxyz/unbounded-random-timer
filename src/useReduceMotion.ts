import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the system's Reduce Motion setting is on, following it as it changes,
 * or null until it is known.
 */
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let current = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (current) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      current = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
