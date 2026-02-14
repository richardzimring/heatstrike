import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'heatstrike:recent-tickers';

/** Ticker symbol + company name, mirroring TickerEntry shape */
export interface RecentTicker {
  t: string;
  n: string;
}

// ---------------------------------------------------------------------------
// Lightweight external-store so every component using the hook re-renders
// when the list changes (even across tabs via the "storage" event).
// ---------------------------------------------------------------------------

let listeners: Array<() => void> = [];

function subscribe(cb: () => void) {
  listeners = [...listeners, cb];

  // Also listen for cross-tab changes
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners = listeners.filter((l) => l !== cb);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '[]';
}

function notify() {
  for (const l of listeners) l();
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

const DEFAULT_MAX = 8;

export function useRecentTickers(maxRecent = DEFAULT_MAX) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => '[]');
  const recents: RecentTicker[] = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  })();

  const saveRecentTicker = useCallback(
    (ticker: string, name: string) => {
      const current: RecentTicker[] = (() => {
        try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        } catch {
          return [];
        }
      })();

      // Move to front, dedup by ticker symbol
      const next: RecentTicker[] = [
        { t: ticker, n: name },
        ...current.filter((e) => e.t !== ticker),
      ].slice(0, maxRecent);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      notify();
    },
    [maxRecent],
  );

  return { recents, saveRecentTicker } as const;
}
