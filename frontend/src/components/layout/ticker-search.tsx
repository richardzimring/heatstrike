import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRecentTickers } from '@/hooks/useRecentTickers';
import { cn } from '@/lib/utils';
import { TickerLogo } from '@/components/ticker-logo';

interface TickerEntry {
  t: string;
  n: string;
}

interface TickerSearchProps {
  tickers: TickerEntry[];
  currentTicker?: string;
}

export function TickerSearch({ tickers, currentTicker }: TickerSearchProps) {
  const navigate = useNavigate();
  const { recents, saveRecentTicker } = useRecentTickers();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.length === 0
    ? []
    : tickers
        .filter((t) => {
          const q = query.toUpperCase();
          if (query.length <= 2) {
            return t.t.startsWith(q);
          }
          return t.t.includes(q) || t.n.toUpperCase().includes(q);
        })
        .slice(0, 8);

  const showRecents = query.length === 0 && recents.length > 0;
  const items = showRecents ? recents : results;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = isFocused ? query : (currentTicker ?? '');

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      const item = items[highlightIndex];
      if (item) selectTicker(item.t, item.n);
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
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setQuery('');
            setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className="pl-9 h-9"
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
            <button
              key={item.t}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                i === highlightIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
              )}
              onMouseEnter={() => setHighlightIndex(i)}
              onClick={() => selectTicker(item.t, item.n)}
            >
              <TickerLogo ticker={item.t} />
              <span className="font-mono font-medium">{item.t}</span>
              <span className="truncate text-muted-foreground">{item.n}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
