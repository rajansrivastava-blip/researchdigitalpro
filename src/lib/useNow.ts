'use client';

import { useSyncExternalStore } from 'react';

const subscribe = (onTick: () => void) => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
};
const getSnapshot = () => Math.floor(Date.now() / 1000) * 1000;
const getServerSnapshot = () => null;

/**
 * Current time, updated every second. Returns null during server rendering and hydration,
 * so countdowns never cause a server/client text mismatch.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function timeLeft(expiresAt: string | undefined, now: number | null) {
  if (!expiresAt || now === null) return null;
  const diff = Math.max(0, new Date(expiresAt).getTime() - now);
  return {
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
