import { Github } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { BugReportDialog } from './BugReportDialog';
import { Button } from '@/components/ui/button';
import { TickerInput } from '@/components/controls/TickerInput';

interface HeaderProps {
  ticker: string;
  setTicker: (ticker: string) => void;
  isLoading: boolean;
  onReset: () => void;
}

export function Header({ ticker, setTicker, isLoading, onReset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-14 w-full max-w-6xl mx-auto items-center px-3 sm:px-6 gap-3 sm:gap-4">
        <button
          onClick={onReset}
          className="flex items-center gap-4 mr-1 sm:mr-4 shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
          aria-label="Reset to default state"
        >
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Options Heatmap" className="h-6 w-6 shrink-0" />
          <span className="font-semibold text-lg hidden sm:inline-block">
            Heatstrike
          </span>
        </button>

        <div className="flex-1 max-w-sm">
          <TickerInput
            value={ticker}
            onChange={setTicker}
            isLoading={isLoading}
            className="w-full"
          />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/richardzimring/heatmap"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
          <BugReportDialog />
        </div>
      </div>
    </header>
  );
}
