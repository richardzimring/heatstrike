import { useNavigate } from '@tanstack/react-router';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { QuoteSummary } from '@/lib/api/generated';

const MARKET_TICKERS = ['SPY', 'QQQ', 'IWM', 'DIA'] as const;

const LABELS: Record<string, string> = {
  SPY: 'S&P 500',
  QQQ: 'Nasdaq 100',
  IWM: 'Russell 2000',
  DIA: 'Dow Jones',
};

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toLocaleString();
}

interface MarketCardsProps {
  quotesMap: Map<string, QuoteSummary>;
  isLoading: boolean;
}

function MarketCard({
  ticker,
  quote,
  isLoading,
}: {
  ticker: string;
  quote: QuoteSummary | undefined;
  isLoading: boolean;
}) {
  const navigate = useNavigate();

  if (isLoading || !quote) {
    return (
      <Card className="cursor-pointer transition-colors hover:bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))]">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {LABELS[ticker] ?? ticker}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-4 w-16" />
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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {LABELS[ticker] ?? ticker}
        </CardTitle>
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
              <TrendingUp className="hidden size-3 sm:inline-block" />
            ) : (
              <TrendingDown className="hidden size-3 sm:inline-block" />
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

export function MarketCards({ quotesMap, isLoading }: MarketCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {MARKET_TICKERS.map((ticker) => (
        <MarketCard
          key={ticker}
          ticker={ticker}
          quote={quotesMap.get(ticker)}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
