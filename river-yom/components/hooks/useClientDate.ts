'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export function useClientDate(): Date | null {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  return isClient ? new Date() : null;
}
