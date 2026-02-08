import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/$ticker',
      params: { ticker: 'AAPL' },
      search: { direction: 'calls', metric: 'volume' },
    });
  },
});
