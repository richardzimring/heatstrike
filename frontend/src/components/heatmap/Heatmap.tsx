import { useMemo, useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Group } from '@visx/group';
import { scaleBand } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { useTooltip, TooltipWithBounds } from '@visx/tooltip';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { OptionsDataResponse, Direction, Metric } from '@/types';
import { MARGIN_DESKTOP, MARGIN_MOBILE } from './constants';
import {
  transformData,
  buildNasdaqUrl,
  createHeatmapColorScale,
  type CellData,
} from './utils';

interface HeatmapProps {
  data: OptionsDataResponse;
  direction: Direction;
  metric: Metric;
  width: number;
  height: number;
}

const TOOLTIP_STYLE: React.CSSProperties = {
  position: 'absolute',
  backgroundColor: 'hsl(var(--popover) / 0.925)',
  color: 'hsl(var(--popover-foreground))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  padding: '8px 10px',
  fontSize: '12px',
  boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.15)',
  zIndex: 50,
};

function formatMetricLabel(metric: Metric): string {
  if (metric === 'mid_iv') return 'IV';
  return metric.charAt(0).toUpperCase() + metric.slice(1).replace('_', ' ');
}

function formatMetricValue(value: number, metric: Metric): string {
  if (metric === 'mid_iv') return `${(value * 100).toFixed(1)}%`;
  return value.toLocaleString();
}

/** Format a raw string field from the option for display, returning null if missing. */
function formatOptionField(
  raw: string | null | undefined,
  kind: 'currency' | 'number' | 'iv',
): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return null;
  if (kind === 'currency')
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (kind === 'iv') return `${(n * 100).toFixed(1)}%`;
  return n.toLocaleString();
}

