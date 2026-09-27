'use client';

import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/** The page origin (e.g. https://example.com). Empty during server rendering, filled in on the client. */
export function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => ''
  );
}
