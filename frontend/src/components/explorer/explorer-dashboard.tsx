import { useMemo } from 'react';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useOptionsData } from '@/hooks/useOptionsData';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useRecentTickers } from '@/hooks/useRecentTickers';
import { useTickers } from '@/hooks/useTickers';
import { DirectionToggle } from '@/components/explorer/controls/direction-toggle';
import { MetricSelect } from '@/components/explorer/controls/metric-select';
import { SizeSelect } from '@/components/explorer/controls/size-select';
import { RangeSliders } from '@/components/explorer/controls/range-sliders';
import { SummaryStats } from '@/components/explorer/summary-stats';
import { HeatmapView } from '@/components/explorer/heatmap-view';
import { InsightsCard } from '@/components/explorer/insights-card';
import { InfoDialog } from '@/components/explorer/info-dialog';
import type { OptionsDataResponse } from '@/lib/api/generated';
import type { Direction, Metric } from '@/types';
import { cn } from '@/lib/utils';
import { TickerLogo } from '@/components/ticker-logo';

const SEARCH_DEFAULTS = {
  direction: 'calls' as const,
  metric: 'volume' as const,
  strikeRange: 5,
  expirations: 8,
  sizeMetric: 'none' as const,
};

function filterOptionsData(
  data: OptionsDataResponse,
  strikeRange: number,
  maxExpirations: number,
): OptionsDataResponse {
  const expirationDates = data.expirationDates.slice(0, maxExpirations);
  const expirationDatesStringified = data.expirationDatesStringified.slice(
    0,
    maxExpirations,
  );
  const options = data.options.slice(0, maxExpirations);

  const stockPrice = parseFloat(data.price);
  const atmIndex = data.strikes.findIndex(
    (s) => parseFloat(s.replace('$', '')) > stockPrice,
  );
  const center = atmIndex === -1 ? data.strikes.length - 1 : atmIndex;
  const start = Math.max(0, center - strikeRange);
  const end = Math.min(data.strikes.length, center + strikeRange + 1);

  const strikes = data.strikes.slice(start, end);
  const filteredOptions = options.map((chain) => ({
    calls: chain.calls.slice(start, end),
    puts: chain.puts.slice(start, end),
  }));

  return {
    ...data,
    expirationDates,
    expirationDatesStringified,
    strikes,
    options: filteredOptions,
  };
}

