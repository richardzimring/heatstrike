import { createFileRoute } from '@tanstack/react-router';
import { Dashboard } from '@/components/Dashboard';
import type { Direction, Metric } from '@/types';

interface SearchParams {
  direction: Direction;
  metric: Metric;
}

export const Route = createFileRoute('/$ticker')({
  validateSearch: (search): SearchParams => ({
    direction: (search.direction as Direction) || 'calls',
    metric: (search.metric as Metric) || 'volume',
  }),
  component: Dashboard,
});
