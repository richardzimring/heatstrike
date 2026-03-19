import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export function TickerLogo({
  ticker,
  size = 'sm',
}: {
  ticker: string;
  size?: 'sm' | 'default';
}) {
  const [failed, setFailed] = useState(false);

  return (
    <Avatar size={size} className="rounded-md after:rounded-md">
      <AvatarImage
        src={`https://assets.parqet.com/logos/symbol/${ticker}`}
        alt={ticker}
        onLoadingStatusChange={(status) => {
          if (status === 'error') setFailed(true);
        }}
        className="rounded-md"
      />
      <AvatarFallback className="rounded-md">
        {failed ? ticker.slice(0, 2) : <Skeleton className="size-full rounded-md" />}
      </AvatarFallback>
    </Avatar>
  );
}
