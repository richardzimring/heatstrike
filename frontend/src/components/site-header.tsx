import { useNavigate, useParams } from '@tanstack/react-router';
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
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { ticker?: string };
  const { data: tickers } = useTickers();
  const currentTicker = params.ticker?.toUpperCase();

  const pageName = currentTicker ? 'Options Explorer' : 'Home';

  return (
    <header className="sticky top-0 z-40 relative flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <button
        type="button"
        onClick={() => navigate({ to: '/' })}
        className="sm:hidden flex items-center justify-center rounded-md p-1 hover:bg-accent"
        aria-label="Go to home"
      >
        <img
          src={`${import.meta.env.BASE_URL}logo.svg`}
          alt="Heatstrike"
          className="size-5 shrink-0"
        />
      </button>
      <SidebarTrigger className="-ml-1 hidden sm:inline-flex" />
      <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{pageName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="absolute left-1/2 w-52 -translate-x-1/2 sm:static sm:ml-auto sm:w-64 sm:translate-x-0">
        <TickerSearch tickers={tickers ?? []} currentTicker={currentTicker} />
      </div>
      <SidebarTrigger className="ml-auto sm:hidden" />
    </header>
  );
}