export function ExplorerDashboard() {
  const { ticker } = useParams({ from: '/$ticker' });
  const search = useSearch({ from: '/$ticker' });
  const navigate = useNavigate();
  const { data: tickers } = useTickers();
  const { saveRecentTicker } = useRecentTickers();

  const direction = search.direction as Direction;
  const metric = search.metric as Metric;
  const strikeRange = search.strikeRange;
  const expirations = search.expirations;
  const sizeMetric = search.sizeMetric as Metric | 'none';

  const upperTicker = ticker.toUpperCase();
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useOptionsData(upperTicker);
  const { isWatched, addTicker, removeTicker } = useWatchlist();

  const isProcessing =
    rawData && 'status' in rawData && rawData.status === 'processing';

  const fullData =
    rawData && !('status' in rawData) && !('message' in rawData)
      ? (rawData as OptionsDataResponse)
      : null;

  const earningsDateRaw = fullData?.earnings_date ?? null;

  const earningsData = useMemo(() => {
    if (!earningsDateRaw) return null;
    const earningsDate = new Date(earningsDateRaw);
    const now = new Date();
    const diffMs = earningsDate.getTime() - now.getTime();
    const daysUntil =
      diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : null;
    const dateStr = earningsDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return { dateStr, daysUntil };
  }, [earningsDateRaw]);

  const maxStrikeRange = useMemo(() => {
    if (!fullData) return 15;
    const stockPrice = parseFloat(fullData.price);
    const atmIndex = fullData.strikes.findIndex(
      (s) => parseFloat(s.replace('$', '')) > stockPrice,
    );
    const center = atmIndex === -1 ? fullData.strikes.length - 1 : atmIndex;
    return Math.max(center, fullData.strikes.length - center - 1, 1);
  }, [fullData]);

  const data = useMemo(() => {
    if (!fullData) return null;
    return filterOptionsData(fullData, strikeRange, expirations);
  }, [fullData, strikeRange, expirations]);

  const watched = isWatched(upperTicker);

  const tickerEntry = tickers?.find((t) => t.t === upperTicker);
  if (data && tickerEntry) {
    saveRecentTicker(upperTicker, tickerEntry.n);
  }

  const isDefault =
    direction === SEARCH_DEFAULTS.direction &&
    metric === SEARCH_DEFAULTS.metric &&
    strikeRange === SEARCH_DEFAULTS.strikeRange &&
    expirations === SEARCH_DEFAULTS.expirations &&
    sizeMetric === SEARCH_DEFAULTS.sizeMetric;

  const updateSearch = (updates: Record<string, string | number>) => {
    navigate({
      to: '/$ticker',
      params: { ticker: upperTicker },
      search: { ...search, ...updates },
      replace: true,
    });
  };

  const resetSearch = () => {
    navigate({
      to: '/$ticker',
      params: { ticker: upperTicker },
      search: SEARCH_DEFAULTS,
      replace: true,
    });
  };

  if (isLoading || isProcessing) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 md:h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col gap-1 shrink-0">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading options data...
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        <Card className="flex-1 min-h-[350px] md:min-h-0 flex flex-col py-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
            <Skeleton className="h-8 w-[108px] rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-2 w-24 rounded-full" />
            <Skeleton className="h-2 w-24 rounded-full" />
          </div>
          <CardContent className="flex-1 min-h-0 p-2 md:p-3">
            <div className="w-full h-full flex flex-col gap-1">
              {Array.from({ length: 6 }).map((_, row) => (
                <div key={row} className="flex gap-1 flex-1">
                  {Array.from({ length: 5 }).map((_, col) => (
                    <Skeleton
                      key={col}
                      className="flex-1 rounded-sm"
                      style={{ animationDelay: `${(row * 5 + col) * 50}ms` }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data || !fullData || (rawData && 'message' in rawData)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-4 md:p-6 md:h-[calc(100vh-3.5rem)]">
        <p className="text-destructive font-medium">
          {error?.message ?? 'Failed to load data'}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const changeIsPositive = data.change.startsWith('+');

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 md:h-[calc(100vh-3.5rem)]">
      {/* Ticker header */}
      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex items-center gap-2">
          <TickerLogo ticker={data.ticker} />
          <h1 className="text-2xl font-bold tracking-tight">{data.ticker}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() =>
              watched
                ? removeTicker(upperTicker)
                : addTicker(upperTicker, data.description)
            }
          >
            <Star
              className={cn(
                'size-4',
                watched && 'fill-current text-yellow-500',
              )}
            />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold font-mono">${data.price}</span>
          <Badge
            variant="secondary"
            className={`gap-1 text-xs ${changeIsPositive ? 'text-emerald-500' : 'text-red-500'}`}
          >
            {changeIsPositive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {data.change_percentage}%
          </Badge>
          {earningsData && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Calendar className="size-3" />
              Earnings: {earningsData.dateStr}
              {earningsData.daysUntil !== null &&
                ` (${earningsData.daysUntil === 0 ? 'Today' : `in ${earningsData.daysUntil}d`})`}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </div>

      {/* Stats row */}
      <SummaryStats
        data={fullData}
        updatedAt={data.updated_at}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Lightbulb className="size-3.5" />
              <span className="hidden sm:inline">Insights</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-[90vw]" align="end">
            <InsightsCard data={fullData} earningsData={earningsData} />
          </PopoverContent>
        </Popover>
      </SummaryStats>

      {/* Heatmap card with toolbar */}
      <Card className="flex-1 min-h-[350px] md:min-h-0 flex flex-col py-0 overflow-hidden">
        <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-b shrink-0">
          <DirectionToggle
            value={direction}
            onChange={(v) => updateSearch({ direction: v })}
          />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <MetricSelect
            label="Color"
            value={metric}
            onChange={(v) => updateSearch({ metric: v })}
          />
          <SizeSelect
            value={sizeMetric}
            onChange={(v) => updateSearch({ sizeMetric: v })}
          />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <RangeSliders
            strikeRange={strikeRange}
            expirations={expirations}
            maxStrikeRange={maxStrikeRange}
            maxExpirations={fullData?.expirationDates.length ?? 20}
            onStrikeRangeChange={(v) => updateSearch({ strikeRange: v })}
            onExpirationsChange={(v) => updateSearch({ expirations: v })}
          />
          {!isDefault && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-8 gap-1.5 text-muted-foreground"
              onClick={resetSearch}
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
          <InfoDialog className={isDefault ? 'ml-auto' : ''} />
        </div>
        <CardContent className="flex-1 min-h-0 p-2 md:p-3">
          <HeatmapView
            data={data}
            direction={direction}
            metric={metric}
            sizeMetric={sizeMetric === 'none' ? null : sizeMetric}
          />
        </CardContent>
      </Card>
    </div>
  );
}
