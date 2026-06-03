import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { MarketCards } from '@/components/home/market-cards';
import { ActiveTickers } from '@/components/home/active-tickers';
import { WatchlistCards } from '@/components/home/watchlist-cards';
import { useQuotes } from '@/hooks/use-quotes';
import { useWatchlist } from '@/hooks/use-watchlist';
import { usePopularTickers } from '@/hooks/use-popular-tickers';

const INDEX_TICKERS = ['SPY', 'QQQ', 'IWM', 'DIA'];

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { tickers: watchlistItems } = useWatchlist();
  const { data: popularData } = usePopularTickers();

  const popularTickers = useMemo(
    () => popularData?.tickers ?? [],
    [popularData],
  );

  const allHomeTickers = useMemo(
    () => [...new Set([...INDEX_TICKERS, ...popularTickers])],
    [popularTickers],
  );

  const watchlistOnlyTickers = useMemo(() => {
    const homeSet = new Set(allHomeTickers);
    return watchlistItems.map((w) => w.t).filter((t) => !homeSet.has(t));
  }, [watchlistItems, allHomeTickers]);

  const { quotesMap: homeQuotesMap, isLoading: homeLoading } =
    useQuotes(allHomeTickers);
  const { quotesMap: watchlistQuotesMap, isLoading: watchlistLoading } =
    useQuotes(watchlistOnlyTickers);

  const watchlistMergedMap = useMemo(() => {
    const merged = new Map(homeQuotesMap);
    for (const [k, v] of watchlistQuotesMap) merged.set(k, v);
    return merged;
  }, [homeQuotesMap, watchlistQuotesMap]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Market Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Click any card to open the Options Explorer.
        </p>
      </div>

      <MarketCards quotesMap={homeQuotesMap} isLoading={homeLoading} />
      <ActiveTickers
        tickers={popularTickers}
        quotesMap={homeQuotesMap}
        isLoading={homeLoading}
      />
      <WatchlistCards
        quotesMap={watchlistMergedMap}
        isLoading={watchlistLoading || homeLoading}
      />
    </div>
  );
}