/** Row inside the tooltip detail grid. */
function TooltipRow({ label, value }: { label: string; value: string | null }) {
  if (value === null) return null;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function HeatmapTooltip({
  data,
  metric,
  top,
  left,
  offsetTop,
  offsetLeft,
}: {
  data: CellData;
  metric: Metric;
  top?: number;
  left?: number;
  offsetTop: number;
  offsetLeft: number;
}) {
  const opt = data.option;

  return (
    <TooltipWithBounds
      top={top}
      left={left}
      offsetTop={offsetTop}
      offsetLeft={offsetLeft}
      className="pointer-events-none"
      style={TOOLTIP_STYLE}
    >
      <div className="space-y-1">
        {/* Header: strike · date + symbol */}
        <div>
          <div className="font-semibold text-[13px]">
            {data.strike} &middot; {data.dateStr}
          </div>
          {opt && (
            <div className="text-[10px] text-muted-foreground font-mono">
              {opt.symbol}
            </div>
          )}
        </div>

        {/* Selected metric — highlighted */}
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1 text-xs">
          <span className="text-muted-foreground">
            {formatMetricLabel(metric)}
          </span>
          <span className="font-semibold text-foreground">
            {data.value !== null
              ? formatMetricValue(data.value, metric)
              : 'N/A'}
          </span>
        </div>

        {/* Additional details */}
        {opt && (
          <div className="text-[11px] space-y-px">
            {metric !== 'price' && (
              <TooltipRow
                label="Mid"
                value={formatOptionField(opt.price, 'currency')}
              />
            )}
            {metric !== 'spread' && (
              <TooltipRow
                label="Spread"
                value={formatOptionField(opt.spread, 'currency')}
              />
            )}
            {metric !== 'volume' && (
              <TooltipRow
                label="Vol"
                value={formatOptionField(opt.volume, 'number')}
              />
            )}
            {metric !== 'open_interest' && (
              <TooltipRow
                label="OI"
                value={formatOptionField(opt.open_interest, 'number')}
              />
            )}
            {metric !== 'mid_iv' && (
              <TooltipRow
                label="IV"
                value={formatOptionField(opt.mid_iv, 'iv')}
              />
            )}
          </div>
        )}
      </div>
    </TooltipWithBounds>
  );
}

export function Heatmap({
  data,
  direction,
  metric,
  width,
  height,
}: HeatmapProps) {
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<CellData>();

  const MARGIN = isMobile ? MARGIN_MOBILE : MARGIN_DESKTOP;

  const { cells, maxValue } = useMemo(
    () => transformData(data, direction, metric),
    [data, direction, metric],
  );

  // Calculate dimensions - fill the container
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  // Calculate uniform gap size in pixels
  const numCols = data.expirationDatesStringified.length;
  const numRows = data.strikes.length;

  // Target gap size in pixels (adjust this value to change gap size)
  const targetGapPx = 1;

  // Calculate padding ratios that result in the same pixel gap
  // padding formula: gap = (bandwidth / (1 - padding)) * padding
  // Solving for padding: padding = gap / (bandwidth + gap)
  const xPadding = targetGapPx / (innerWidth / numCols + targetGapPx);
  const yPadding = targetGapPx / (innerHeight / numRows + targetGapPx);

  // Scales - cells expand to fill available space
  const xScale = scaleBand<string>({
    domain: data.expirationDatesStringified,
    range: [0, innerWidth],
    padding: xPadding,
  });

  const yScale = scaleBand<string>({
    domain: [...data.strikes].reverse(),
    range: [0, innerHeight],
    padding: yPadding,
  });

  // Color scale based on direction and theme
  const isDark = resolvedTheme === 'dark';
  const colorScale = createHeatmapColorScale(direction, isDark, maxValue);

  const cellWidth = xScale.bandwidth();
  const cellHeight = yScale.bandwidth();

  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dismiss tooltip when tapping anywhere outside the heatmap container
  useEffect(() => {
    if (!isMobile || activeCellKey === null) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setActiveCellKey(null);
        hideTooltip();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isMobile, activeCellKey, hideTooltip]);

  const navigateToNasdaq = (cell: CellData) => {
    const url = buildNasdaqUrl(data.ticker, cell.option);
    if (url) window.open(url, '_blank');
  };

  const getRelativePosition = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCellClick = (cell: CellData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cell.option) return;

    if (isMobile) {
      const cellKey = `${cell.dateIndex}-${cell.strikeIndex}`;
      if (activeCellKey === cellKey) {
        // Second tap on same cell → navigate
        navigateToNasdaq(cell);
        setActiveCellKey(null);
        hideTooltip();
      } else {
        // First tap → show tooltip at tap position
        const { x, y } = getRelativePosition(e);
        setActiveCellKey(cellKey);
        showTooltip({
          tooltipData: cell,
          tooltipLeft: x,
          tooltipTop: y,
        });
      }
    } else {
      navigateToNasdaq(cell);
    }
  };

  const handleBackgroundTap = () => {
    if (activeCellKey !== null) {
      setActiveCellKey(null);
      hideTooltip();
    }
  };

  const handleCellHover = (cell: CellData, e: React.MouseEvent) => {
    if (isMobile) return;
    // Cancel any pending hide so the tooltip doesn't flicker between cells
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    const { x, y } = getRelativePosition(e);
    showTooltip({
      tooltipData: cell,
      tooltipLeft: x,
      tooltipTop: y,
    });
  };

  const debouncedHideTooltip = () => {
    if (isMobile) return;
    hideTimeoutRef.current = setTimeout(() => {
      hideTooltip();
      hideTimeoutRef.current = null;
    }, 50);
  };

  return (
    <div ref={containerRef} className="relative" onClick={handleBackgroundTap}>
      <svg width={width} height={height}>
        <Group top={MARGIN.top} left={MARGIN.left}>
          {/* Heatmap cells */}
          <g>
            {cells.map((cell) => {
              // Don't render anything for non-existent options
              if (cell.option === null) return null;

              const x = xScale(cell.dateStr) ?? 0;
              const y = yScale(cell.strike) ?? 0;

              return (
                <rect
                  key={`cell-${cell.dateIndex}-${cell.strikeIndex}`}
                  x={x}
                  y={y}
                  width={cellWidth}
                  height={cellHeight}
                  fill={
                    cell.value !== null ? colorScale(cell.value) : 'transparent'
                  }
                  stroke={
                    isMobile &&
                    activeCellKey === `${cell.dateIndex}-${cell.strikeIndex}`
                      ? 'hsl(var(--foreground))'
                      : 'none'
                  }
                  strokeWidth={
                    isMobile &&
                    activeCellKey === `${cell.dateIndex}-${cell.strikeIndex}`
                      ? 1.5
                      : 0
                  }
                  className="cursor-pointer hover:brightness-90"
                  style={{
                    transition:
                      'fill 300ms ease-in-out, filter 150ms ease-in-out',
                  }}
                  onClick={(e) => handleCellClick(cell, e)}
                  onMouseMove={(e) => handleCellHover(cell, e)}
                  onMouseLeave={debouncedHideTooltip}
                />
              );
            })}
          </g>

          {/* Axis lines */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={innerHeight}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.3}
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={innerHeight}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.3}
            strokeWidth={1}
          />

          {/* Y Axis - Strike Price tick labels (desktop only) */}
          {!isMobile && (
            <AxisLeft
              scale={yScale}
              tickFormat={(v) => v}
              stroke="transparent"
              tickStroke="transparent"
              tickLabelProps={() => ({
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
                fontFamily: 'inherit',
                textAnchor: 'end',
                dominantBaseline: 'middle',
                dx: -4,
              })}
              hideTicks
            />
          )}

          {/* X Axis - Expiration Date tick labels (desktop only) */}
          {!isMobile && (
            <AxisBottom
              top={innerHeight}
              scale={xScale}
              tickFormat={(v) => v}
              stroke="transparent"
              tickStroke="transparent"
              tickLabelProps={() => ({
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
                fontFamily: 'inherit',
                textAnchor: 'middle',
                dominantBaseline: 'hanging',
                dy: -6,
              })}
              hideTicks
            />
          )}

          {/* Axis Titles */}
          <text
            x={-innerHeight / 2}
            y={isMobile ? -12 : -60}
            transform="rotate(-90)"
            fill="currentColor"
            fontSize={isMobile ? 11 : 13}
            fontWeight={500}
            textAnchor="middle"
            className="text-foreground"
          >
            Strike Price
          </text>
          <text
            x={innerWidth / 2}
            y={innerHeight + (isMobile ? 18 : 50)}
            fill="currentColor"
            fontSize={isMobile ? 11 : 13}
            fontWeight={500}
            textAnchor="middle"
            className="text-foreground"
          >
            Expiration Date
          </text>
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <HeatmapTooltip
          data={tooltipData}
          metric={metric}
          top={tooltipTop}
          left={tooltipLeft}
          offsetTop={-Math.max(cellHeight * 0.15, 12)}
          offsetLeft={Math.max(cellWidth * 0.15, 12)}
        />
      )}
    </div>
  );
}
