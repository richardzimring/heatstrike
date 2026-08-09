import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRecentTickers } from '@/hooks/use-recent-tickers';
import { cn } from '@/lib/utils';
import { TickerLogo } from '@/components/ticker-logo';

interface TickerEntry {
  t: string;
  n: string;
}

interface TickerSearchProps {
  tickers: TickerEntry[];
}

/** Lower is better. Exact symbol beats name substring noise like "ARE" in "SOFTWARE". */
function matchRank(ticker: TickerEntry, query: string): number | null {
  const symbol = ticker.t.toUpperCase();
  const name = ticker.n.toUpperCase();

  if (symbol === query) return 0;
  if (symbol.startsWith(query)) return 1;

  // Short queries stay prefix-only on the symbol to avoid huge lists.
  if (query.length <= 2) return null;

  if (symbol.includes(query)) return 2;
  if (name.startsWith(query)) return 3;
  if (name.includes(query)) return 4;
  return null;
}

function searchTickers(tickers: TickerEntry[], query: string): TickerEntry[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];

  return tickers
    .map((ticker) => ({ ticker, rank: matchRank(ticker, q) }))
    .filter(
      (entry): entry is { ticker: TickerEntry; rank: number } =>
        entry.rank !== null,
    )
    .sort(
      (a, b) => a.rank - b.rank || a.ticker.t.localeCompare(b.ticker.t),
    )
    .slice(0, 8)
    .map((entry) => entry.ticker);
}

export function TickerSearch({ tickers }: TickerSearchProps) {
  const navigate = useNavigate();
  const { recents, saveRecentTicker, removeRecentTicker } = useRecentTickers();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => searchTickers(tickers, query),
    [tickers, query],
  );

  const showRecents = query.length === 0 && recents.length > 0;
  const items = showRecents ? recents : results;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectTicker = (ticker: string, name: string) => {
    saveRecentTicker(ticker, name);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
    navigate({
      to: '/$ticker',
      params: { ticker },
      search: { direction: 'calls', metric: 'volume' },
    });
  };

  const submitQuery = () => {
    const highlighted = highlightIndex >= 0 ? items[highlightIndex] : null;
    if (highlighted) {
      selectTicker(highlighted.t, highlighted.n);
      return;
    }

    const q = query.trim().toUpperCase();
    if (q) {
      const exact = tickers.find((t) => t.t.toUpperCase() === q);
      if (exact) {
        selectTicker(exact.t, exact.n);
        return;
      }
    }

    const first = items[0];
    if (first) selectTicker(first.t, first.n);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length === 0) return;
      setHighlightIndex((prev) =>
        prev < 0 ? 0 : Math.min(prev + 1, items.length - 1),
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      setHighlightIndex((prev) => (prev <= 0 ? 0 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submitQuery();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search tickers..."
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setIsOpen(true);
            // Prefer the top-ranked match so Enter works without arrowing.
            setHighlightIndex(next.trim() ? 0 : -1);
          }}
          onFocus={() => {
            setHighlightIndex(-1);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="pl-9 h-9 text-base md:text-sm"
        />
      </div>

      {isOpen && items.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover p-1 shadow-md">
          {showRecents && (
            <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              Recent
            </div>
          )}
          {items.map((item, i) => (
            <div
              key={item.t}
              className={cn(
                'group/item flex items-center gap-1 rounded-md',
                i === highlightIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
              )}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-sm"
                onClick={() => selectTicker(item.t, item.n)}
              >
                <TickerLogo ticker={item.t} />
                <span className="font-mono font-medium">{item.t}</span>
                <span className="truncate text-muted-foreground">{item.n}</span>
              </button>
              {showRecents && (
                <button
                  type="button"
                  aria-label={`Remove ${item.t} from recent`}
                  className={cn(
                    'mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-opacity hover:text-foreground focus-visible:opacity-100',
                    i === highlightIndex
                      ? 'opacity-100'
                      : 'opacity-0 group-hover/item:opacity-100',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentTicker(item.t);
                    setHighlightIndex(-1);
                  }}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
