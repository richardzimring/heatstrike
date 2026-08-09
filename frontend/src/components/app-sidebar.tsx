import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { LayoutDashboard, Grid3X3, Github, MessageSquarePlus } from 'lucide-react';
import { FeedbackDialog } from '@/components/layout/feedback-dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useRecentTickers } from '@/hooks/use-recent-tickers';

export function AppSidebar() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { ticker?: string };
  const { recents } = useRecentTickers();
  const { isMobile, setOpenMobile } = useSidebar();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const currentTicker = params.ticker?.toUpperCase();
  const lastTicker = recents[0]?.t ?? 'AAPL';

  const go = (action: () => void) => {
    action();
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <button
            type="button"
            onClick={() => go(() => navigate({ to: '/' }))}
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer"
            aria-label="Go to home"
          >
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="Heatstrike"
              className="size-6 shrink-0"
            />
          </button>
          <span className="font-semibold text-lg tracking-tight group-data-[collapsible=icon]:hidden">
            Heatstrike
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={!currentTicker}
                  onClick={() => go(() => navigate({ to: '/' }))}
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
                    go(() =>
                      navigate({
                        to: '/$ticker',
                        params: { ticker: currentTicker ?? lastTicker },
                        search: { direction: 'calls', metric: 'volume' },
                      }),
                    )
                  }
                  tooltip="Options Explorer"
                >
                  <Grid3X3 />
                  <span>Options Explorer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
