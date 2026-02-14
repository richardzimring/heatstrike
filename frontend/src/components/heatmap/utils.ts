import { scaleLinear } from '@visx/scale';
import type { OptionsDataResponse, Direction, Metric, Option } from '@/types';

export interface CellData {
  strike: string;
  strikeIndex: number;
  date: string;
  dateStr: string;
  dateIndex: number;
  value: number | null; // null = metric unavailable; number = real value (including 0)
  option: Option | null; // null = option doesn't exist at this grid point
}

export function getMetricValue(
  option: Option,
  metric: Metric,
): number | null {
  const raw = option[metric];
  if (raw === null || raw === undefined || raw === '') return null;
  return Math.abs(parseFloat(raw));
}

export function transformData(
  data: OptionsDataResponse,
  direction: Direction,
  metric: Metric,
): { cells: CellData[]; maxValue: number } {
  const cells: CellData[] = [];
  let maxValue = 0;

  data.options.forEach((optionChain, dateIndex) => {
    const options =
      direction === 'calls' ? optionChain.calls : optionChain.puts;

    options.forEach((option, strikeIndex) => {
      const value = option !== null ? getMetricValue(option, metric) : null;
      if (value !== null) {
        maxValue = Math.max(maxValue, value);
      }

      cells.push({
        strike: data.strikes[strikeIndex] ?? '',
        strikeIndex,
        date: data.expirationDates[dateIndex] ?? '',
        dateStr: data.expirationDatesStringified[dateIndex] ?? '',
        dateIndex,
        value,
        option,
      });
    });
  });

  return { cells, maxValue };
}

/**
 * Build the Nasdaq option-chain URL for a given cell.
 * Returns `null` if the cell has no option data.
 */
export function buildNasdaqUrl(
  ticker: string,
  option: Option | null,
): string | null {
  if (!option) return null;
  const t = ticker.replace('/', '');
  const baseUrl = 'https://www.nasdaq.com/market-activity/stocks';
  const symbolID = `${'-'.repeat(4 - t.length)}${option.symbol.substring(
    t.length,
  )}`;
  return `${baseUrl}/${ticker.replace(
    '/',
    '.',
  )}/option-chain/call-put-options/${t}--${symbolID}`;
}

/**
 * Create a color scale for the heatmap based on direction and theme.
 * In dark mode, zero maps to the dark background color; in light mode, zero maps to white.
 */
export function createHeatmapColorScale(
  direction: Direction,
  isDark: boolean,
  maxValue: number,
) {
  return scaleLinear<string>({
    domain: [0, maxValue || 1],
    range:
      direction === 'calls'
        ? isDark
          ? ['hsl(0, 0%, 3.9%)', 'hsl(142, 76%, 36%)'] // dark background to green
          : ['hsl(0, 0%, 100%)', 'hsl(142, 76%, 36%)'] // white to green
        : isDark
          ? ['hsl(0, 0%, 3.9%)', 'hsl(0, 84%, 50%)'] // dark background to red
          : ['hsl(0, 0%, 100%)', 'hsl(0, 84%, 50%)'], // white to red
  });
}
