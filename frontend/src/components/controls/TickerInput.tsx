import { useState, useEffect, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TickerInputProps {
  value: string;
  onChange: (ticker: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function TickerInput({
  value,
  onChange,
  isLoading,
  className,
}: TickerInputProps) {
  const [inputValue, setInputValue] = useState(value);

  // Sync internal state with prop value when it changes externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const trimmed = inputValue.trim().toUpperCase();
      if (trimmed && trimmed !== value) {
        onChange(trimmed);
      }
    }
  };

  const handleBlur = () => {
    if (!inputValue.trim()) {
      setInputValue(value);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="AAPL"
        className="pl-9 h-9 uppercase w-[200px] bg-muted/50 focus:bg-background transition-colors border"
        maxLength={5}
        disabled={isLoading}
      />
    </div>
  );
}
