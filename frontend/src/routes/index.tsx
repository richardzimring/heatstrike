import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { MarketCards } from '@/components/home/market-cards';
import { ActiveTickers } from '@/components/home/active-tickers';
import { WatchlistCards } from '@/components/home/watchlist-cards';
import { useQuotes } from '@/hooks/use-quotes';
import { useWatchlist } from '@/hooks/use-watchlist';

const DEFAULT_TICKERS = [
  'SPY', 'QQQ', 'IWM', 'DIA',
  'AAPL', 'TSLA', 'NVDA', 'AMZN', 'MSFT', 'META', 'GOOG', 'AMD',
] as const;

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { tickers: watchlistItems } = useWatchlist();

  const watchlistOnlyTickers = useMemo(() => {
    const defaults = new Set<string>(DEFAULT_TICKERS);
    return watchlistItems.map((w) => w.t).filter((t) => !defaults.has(t));
  }, [watchlistItems]);

  const { quotesMap: defaultQuotesMap, isLoading: defaultsLoading } =
    useQuotes([...DEFAULT_TICKERS]);
  const { quotesMap: watchlistQuotesMap, isLoading: watchlistLoading } =
    useQuotes(watchlistOnlyTickers);

  const watchlistMergedMap = useMemo(() => {
    const merged = new Map(defaultQuotesMap);
    for (const [k, v] of watchlistQuotesMap) merged.set(k, v);
    return merged;
  }, [defaultQuotesMap, watchlistQuotesMap]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Market Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Stock prices and trading volume across major indices and popular
          tickers
        </p>
      </div>

      <MarketCards quotesMap={defaultQuotesMap} isLoading={defaultsLoading} />
      <ActiveTickers quotesMap={defaultQuotesMap} isLoading={defaultsLoading} />
      <WatchlistCards
        quotesMap={watchlistMergedMap}
        isLoading={watchlistLoading || defaultsLoading}
      />
    </div>
  );
}
