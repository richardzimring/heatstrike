import type { OptionsDataResponse, Option, Direction } from '@/types';

function safeParseFloat(val: string | null | undefined): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(val);
  return Number.isNaN(n) ? null : n;
}

function getAllOptions(
  data: OptionsDataResponse,
  direction: Direction,
): Option[] {
  return data.options.flatMap((chain) => {
    const arr = direction === 'calls' ? chain.calls : chain.puts;
    return arr.filter((o): o is Option => o !== null);
  });
}

export function computeTotalVolume(
  data: OptionsDataResponse,
  direction: Direction,
): number {
  return getAllOptions(data, direction).reduce((sum, opt) => {
    return sum + (safeParseFloat(opt.volume) ?? 0);
  }, 0);
}

export function computeTotalOI(
  data: OptionsDataResponse,
  direction: Direction,
): number {
  return getAllOptions(data, direction).reduce((sum, opt) => {
    return sum + (safeParseFloat(opt.open_interest) ?? 0);
  }, 0);
}

export function computePutCallRatio(data: OptionsDataResponse): {
  byVolume: number | null;
  byOI: number | null;
} {
  const callVol = computeTotalVolume(data, 'calls');
  const putVol = computeTotalVolume(data, 'puts');
  const callOI = computeTotalOI(data, 'calls');
  const putOI = computeTotalOI(data, 'puts');

  return {
    byVolume: callVol > 0 ? putVol / callVol : null,
    byOI: callOI > 0 ? putOI / callOI : null,
  };
}

/**
 * Max pain: the strike price at which the total dollar value of outstanding
 * options (both calls and puts) expiring worthless is maximized.
 */
export function computeMaxPain(data: OptionsDataResponse): string | null {
  if (data.strikes.length === 0 || data.options.length === 0) return null;

  const nearestChain = data.options[0];
  if (!nearestChain) return null;

  let maxPainStrike: string | null = null;
  let maxPainValue = -1;

  const parsedStrikes = data.strikes.map((s) => ({
    raw: s,
    val: parseFloat(s.replace('$', '')),
  }));

  for (const candidate of parsedStrikes) {
    if (Number.isNaN(candidate.val)) continue;

    let totalPain = 0;
    for (const [j, other] of parsedStrikes.entries()) {
      if (Number.isNaN(other.val)) continue;

      const c = nearestChain.calls[j];
      if (c) {
        const oi = safeParseFloat(c.open_interest) ?? 0;
        totalPain += Math.max(0, other.val - candidate.val) * oi * 100;
      }

      const p = nearestChain.puts[j];
      if (p) {
        const oi = safeParseFloat(p.open_interest) ?? 0;
        totalPain += Math.max(0, candidate.val - other.val) * oi * 100;
      }
    }

    if (totalPain > maxPainValue) {
      maxPainValue = totalPain;
      maxPainStrike = candidate.raw;
    }
  }

  return maxPainStrike;
}

/**
 * Implied move: expected price move derived from the ATM straddle
 * of the nearest expiration. Returned as a percentage.
 */
export function computeImpliedMove(data: OptionsDataResponse): number | null {
  const stockPrice = safeParseFloat(data.price);
  if (!stockPrice || stockPrice === 0) return null;

  const nearestChain = data.options[0];
  if (!nearestChain) return null;

  // Find the ATM strike (closest to stock price)
  let atmIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < data.strikes.length; i++) {
    const s = data.strikes[i];
    if (!s) continue;
    const strike = parseFloat(s.replace('$', ''));
    const diff = Math.abs(strike - stockPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = i;
    }
  }

  const atmCall = nearestChain.calls[atmIndex];
  const atmPut = nearestChain.puts[atmIndex];

  const callPrice = atmCall ? safeParseFloat(atmCall.price) : null;
  const putPrice = atmPut ? safeParseFloat(atmPut.price) : null;

  if (callPrice === null || putPrice === null) return null;

  const straddlePrice = callPrice + putPrice;
  return (straddlePrice / stockPrice) * 100;
}
