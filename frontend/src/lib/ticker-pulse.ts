import type { QuoteTickerSummary } from '@/lib/api/generated';

export interface TickerPulseRow {
  ticker: string;
  price: string;
  change_percentage: string;
}

export function emptySummary(ticker: string): QuoteTickerSummary {
  return {
    ticker,
    description: ticker,
    price: '',
    change_percentage: '',
  };
}

export function emptyPulseRow(ticker: string): TickerPulseRow {
  return {
    ticker,
    price: '',
    change_percentage: '',
  };
}

/** Placeholders omit price; real summaries always include a quote price. */
export function isSummaryReady(summary: QuoteTickerSummary): boolean {
  return Boolean(summary.price);
}

export function isPulseRowReady(row: TickerPulseRow): boolean {
  return Boolean(row.price);
}

function asTickerSummary(value: unknown): QuoteTickerSummary | null {
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

export function normalizeSummaries(data: unknown): QuoteTickerSummary[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => asTickerSummary(item))
    .filter((item): item is QuoteTickerSummary => item !== null);
}

export function summaryToPulseRow(
  summary: QuoteTickerSummary,
): TickerPulseRow {
  return {
    ticker: summary.ticker,
    price: summary.price ?? '',
    change_percentage: summary.change_percentage ?? '',
  };
}
