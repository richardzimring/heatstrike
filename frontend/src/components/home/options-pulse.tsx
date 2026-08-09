import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { TickerLogo } from '@/components/ticker-logo';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { OptionsPulseRow } from '@/lib/options-pulse';

function isPositiveChange(change: string): boolean {
  return change.startsWith('+') || (!change.startsWith('-') && change !== '');
}

function formatChange(change: string): string | null {
  if (!change) return null;
  const raw = change.replace(/%/g, '').trim();
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    const bare = change.replace(/^[+-]/, '').replace(/%/g, '');
    if (change.startsWith('-')) return `-${bare}%`;
    if (change.startsWith('+')) return `+${bare}%`;
    return `${bare}%`;
  }
  const rounded = Math.round(n * 10) / 10;
  const abs = Math.abs(rounded).toFixed(1);
  if (rounded > 0) return `+${abs}%`;
  if (rounded < 0) return `-${abs}%`;
  return `${abs}%`;
}

function formatPrice(price: string): string | null {
  if (!price) return null;
  const n = Number(price);
  if (!Number.isFinite(n)) return price.startsWith('$') ? price : `$${price}`;
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isRowReady(row: OptionsPulseRow): boolean {
  return Boolean(row.price || row.change_percentage);
}

const tileGridClass =
  'grid grid-cols-[repeat(auto-fill,minmax(9.25rem,1fr))] gap-2';

function TickerTileSkeleton() {
  return (
    <div className="flex w-full flex-col gap-2.5 rounded-md border bg-card px-2.5 py-3">
      <div className="flex items-center gap-1.5">
        <Skeleton className="size-5 rounded-md" />
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

function TickerTile({
  row,
  onRemove,
  removeLabel,
}: {
  row: OptionsPulseRow;
  onRemove?: (ticker: string) => void;
  removeLabel: string;
}) {
  const navigate = useNavigate();
  const ready = isRowReady(row);
  const price = formatPrice(row.price);
  const change = formatChange(row.change_percentage);
  const positive = isPositiveChange(row.change_percentage);

  return (
    <div className="group relative w-full rounded-md border bg-card transition-colors hover:bg-muted/40">
      <button
        type="button"
        onClick={() =>
          navigate({
            to: '/$ticker',
            params: { ticker: row.ticker },
            search: {
              direction: 'calls',
              metric: 'volume',
            },
          })
        }
        className="flex w-full cursor-pointer flex-col gap-2.5 px-2.5 py-3 text-left"
      >
        <div className="flex items-center gap-1.5">
          <TickerLogo ticker={row.ticker} />
          <span className="font-mono text-sm font-bold tracking-tight">
            {row.ticker}
          </span>
        </div>

        {ready ? (
          <div className="flex items-center gap-1.5">
            {price && (
              <span className="font-mono text-sm font-semibold tabular-nums">
                {price}
              </span>
            )}
            {change && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs transition-colors group-hover:bg-card',
                  positive ? 'text-emerald-500' : 'text-red-500',
                )}
              >
                {change}
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        )}
      </button>

      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${row.ticker} from ${removeLabel}`}
          onClick={() => onRemove(row.ticker)}
          className="absolute right-1.5 top-1.5 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function TickerTiles({
  rows,
  isLoading,
  onRemove,
  removeLabel = 'list',
}: {
  rows: OptionsPulseRow[];
  isLoading?: boolean;
  onRemove?: (ticker: string) => void;
  removeLabel?: string;
}) {
  if (isLoading && rows.length === 0) {
    return (
      <div className={tileGridClass}>
        {Array.from({ length: 8 }, (_, i) => (
          <TickerTileSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={tileGridClass}>
      {rows.map((row) => (
        <TickerTile
          key={row.ticker}
          row={row}
          onRemove={onRemove}
          removeLabel={removeLabel}
        />
      ))}
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      {children}
    </section>
  );
}

interface OptionsPulseProps {
  favorites: OptionsPulseRow[];
  recent: OptionsPulseRow[];
  indexes: OptionsPulseRow[];
  popular: OptionsPulseRow[];
  favoritesLoading?: boolean;
  recentLoading?: boolean;
  indexesLoading?: boolean;
  popularLoading?: boolean;
  onRemoveRecent?: (ticker: string) => void;
  onRemoveFavorite?: (ticker: string) => void;
}

export function OptionsPulse({
  favorites,
  recent,
  indexes,
  popular,
  favoritesLoading,
  recentLoading,
  indexesLoading,
  popularLoading,
  onRemoveRecent,
  onRemoveFavorite,
}: OptionsPulseProps) {
  return (
    <div className="flex flex-col gap-8">
      {favorites.length > 0 && (
        <Section label="Watchlist">
          <TickerTiles
            rows={favorites}
            isLoading={favoritesLoading}
            onRemove={onRemoveFavorite}
            removeLabel="watchlist"
          />
        </Section>
      )}
      {recent.length > 0 && (
        <Section label="Recent">
          <TickerTiles
            rows={recent}
            isLoading={recentLoading}
            onRemove={onRemoveRecent}
            removeLabel="recent"
          />
        </Section>
      )}
      <Section label="Popular">
        <TickerTiles rows={popular} isLoading={popularLoading} />
      </Section>
      {indexes.length > 0 && (
        <Section label="Indexes">
          <TickerTiles rows={indexes} isLoading={indexesLoading} />
        </Section>
      )}
    </div>
  );
}
