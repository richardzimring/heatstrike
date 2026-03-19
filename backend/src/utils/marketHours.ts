const MARKET_OPEN_HOUR = 9;
const MARKET_OPEN_MINUTE = 30;
const MARKET_CLOSE_HOUR = 16;
const MARKET_CLOSE_MINUTE = 0;

function getEasternNow(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );
}

function getNextMarketOpenMs(eastern: Date): number {
  const day = eastern.getDay();
  const hours = eastern.getHours();
  const minutes = eastern.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  const marketClose = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;

  let daysUntilOpen = 0;
  if (day === 6) {
    daysUntilOpen = 2;
  } else if (day === 0) {
    daysUntilOpen = 1;
  } else if (currentMinutes >= marketClose) {
    daysUntilOpen = day === 5 ? 3 : 1;
  }

  const nextOpen = new Date(eastern);
  nextOpen.setDate(nextOpen.getDate() + daysUntilOpen);
  nextOpen.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);

  return nextOpen.getTime() - eastern.getTime();
}

function isMarketOpen(eastern: Date): boolean {
  const day = eastern.getDay();
  const currentMinutes = eastern.getHours() * 60 + eastern.getMinutes();
  const marketOpen = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const marketClose = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;

  const isWeekday = day >= 1 && day <= 5;
  return isWeekday && currentMinutes >= marketOpen && currentMinutes < marketClose;
}

/**
 * TTL for options data cache.
 * Market hours: 1 hour. Outside: until next market open.
 */
export function getOptionsCacheTtlMs(cacheTtlMs: number): number {
  const eastern = getEasternNow();
  if (isMarketOpen(eastern)) return cacheTtlMs;
  return getNextMarketOpenMs(eastern);
}

/**
 * TTL for lightweight quote cache.
 * Market hours: 5 minutes. Outside: until next market open.
 */
export function getQuoteCacheTtlMs(): number {
  const FIVE_MINUTES = 5 * 60 * 1000;
  const eastern = getEasternNow();
  if (isMarketOpen(eastern)) return FIVE_MINUTES;
  return getNextMarketOpenMs(eastern);
}
