import { Slider } from '@/components/ui/slider';

interface RangeSlidersProps {
  strikeRange: number;
  expirations: number;
  maxStrikeRange?: number;
  maxExpirations?: number;
  onStrikeRangeChange: (value: number) => void;
  onExpirationsChange: (value: number) => void;
}

export function RangeSliders({
  strikeRange,
  expirations,
  maxStrikeRange = 15,
  maxExpirations = 20,
  onStrikeRangeChange,
  onExpirationsChange,
}: RangeSlidersProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Strikes
        </span>
        <Slider
          className="w-20 md:w-28"
          value={[strikeRange]}
          onValueChange={([v]) => {
            if (v !== undefined) onStrikeRangeChange(v);
          }}
          min={1}
          max={maxStrikeRange}
          step={1}
        />
        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
          ±{strikeRange}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Expirations
        </span>
        <Slider
          className="w-20 md:w-28"
          value={[expirations]}
          onValueChange={([v]) => {
            if (v !== undefined) onExpirationsChange(v);
          }}
          min={1}
          max={maxExpirations}
          step={1}
        />
        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
          {expirations}
        </span>
      </div>
    </div>
  );
}
