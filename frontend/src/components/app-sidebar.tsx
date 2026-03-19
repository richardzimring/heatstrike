import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Grid3X3,
  Star,
  X,
  Github,
  MessageSquarePlus,
} from 'lucide-react';
import { FeedbackDialog } from '@/components/layout/feedback-dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useWatchlist } from '@/hooks/use-watchlist';

export function AppSidebar() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { ticker?: string };
  const { tickers: watchlist, removeTicker } = useWatchlist();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const currentTicker = params.ticker?.toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => navigate({ to: '/' })}
              className="cursor-pointer gap-3"
            >
              <img
                src={`${import.meta.env.BASE_URL}logo.svg`}
                alt="Heatstrike"
                className="size-6 shrink-0"
              />
              <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
                Heatstrike
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={!currentTicker}
                  onClick={() => navigate({ to: '/' })}
                  tooltip="Home"
                >
                  <LayoutDashboard />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={!!currentTicker}
                  onClick={() =>
                    navigate({
                      to: '/$ticker',
                      params: { ticker: currentTicker ?? 'AAPL' },
                      search: { direction: 'calls', metric: 'volume' },
                    })
                  }
                  tooltip="Explorer"
                >
                  <Grid3X3 />
                  <span>Explorer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="gap-2">
            <Star className="size-3" />
            <span>Watchlist</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {watchlist.length === 0 ? (
                <SidebarMenuItem>
                  <span className="px-2 text-xs text-muted-foreground">
                    No tickers saved
                  </span>
                </SidebarMenuItem>
              ) : (
                watchlist.map((item) => (
                  <SidebarMenuItem key={item.t}>
                    <SidebarMenuButton
                      isActive={currentTicker === item.t}
                      onClick={() =>
                        navigate({
                          to: '/$ticker',
                          params: { ticker: item.t },
                          search: { direction: 'calls', metric: 'volume' },
                        })
                      }
                      tooltip={item.n}
                      className="group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:!px-1.5 group-data-[collapsible=icon]:!py-1"
                    >
                      <span className="font-mono text-xs">{item.t}</span>
                      <span className="truncate text-muted-foreground group-data-[collapsible=icon]:hidden">
                        {item.n}
                      </span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTicker(item.t);
                      }}
                    >
                      <X />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="GitHub">
              <a
                href="https://github.com/richardzimring/heatstrike"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github />
                <span>GitHub</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Send feedback"
              onClick={() => setFeedbackOpen(true)}
            >
              <MessageSquarePlus />
              <span>Feedback</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </Sidebar>
  );
}
