import {
  computeTotalVolume,
  computeTotalOI,
  computePutCallRatio,
  computeMaxPain,
  computeImpliedMove,
} from '@/lib/computations';
import { formatRelativeTime } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { OptionsDataResponse } from '@/types';

interface SummaryStatsProps {
  data: OptionsDataResponse;
  updatedAt: string;
  children?: React.ReactNode;
}

function StatBadge({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 cursor-default">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-sm font-semibold font-mono">{value}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-48 text-center">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export function SummaryStats({ data, updatedAt, children }: SummaryStatsProps) {
  const totalVol =
    computeTotalVolume(data, 'calls') + computeTotalVolume(data, 'puts');
  const totalOI = computeTotalOI(data, 'calls') + computeTotalOI(data, 'puts');
  const pcr = computePutCallRatio(data);
  const maxPain = computeMaxPain(data);
  const impliedMove = computeImpliedMove(data);

  return (
    <TooltipProvider>
      <div className="shrink-0 overflow-x-auto overflow-y-hidden scrollbar-hidden">
        <div className="flex w-max min-w-full items-center gap-2 pb-1 pr-1">
          <StatBadge
            label="Volume"
            value={totalVol.toLocaleString()}
            tooltip="Calls + puts traded today"
          />
          <StatBadge
            label="OI"
            value={totalOI.toLocaleString()}
            tooltip="All unsettled contracts"
          />
          <StatBadge
            label="P/C Ratio"
            value={pcr.byVolume !== null ? pcr.byVolume.toFixed(2) : 'N/A'}
            tooltip="Put ÷ call volume"
          />
          <StatBadge
            label="Max Pain"
            value={maxPain ?? 'N/A'}
            tooltip="Strike where most options expire worthless"
          />
          <StatBadge
            label="Implied Move"
            value={impliedMove !== null ? `±${impliedMove.toFixed(1)}%` : 'N/A'}
            tooltip="Expected swing by nearest expiry"
          />
          <span className="hidden sm:inline text-xs text-muted-foreground whitespace-nowrap">
            Updated {formatRelativeTime(updatedAt)}
          </span>
          {children && <div className="ml-auto">{children}</div>}
        </div>
      </div>
    </TooltipProvider>
  );
}
