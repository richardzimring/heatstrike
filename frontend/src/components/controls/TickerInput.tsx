import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTickers } from '@/hooks/useTickers';
import type { TickerEntry } from '@/lib/api/generated';

const MAX_RESULTS = 8;

interface TickerInputProps {
  value: string;
  onChange: (ticker: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Filter and rank tickers based on query.
 * - 1-2 char queries: match only ticker prefixes
 * - 3+ char queries: also match company name (case-insensitive substring)
 * - Exact ticker match always appears first
 */
function filterTickers(tickers: TickerEntry[], query: string): TickerEntry[] {
  if (!query) return [];

  const q = query.toUpperCase();
  const qLower = query.toLowerCase();
  const isShort = q.length <= 2;

  const exactMatch: TickerEntry[] = [];
  const prefixMatches: TickerEntry[] = [];
  const nameMatches: TickerEntry[] = [];

  for (const entry of tickers) {
    if (entry.t === q) {
      exactMatch.push(entry);
    } else if (entry.t.startsWith(q)) {
      prefixMatches.push(entry);
    } else if (!isShort && entry.n.toLowerCase().includes(qLower)) {
      nameMatches.push(entry);
    }
  }

  return [...exactMatch, ...prefixMatches, ...nameMatches].slice(
    0,
    MAX_RESULTS,
  );
}

export function TickerInput({
  value,
  onChange,
  isLoading,
  className,
}: TickerInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const { data: tickers = [] } = useTickers();

  const results = filterTickers(tickers, inputValue);

  // Sync internal state with prop value when it changes externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results.length]);

  const selectTicker = useCallback(
    (ticker: string) => {
      setInputValue(ticker);
      setIsOpen(false);
      setHighlightedIndex(-1);
      onChange(ticker);
    },
    [onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(val.trim().length > 0);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && inputValue.trim()) {
        setIsOpen(true);
        return;
      }
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && results[highlightedIndex]) {
        selectTicker(results[highlightedIndex].t);
      } else {
        // Only submit if the typed value matches a valid ticker
        const trimmed = inputValue.trim().toUpperCase();
        const isValid = tickers.some((entry) => entry.t === trimmed);
        if (isValid && trimmed !== value) {
          selectTicker(trimmed);
        } else if (results.length === 1) {
          // Auto-select the only matching result
          selectTicker(results[0].t);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleFocus = () => {
    if (inputValue.trim()) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay closing so that click on dropdown item registers first
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      if (!inputValue.trim()) {
        setInputValue(value);
      }
    }, 150);
  };

  const handleItemMouseDown = (ticker: string) => {
    // Prevent the blur handler from closing the dropdown before selection
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    selectTicker(ticker);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Search ticker or company..."
        className="pl-9 h-9 w-[250px] bg-muted/50 focus:bg-background transition-colors border"
        disabled={isLoading}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
        aria-haspopup="listbox"
        aria-autocomplete="list"
      />

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[320px] overflow-y-auto rounded-md border bg-popover shadow-md"
        >
          {results.map((entry, index) => (
            <button
              key={entry.t}
              role="option"
              aria-selected={index === highlightedIndex}
              className={cn(
                'flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm cursor-pointer transition-colors',
                index === highlightedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50',
              )}
              onMouseDown={() => handleItemMouseDown(entry.t)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="font-semibold shrink-0">{entry.t}</span>
              <span className="text-muted-foreground truncate text-xs">
                {entry.n}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
