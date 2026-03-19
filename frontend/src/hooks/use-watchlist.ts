import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'heatstrike:watchlist';

let listeners: (() => void)[] = [];

function subscribe(cb: () => void) {
  listeners = [...listeners, cb];

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

export interface WatchlistTicker {
  t: string;
  n: string;
}

export function useWatchlist() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => '[]');
  const tickers: WatchlistTicker[] = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  })();

  const addTicker = useCallback((ticker: string, name: string) => {
    const current: WatchlistTicker[] = (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      } catch {
        return [];
      }
    })();

    if (current.some((e) => e.t === ticker)) return;
    const next = [...current, { t: ticker, n: name }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notify();
  }, []);

  const removeTicker = useCallback((ticker: string) => {
    const current: WatchlistTicker[] = (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      } catch {
        return [];
      }
    })();

    const next = current.filter((e) => e.t !== ticker);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notify();
  }, []);

  const isWatched = useCallback(
    (ticker: string) => tickers.some((e) => e.t === ticker),
    [tickers],
  );

  return { tickers, addTicker, removeTicker, isWatched } as const;
}
