import { useNavigate } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TickerLogo } from '@/components/ticker-logo';
import type { QuoteSummary } from '@/lib/api/generated';

const POPULAR_TICKERS = [
  'AAPL',
  'TSLA',
  'NVDA',
  'AMZN',
  'MSFT',
  'META',
  'GOOG',
  'AMD',
] as const;

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toLocaleString();
}

function formatRelVol(volume: number, avgVolume: number): string {
  if (avgVolume === 0) return '--';
  return `${(volume / avgVolume).toFixed(1)}x`;
}

function formatEarningsDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ActiveTickersProps {
  quotesMap: Map<string, QuoteSummary>;
  isLoading: boolean;
}

function TickerRow({
  ticker,
  quote,
  isLoading,
  showDayRange,
  showEarnings,
}: {
  ticker: string;
  quote: QuoteSummary | undefined;
  isLoading: boolean;
  showDayRange: boolean;
  showEarnings: boolean;
}) {
  const navigate = useNavigate();

  if (isLoading || !quote) {
    return (
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-md" />
            <span className="font-mono font-medium">{ticker}</span>
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-10" />
        </TableCell>
        {showDayRange && (
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
        )}
        {showEarnings && (
          <TableCell>
            <Skeleton className="h-4 w-14" />
          </TableCell>
        )}
      </TableRow>
    );
  }

  const relVol = formatRelVol(quote.volume, quote.average_volume);
  const relVolNum =
    quote.average_volume > 0 ? quote.volume / quote.average_volume : 0;

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() =>
        navigate({
          to: '/$ticker',
          params: { ticker },
          search: { direction: 'calls', metric: 'volume' },
        })
      }
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <TickerLogo ticker={ticker} />
          <span className="font-mono font-medium">{ticker}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono">${quote.price}</TableCell>
      <TableCell
        className={`font-mono ${quote.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}
      >
        {quote.change_percentage}%
      </TableCell>
      <TableCell className="font-mono">{formatVolume(quote.volume)}</TableCell>
      <TableCell
        className={`font-mono ${relVolNum >= 1.5 ? 'text-emerald-500' : relVolNum <= 0.5 ? 'text-red-500' : ''}`}
      >
        {relVol}
      </TableCell>
      {showDayRange && (
        <TableCell className="font-mono">
          {quote.high !== null && quote.low !== null
            ? `$${quote.low.toFixed(2)} – $${quote.high.toFixed(2)}`
            : '--'}
        </TableCell>
      )}
      {showEarnings && (
        <TableCell className="font-mono text-muted-foreground">
          {formatEarningsDate(quote.earnings_date)}
        </TableCell>
      )}
    </TableRow>
  );
}

export function ActiveTickers({ quotesMap, isLoading }: ActiveTickersProps) {
  const showDayRange = POPULAR_TICKERS.some((t) => {
    const q = quotesMap.get(t);
    return q?.high !== null && q?.low !== null;
  });
  const showEarnings = POPULAR_TICKERS.some(
    (t) => quotesMap.get(t)?.earnings_date,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Tickers</CardTitle>
        <CardDescription>
          Price and activity for the most-watched stocks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Rel Vol</TableHead>
              {showDayRange && <TableHead>Day Range</TableHead>}
              {showEarnings && <TableHead>Earnings</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {POPULAR_TICKERS.map((ticker) => (
              <TickerRow
                key={ticker}
                ticker={ticker}
                quote={quotesMap.get(ticker)}
                isLoading={isLoading}
                showDayRange={showDayRange}
                showEarnings={showEarnings}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
