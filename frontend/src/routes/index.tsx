import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { TickerPulse } from '@/components/home/ticker-pulse';
import {
  emptyPulseRow,
  isSummaryReady,
  summaryToPulseRow,
  type TickerPulseRow,
} from '@/lib/ticker-pulse';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useRecentTickers } from '@/hooks/use-recent-tickers';
import { usePopularTickers } from '@/hooks/use-popular-tickers';
import { useQuoteSummaries } from '@/hooks/use-quote-summaries';
import type { QuoteTickerSummary } from '@/lib/api/generated';

/** Keep symbols in sync with backend INDEX_TICKERS. */
const INDEX_TICKERS = [
  { t: 'SPY', n: 'S&P 500' },
  { t: 'QQQ', n: 'Nasdaq 100' },
  { t: 'IWM', n: 'Russell 2000' },
  { t: 'DIA', n: 'Dow Jones' },
] as const;

function rowFromSummary(
  summary: QuoteTickerSummary | undefined,
  ticker: string,
): TickerPulseRow {
  if (!summary || !isSummaryReady(summary)) {
    return emptyPulseRow(ticker);
  }
  return summaryToPulseRow(summary);
}

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { tickers: watchlistItems, removeTicker } = useWatchlist();
  const { recents, removeRecentTicker } = useRecentTickers(8);
  const { data: popularData, isLoading: popularLoading } = usePopularTickers();

  const watchlistSet = useMemo(
    () => new Set(watchlistItems.map((w) => w.t.toUpperCase())),
    [watchlistItems],
  );

  const recentItems = useMemo(
    () => recents.filter((r) => !watchlistSet.has(r.t.toUpperCase())),
    [recents, watchlistSet],
  );

  const indexSet = useMemo(
    () => new Set<string>(INDEX_TICKERS.map((i) => i.t)),
    [],
  );

  const popularRows = useMemo(
    () =>
      (popularData?.tickers ?? [])
        .filter((s) => !indexSet.has(s.ticker))
        .map((s) =>
          isSummaryReady(s) ? summaryToPulseRow(s) : emptyPulseRow(s.ticker),
        ),
    [popularData, indexSet],
  );

  const summaryTickers = useMemo(() => {
    const tickers = [
      ...watchlistItems.map((w) => w.t),
      ...recentItems.map((r) => r.t),
      ...INDEX_TICKERS.map((i) => i.t),
    ];
    return [...new Set(tickers.map((t) => t.toUpperCase()))];
  }, [watchlistItems, recentItems]);

  const { summariesMap, isLoading: summariesLoading } =
    useQuoteSummaries(summaryTickers);

  const favoriteRows = useMemo(() => {
    return watchlistItems.map((item) =>
      rowFromSummary(
        summariesMap.get(item.t.toUpperCase()),
        item.t.toUpperCase(),
      ),
    );
  }, [watchlistItems, summariesMap]);

  const recentRows = useMemo(() => {
    return recentItems.map((item) =>
      rowFromSummary(
        summariesMap.get(item.t.toUpperCase()),
        item.t.toUpperCase(),
      ),
    );
  }, [recentItems, summariesMap]);

  const indexRows = useMemo(() => {
    return INDEX_TICKERS.map((item) =>
      rowFromSummary(summariesMap.get(item.t), item.t),
    );
  }, [summariesMap]);

  return (
    <div className="p-4 md:p-6">
      <TickerPulse
        favorites={favoriteRows}
        recent={recentRows}
        indexes={indexRows}
        popular={popularRows}
        favoritesLoading={summariesLoading}
        recentLoading={summariesLoading}
        indexesLoading={summariesLoading}
        popularLoading={popularLoading}
        onRemoveRecent={removeRecentTicker}
        onRemoveFavorite={removeTicker}
      />
    </div>
  );
}
