import { useNavigate, useParams } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TickerSearch } from '@/components/layout/ticker-search';
import { useTickers } from '@/hooks/useTickers';

export function SiteHeader() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { ticker?: string };
  const { data: tickers } = useTickers();
  const currentTicker = params.ticker?.toUpperCase();

  const pageName = currentTicker ?? 'Home';

  return (
    <header className="sticky top-0 z-40 relative flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:px-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/' })}
        className="flex items-center justify-center rounded-md p-1 hover:bg-accent md:hidden"
        aria-label="Go to home"
      >
        <img
          src={`${import.meta.env.BASE_URL}logo.svg`}
          alt=""
          className="size-5 shrink-0"
        />
      </button>

      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button
                type="button"
                onClick={() => navigate({ to: '/' })}
                className="font-semibold text-lg tracking-tight text-foreground cursor-pointer"
              >
                Heatstrike
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="absolute left-1/2 w-52 -translate-x-1/2 md:static md:ml-auto md:w-64 md:translate-x-0">
        <TickerSearch tickers={tickers ?? []} />
      </div>

      <SidebarTrigger className="ml-auto md:hidden" />
    </header>
  );
}
