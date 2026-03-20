import { useNavigate } from '@tanstack/react-router';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWatchlist } from '@/hooks/use-watchlist';
import { TickerLogo } from '@/components/ticker-logo';
import type { QuoteSummary } from '@/lib/api/generated';

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toLocaleString();
}

interface WatchlistCardsProps {
  quotesMap: Map<string, QuoteSummary>;
  isLoading: boolean;
}

function WatchlistCard({
  ticker,
  name,
  quote,
  isLoading,
}: {
  ticker: string;
  name: string;
  quote: QuoteSummary | undefined;
  isLoading: boolean;
}) {
  const navigate = useNavigate();

  if (isLoading || !quote) {
    return (
      <Card className="cursor-pointer transition-colors hover:bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))]">
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-md" />
            <span className="font-mono">{ticker}</span>
          </CardTitle>
          <CardDescription className="truncate">{name}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-20 mb-1" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  const changeIsPositive = quote.change.startsWith('+');

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))]"
      onClick={() =>
        navigate({
          to: '/$ticker',
          params: { ticker },
          search: { direction: 'calls', metric: 'volume' },
        })
      }
    >
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2">
          <TickerLogo ticker={ticker} />
          <span className="font-mono">{ticker}</span>
        </CardTitle>
        <CardDescription className="truncate">{name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold font-mono">
            ${quote.price}
          </span>
          <Badge
            variant="secondary"
            className={`gap-1 bg-background text-xs dark:bg-secondary ${changeIsPositive ? 'text-emerald-500' : 'text-red-500'}`}
          >
            {changeIsPositive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {quote.change_percentage}%
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatVolume(quote.volume)} vol
        </p>
      </CardContent>
    </Card>
  );
}

export function WatchlistCards({ quotesMap, isLoading }: WatchlistCardsProps) {
  const { tickers } = useWatchlist();

  if (tickers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="size-4" />
            Watchlist
          </CardTitle>
          <CardDescription>
            Add tickers to your watchlist from the Explorer page
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Star className="size-4" />
        Watchlist
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tickers.map((item) => (
          <WatchlistCard
            key={item.t}
            ticker={item.t}
            name={item.n}
            quote={quotesMap.get(item.t)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
