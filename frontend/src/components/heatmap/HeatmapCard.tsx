import { ParentSize } from '@visx/responsive';
import { Heatmap } from './Heatmap';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { formatRelativeTime } from '@/lib/utils';
import type { OptionsDataResponse, Direction, Metric } from '@/types';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { DirectionSelect } from '@/components/controls/DirectionSelect';
import { MetricSelect } from '@/components/controls/MetricSelect';

interface HeatmapCardProps {
  data: OptionsDataResponse | undefined;
  direction: Direction;
  metric: Metric;
  setDirection: (direction: Direction) => void;
  setMetric: (metric: Metric) => void;
  isLoading: boolean;
  error: Error | null;
}

function LoadingState() {
  return (
    <div className="flex flex-col flex-1 gap-4 min-h-0">
      {/* Header skeleton - matches loaded header layout */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 shrink-0">
        {/* Left side - Stock info skeleton */}
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          {/* Ticker */}
          <Skeleton className="h-4 w-full sm:w-12 rounded" />
          {/* Description */}
          <Skeleton className="h-8 w-full sm:w-48 rounded" />
          {/* Price + change row */}
          <div className="flex items-baseline gap-2 mt-1">
            <Skeleton className="h-8 w-full sm:w-28 rounded" />
            <Skeleton className="h-5 w-full sm:w-32 rounded" />
          </div>
        </div>

        {/* Right side - Controls skeleton */}
        <div className="flex gap-2 w-full sm:w-auto sm:self-end">
          <Skeleton className="h-9 flex-1 sm:flex-none sm:w-[120px] rounded-md" />
          <Skeleton className="h-9 flex-1 sm:flex-none sm:w-[120px] rounded-md" />
        </div>
      </div>

      {/* Card with spinner */}
      <Card className="border-border flex-1 flex flex-col min-h-0">
        <CardContent className="flex flex-1 items-center justify-center p-6 min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Loading options data...
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Updated time footnote skeleton */}
      <div className="flex justify-end shrink-0">
        <Skeleton className="h-4 w-36 rounded" />
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <Card className="border-border">
      <CardContent className="flex h-[500px] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <div className="flex flex-col gap-1">
            <p className="text-destructive font-medium">Something went wrong</p>
            <p className="text-muted-foreground text-sm max-w-md">
              An unexpected error occurred. Please try again.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-border">
      <CardContent className="flex h-[500px] items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">
          Enter a ticker to view options data
        </p>
      </CardContent>
    </Card>
  );
}

export function HeatmapCard({
  data,
  direction,
  metric,
  setDirection,
  setMetric,
  isLoading,
  error,
}: HeatmapCardProps) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;
  if (!data) return <EmptyState />;

  const isPositiveChange = data.change_percentage.startsWith('+');
  const TrendIcon = isPositiveChange ? TrendingUp : TrendingDown;

  return (
    <div className="flex flex-col flex-1 gap-4 min-h-0">
      {/* Header outside card */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 shrink-0">
        {/* Left side - Stock info */}
        <div className="flex flex-col gap-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {data.ticker}
          </div>
          <h2 className="text-3xl font-normal tracking-tight leading-none">
            {data.description}
          </h2>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-normal">${data.price}</span>
            <div
              className={`flex items-center gap-1 text-base font-medium ${
                isPositiveChange
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
              }`}
            >
              <TrendIcon className="h-4 w-4" />
              <span>
                {data.change} ({data.change_percentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Controls */}
        <div className="flex gap-2 w-full sm:w-auto sm:self-end">
          <DirectionSelect value={direction} onChange={setDirection} />
          <MetricSelect value={metric} onChange={setMetric} />
        </div>
      </div>

      {/* Card with heatmap */}
      <Card className="border-border flex-1 flex flex-col min-h-0">
        <CardContent className="p-2 sm:p-4 flex-1 flex flex-col min-h-0">
          <div className="relative flex-1 w-full min-h-[300px]">
            <div className="absolute inset-0">
              <ParentSize>
                {({ width, height }) => (
                  <Heatmap
                    data={data}
                    direction={direction}
                    metric={metric}
                    width={width}
                    height={height}
                  />
                )}
              </ParentSize>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Updated time footnote */}
      <div className="hidden sm:block text-xs text-muted-foreground text-right shrink-0">
        Updated {formatRelativeTime(data.updated_at)}
      </div>
    </div>
  );
}
