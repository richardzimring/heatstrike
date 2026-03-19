import { useParams } from '@tanstack/react-router';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { TickerSearch } from '@/components/layout/ticker-search';
import { useTickers } from '@/hooks/useTickers';

export function SiteHeader() {
  const params = useParams({ strict: false }) as { ticker?: string };
  const { data: tickers } = useTickers();
  const currentTicker = params.ticker?.toUpperCase();

  const pageName = currentTicker ? `Explorer · ${currentTicker}` : 'Home';

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{pageName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto w-64">
        <TickerSearch tickers={tickers ?? []} />
      </div>
    </header>
  );
}
