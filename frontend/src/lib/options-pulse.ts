import type { OptionsTickerSummary } from '@/lib/api/generated';

export interface OptionsPulseRow {
  ticker: string;
  name: string;
  price: string;
  change_percentage: string;
}

export function emptySummary(ticker: string): OptionsTickerSummary {
  return {
    ticker,
    description: ticker,
    price: '',
    change_percentage: '',
  };
}

/** Placeholders omit price; real summaries always include a quote price. */
export function isSummaryReady(summary: OptionsTickerSummary): boolean {
  return Boolean(summary.price);
}

function asTickerSummary(value: unknown): OptionsTickerSummary | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const ticker =
    typeof record.ticker === 'string' ? record.ticker.toUpperCase() : null;
  if (!ticker) return null;

  return {
    ticker,
    description:
      typeof record.description === 'string' && record.description
        ? record.description
        : ticker,
    price: typeof record.price === 'string' ? record.price : '',
    change_percentage:
      typeof record.change_percentage === 'string'
        ? record.change_percentage
        : '',
  };
}

export function normalizeSummaries(data: unknown): OptionsTickerSummary[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => asTickerSummary(item))
    .filter((item): item is OptionsTickerSummary => item !== null);
}

export function summaryToPulseRow(
  summary: OptionsTickerSummary,
  nameOverride?: string,
): OptionsPulseRow {
  return {
    ticker: summary.ticker,
    name: nameOverride || summary.description || summary.ticker,
    price: summary.price ?? '',
    change_percentage: summary.change_percentage ?? '',
  };
}
