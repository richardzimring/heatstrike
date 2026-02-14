import { useState } from 'react';
import { Github, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ThemeToggle } from './ThemeToggle';
import { FeedbackDialog } from './FeedbackDialog';
import { InfoDialog } from './InfoDialog';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { TickerInput } from '@/components/controls/TickerInput';

interface HeaderProps {
  ticker: string;
  setTicker: (ticker: string) => void;
  isLoading: boolean;
  onReset: () => void;
}

export function Header({ ticker, setTicker, isLoading, onReset }: HeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 relative">
      {/* Ticker input centered on full screen width */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <TickerInput
          value={ticker}
          onChange={setTicker}
          isLoading={isLoading}
        />
      </div>

      <div className="flex h-14 w-full max-w-6xl mx-auto items-center px-3 sm:px-6 gap-3 sm:gap-4">
        <button
          onClick={onReset}
          className="flex items-center gap-4 mr-1 sm:mr-4 shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
          aria-label="Reset to default state"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="Options Heatmap"
            className="h-6 w-6 shrink-0"
          />
          <span className="font-semibold text-lg hidden sm:inline-block">
            Heatstrike
          </span>
        </button>

        <div className="flex-1" />

        {/* Desktop: inline buttons */}
        <div className="hidden sm:flex items-center justify-end gap-2">
          <ThemeToggle />
          <InfoDialog />
          <FeedbackDialog />
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/richardzimring/heatstrike"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
        </div>

        {/* Mobile: hamburger menu */}
        <div className="flex sm:hidden items-center justify-end">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-48">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-4">
                <Button
                  variant="ghost"
                  className="justify-start gap-3 h-11"
                  onClick={() => {
                    setTheme(theme === 'light' ? 'dark' : 'light');
                  }}
                >
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <span>Toggle theme</span>
                </Button>
                <InfoDialog triggerClassName="justify-start gap-3 h-11 w-full" triggerLabel="How it works" />
                <FeedbackDialog triggerClassName="justify-start gap-3 h-11 w-full" triggerLabel="Send feedback" />
                <Button
                  variant="ghost"
                  className="justify-start gap-3 h-11"
                  asChild
                >
                  <a
                    href="https://github.com/richardzimring/heatstrike"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-5 w-5" />
                    <span>View on GitHub</span>
                  </a>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
