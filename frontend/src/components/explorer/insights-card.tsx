import { useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Target, Zap, Clock } from 'lucide-react';
import {
  computeTotalVolume,
  computePutCallRatio,
  computeMaxPain,
  computeImpliedMove,
} from '@/lib/computations';
import type { OptionsDataResponse, Option } from '@/types';

interface InsightsCardProps {
  data: OptionsDataResponse;
  earningsData: { dateStr: string; daysUntil: number | null } | null | undefined;
}

function safeFloat(val: string | null | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return Number.isNaN(n) ? 0 : n;
}

function getTopStrike(data: OptionsDataResponse): {
  strike: string;
  volume: number;
  direction: 'call' | 'put';
} | null {
  let best: { strike: string; volume: number; direction: 'call' | 'put' } | null = null;

  for (const chain of data.options) {
    for (let i = 0; i < data.strikes.length; i++) {
      const strike = data.strikes[i];
      if (!strike) continue;

      const c = chain.calls[i] as Option | null;
      if (c) {
        const v = safeFloat(c.volume);
        if (!best || v > best.volume) {
          best = { strike, volume: v, direction: 'call' };
        }
      }
      const p = chain.puts[i] as Option | null;
      if (p) {
        const v = safeFloat(p.volume);
        if (!best || v > best.volume) {
          best = { strike, volume: v, direction: 'put' };
        }
      }
    }
  }
  return best;
}

const V = ({ children }: { children: React.ReactNode }) => (
  <span className="text-foreground font-medium">{children}</span>
);

interface Insight {
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function InsightsCard({ data, earningsData }: InsightsCardProps) {
  const insights = useMemo(() => {
    const items: Insight[] = [];
    const price = safeFloat(data.price);

    if (earningsData?.daysUntil !== null && earningsData?.daysUntil !== undefined) {
      const d = earningsData.daysUntil;
      if (d === 0) {
        items.push({
          icon: <Calendar className="size-3 shrink-0" style={{ color: '#eab308' }} />,
          content: <>Earnings reporting <V>today</V> ({earningsData.dateStr}). Expect elevated IV and volume.</>,
        });
      } else if (d <= 7) {
        items.push({
          icon: <Calendar className="size-3 shrink-0" style={{ color: '#eab308' }} />,
          content: <>Earnings in <V>{d} day{d > 1 ? 's' : ''}</V> ({earningsData.dateStr}). Options may carry extra premium.</>,
        });
      } else if (d <= 30) {
        items.push({
          icon: <Calendar className="size-3 shrink-0" style={{ color: 'var(--muted-foreground)' }} />,
          content: <>Earnings on <V>{earningsData.dateStr}</V> ({d}d away).</>,
        });
      }
    }

    const pcr = computePutCallRatio(data);
    if (pcr.byVolume !== null) {
      if (pcr.byVolume < 0.5) {
        items.push({
          icon: <TrendingUp className="size-3 shrink-0" style={{ color: '#22c55e' }} />,
          content: <>P/C ratio of <V>{pcr.byVolume.toFixed(2)}</V> — heavily bullish call activity.</>,
        });
      } else if (pcr.byVolume > 1.2) {
        items.push({
          icon: <TrendingDown className="size-3 shrink-0" style={{ color: '#ef4444' }} />,
          content: <>P/C ratio of <V>{pcr.byVolume.toFixed(2)}</V> — elevated put activity suggests bearish sentiment.</>,
        });
      }
    }

    const maxPain = computeMaxPain(data);
    if (maxPain && price > 0) {
      const mpVal = parseFloat(maxPain.replace('$', ''));
      if (!Number.isNaN(mpVal)) {
        const diff = ((mpVal - price) / price) * 100;
        if (Math.abs(diff) > 1) {
          const dir = diff > 0 ? 'above' : 'below';
          items.push({
            icon: <Target className="size-3 shrink-0" style={{ color: 'var(--muted-foreground)' }} />,
            content: <>Max pain at <V>{maxPain}</V> is <V>{Math.abs(diff).toFixed(1)}%</V> {dir} current price.</>,
          });
        } else {
          items.push({
            icon: <Target className="size-3 shrink-0" style={{ color: 'var(--muted-foreground)' }} />,
            content: <>Price is near max pain (<V>{maxPain}</V>) — pinning pressure possible.</>,
          });
        }
      }
    }

    const topStrike = getTopStrike(data);
    if (topStrike && topStrike.volume > 0) {
      items.push({
        icon: <Zap className="size-3 shrink-0" style={{ color: 'var(--muted-foreground)' }} />,
        content: <>Highest volume: <V>{topStrike.strike} {topStrike.direction}</V> with <V>{topStrike.volume.toLocaleString()}</V> contracts.</>,
      });
    }

    const impliedMove = computeImpliedMove(data);
    const totalCallVol = computeTotalVolume(data, 'calls');
    const totalPutVol = computeTotalVolume(data, 'puts');
    const totalVol = totalCallVol + totalPutVol;
    if (impliedMove !== null && totalVol > 0) {
      items.push({
        icon: <TrendingUp className="size-3 shrink-0" style={{ color: 'var(--muted-foreground)' }} />,
        content: <>Implied move of <V>±{impliedMove.toFixed(1)}%</V> across <V>{totalVol.toLocaleString()}</V> total contracts.</>,
      });
    }

    const nearestChain = data.options[0];
    if (nearestChain && price > 0) {
      let atmIndex = 0;
      let minDiff = Infinity;
      for (let i = 0; i < data.strikes.length; i++) {
        const raw = data.strikes[i];
        if (!raw) continue;
        const s = parseFloat(raw.replace('$', ''));
        if (!Number.isNaN(s) && Math.abs(s - price) < minDiff) {
          minDiff = Math.abs(s - price);
          atmIndex = i;
        }
      }
      const atmCall = nearestChain.calls[atmIndex] as Option | null;
      const atmPut = nearestChain.puts[atmIndex] as Option | null;
      const callTheta = atmCall ? safeFloat(atmCall.theta) : 0;
      const putTheta = atmPut ? safeFloat(atmPut.theta) : 0;
      const straddleTheta = Math.abs(callTheta) + Math.abs(putTheta);
      if (straddleTheta > 0) {
        const pctOfPrice = (straddleTheta / price) * 100;
        items.push({
          icon: <Clock className="size-3 shrink-0" style={{ color: 'var(--muted-foreground)' }} />,
          content: <>ATM straddle losing <V>${straddleTheta.toFixed(2)}/day</V> in theta (<V>{pctOfPrice.toFixed(2)}%</V> of price).</>,
        });
      }
    }

    return items;
  }, [data, earningsData]);

  if (insights.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-0.5">{insight.icon}</span>
            <span className="text-xs text-muted-foreground leading-relaxed">
              {insight.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
