import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { Header } from '@/components/layout/Header';
import { HeatmapCard } from '@/components/heatmap/HeatmapCard';
import { useOptionsData } from '@/hooks/useOptionsData';
import type { Direction, Metric } from '@/types';

export function Dashboard() {
  const { ticker } = useParams({ from: '/$ticker' });
  const { direction, metric } = useSearch({ from: '/$ticker' });
  const navigate = useNavigate();

  const { data, isLoading, error } = useOptionsData(ticker);

  const setTicker = (newTicker: string) => {
    navigate({
      to: '/$ticker',
      params: { ticker: newTicker },
      search: { direction, metric },
    });
  };

  const setDirection = (newDirection: Direction) => {
    navigate({
      to: '/$ticker',
      params: { ticker },
      search: { direction: newDirection, metric },
    });
  };

  const setMetric = (newMetric: Metric) => {
    navigate({
      to: '/$ticker',
      params: { ticker },
      search: { direction, metric: newMetric },
    });
  };

  const handleReset = () => {
    navigate({
      to: '/$ticker',
      params: { ticker: 'AAPL' },
      search: { direction: 'calls', metric: 'volume' },
    });
  };

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <Header
        ticker={ticker}
        setTicker={setTicker}
        isLoading={isLoading}
        onReset={handleReset}
      />
      <main className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-3 py-4 sm:px-6 sm:py-8 min-h-0">
        <div className="flex flex-col flex-1 gap-6 min-h-0">
          {/* Heatmap Card */}
          <HeatmapCard
            data={data}
            direction={direction}
            metric={metric}
            setDirection={setDirection}
            setMetric={setMetric}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}
