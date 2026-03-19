import { cn } from '@/lib/utils';

function Skeleton({ className, style, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      style={style}
      {...props}
    />
  );
}

export { Skeleton };
