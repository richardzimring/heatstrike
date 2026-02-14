import { useTheme } from 'next-themes';
import type { Direction, Metric } from '@/types';
import { getHeatmapColorRange } from './utils';

interface ColorScaleLegendProps {
  direction: Direction;
  maxValue: number;
  metric: Metric;
}

function formatLegendValue(value: number, metric: Metric): string {
  if (metric === 'mid_iv') return `${(value * 100).toFixed(1)}%`;
  return value.toLocaleString();
}

export function ColorScaleLegend({
  direction,
  maxValue,
  metric,
}: ColorScaleLegendProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [lowColor, highColor] = getHeatmapColorRange(direction, isDark);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground">0</span>
        <div
          className="h-2 w-24 rounded-sm"
          style={{
            background: `linear-gradient(to right, ${lowColor}, ${highColor})`,
          }}
        />
        <span className="text-[10px] text-muted-foreground">
          {maxValue > 0 ? formatLegendValue(maxValue, metric) : '—'}
        </span>
      </div>
    </div>
  );
}
