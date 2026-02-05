import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { HeatmapCard } from '@/components/heatmap/HeatmapCard';
import { useOptionsData } from '@/hooks/useOptionsData';
import type { Direction, Metric } from '@/types';

function Dashboard() {
  const [ticker, setTicker] = useState('AAPL');
  const [direction, setDirection] = useState<Direction>('calls');
  const [metric, setMetric] = useState<Metric>('volume');

  const { data, isLoading, error } = useOptionsData(ticker);

  const handleReset = () => {
    setTicker('AAPL');
    setDirection('calls');
    setMetric('volume');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        ticker={ticker} 
        setTicker={setTicker} 
        isLoading={isLoading}
        onReset={handleReset}
      />
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-6">
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Dashboard />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
