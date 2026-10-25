import Storage from 'expo-sqlite/kv-store';
import { useCallback, useEffect, useState } from 'react';
import { restoreSetup, type Setup } from './setup';

const KEY = 'setup';

/**
 * The setup, kept in on-device storage so it survives relaunches.
 * It's `null` until the saved setup has loaded; every change is saved.
 */
export function useSavedSetup(): [Setup | null, (setup: Setup) => void] {
  const [setup, setSetup] = useState<Setup | null>(null);

  useEffect(() => {
    let cancelled = false;
    Storage.getItemAsync(KEY)
      .catch(() => null)
      .then((stored) => {
        if (!cancelled) setSetup(restoreSetup(stored));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback((next: Setup) => {
    setSetup(next);
    // A failed save only costs the next launch this change.
    Storage.setItemAsync(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  return [setup, save];
}
