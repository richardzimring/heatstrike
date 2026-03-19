import { useNavigate } from '@tanstack/react-router';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
      <Card className="cursor-pointer transition-[transform] duration-200 hover:bg-accent/50 hover:-translate-y-0.5 hover:ring-foreground/20">
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
      className="cursor-pointer transition-[transform] duration-200 hover:bg-accent/50 hover:-translate-y-0.5 hover:ring-foreground/20"
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
          <span className="text-2xl font-semibold font-mono">
            ${quote.price}
          </span>
          <Badge
            variant="secondary"
            className={`gap-1 text-xs ${changeIsPositive ? 'text-emerald-500' : 'text-red-500'}`}
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
