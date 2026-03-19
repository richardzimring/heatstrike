import { scaleLinear } from '@visx/scale';
import type { OptionsDataResponse, Direction, Metric, Option } from '@/types';

export interface CellData {
  strike: string;
  strikeIndex: number;
  date: string;
  dateStr: string;
  dateIndex: number;
  value: number | null;
  sizeValue: number | null;
  option: Option | null;
}

export function getMetricValue(option: Option, metric: Metric): number | null {
  if (metric === 'vol_oi_ratio') {
    const vol = parseFloat(option.volume ?? '');
    const oi = parseFloat(option.open_interest ?? '');
    if (Number.isNaN(vol) || Number.isNaN(oi) || oi === 0) return null;
    return vol / oi;
  }
  const raw = option[metric as keyof Option];
  if (raw === null || raw === undefined || raw === '') return null;
  return Math.abs(parseFloat(raw as string));
}

export function transformData(
  data: OptionsDataResponse,
  direction: Direction,
  metric: Metric,
  sizeMetric: Metric | null,
): { cells: CellData[]; maxValue: number; maxSizeValue: number } {
  const cells: CellData[] = [];
  let maxValue = 0;
  let maxSizeValue = 0;

  data.options.forEach((optionChain, dateIndex) => {
    const options =
      direction === 'calls' ? optionChain.calls : optionChain.puts;

    options.forEach((option, strikeIndex) => {
      const value = option !== null ? getMetricValue(option, metric) : null;
      if (value !== null) maxValue = Math.max(maxValue, value);

      let sizeValue: number | null = null;
      if (sizeMetric && option !== null) {
        sizeValue = getMetricValue(option, sizeMetric);
        if (sizeValue !== null) maxSizeValue = Math.max(maxSizeValue, sizeValue);
      }

      cells.push({
        strike: data.strikes[strikeIndex] ?? '',
        strikeIndex,
        date: data.expirationDates[dateIndex] ?? '',
        dateStr: data.expirationDatesStringified[dateIndex] ?? '',
        dateIndex,
        value,
        sizeValue,
        option,
      });
    });
  });

  return { cells, maxValue, maxSizeValue };
}

export function buildNasdaqUrl(
  ticker: string,
  option: Option | null,
): string | null {
  if (!option) return null;
  const t = ticker.replace('/', '');
  const baseUrl = 'https://www.nasdaq.com/market-activity/stocks';
  const symbolID = `${'-'.repeat(4 - t.length)}${option.symbol.substring(t.length)}`;
  return `${baseUrl}/${ticker.replace('/', '.')}/option-chain/call-put-options/${t}--${symbolID}`;
}

export function getHeatmapColorRange(
  direction: Direction,
  isDark: boolean,
): [string, string] {
  if (direction === 'calls') {
    return isDark
      ? ['hsl(0, 0%, 0%)', 'hsl(142, 76%, 36%)']
      : ['hsl(0, 0%, 100%)', 'hsl(142, 76%, 36%)'];
  }
  return isDark
    ? ['hsl(0, 0%, 0%)', 'hsl(0, 84%, 50%)']
    : ['hsl(0, 0%, 100%)', 'hsl(0, 84%, 50%)'];
}

export function createHeatmapColorScale(
  direction: Direction,
  isDark: boolean,
  maxValue: number,
) {
  return scaleLinear<string>({
    domain: [0, maxValue || 1],
    range: getHeatmapColorRange(direction, isDark),
  });
}

export function formatMetricLabel(metric: Metric): string {
  if (metric === 'mid_iv') return 'IV';
  if (metric === 'vol_oi_ratio') return 'Vol/OI';
  if (metric === 'open_interest') return 'Open Interest';
  return metric.charAt(0).toUpperCase() + metric.slice(1);
}

export function formatMetricValue(value: number, metric: Metric): string {
  if (metric === 'mid_iv') return `${(value * 100).toFixed(1)}%`;
  if (metric === 'vol_oi_ratio') return value.toFixed(2);
  return value.toLocaleString();
}
