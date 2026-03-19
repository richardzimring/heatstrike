import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ExplorerDashboard } from '@/components/explorer/explorer-dashboard';

const explorerSearchSchema = z.object({
  direction: z.enum(['calls', 'puts']).catch('calls'),
  metric: z
    .enum([
      'volume',
      'open_interest',
      'vol_oi_ratio',
      'price',
      'spread',
      'mid_iv',
      'delta',
      'gamma',
      'theta',
      'vega',
      'rho',
      'phi',
    ])
    .catch('volume'),
  strikeRange: z.coerce.number().min(1).int().catch(5),
  expirations: z.coerce.number().min(1).int().catch(8),
  sizeMetric: z
    .enum([
      'none',
      'volume',
      'open_interest',
      'vol_oi_ratio',
      'price',
      'spread',
      'mid_iv',
      'delta',
      'gamma',
      'theta',
      'vega',
      'rho',
      'phi',
    ])
    .catch('none'),
});

export const Route = createFileRoute('/$ticker')({
  validateSearch: explorerSearchSchema,
  component: ExplorerPage,
});

function ExplorerPage() {
  return <ExplorerDashboard />;
}
