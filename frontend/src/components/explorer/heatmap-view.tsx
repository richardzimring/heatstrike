import { useMemo, useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { useTooltip, TooltipWithBounds } from '@visx/tooltip';
import { ParentSize } from '@visx/responsive';
import { useIsMobile } from '@/hooks/use-mobile';
import type { OptionsDataResponse, Direction, Metric } from '@/types';
import {
  transformData,
  buildNasdaqUrl,
  createHeatmapColorScale,
  formatMetricLabel,
  formatMetricValue,
  type CellData,
} from './heatmap-utils';

const MARGIN_DESKTOP = { top: 10, right: 10, bottom: 55, left: 76 };
const MARGIN_MOBILE = { top: 5, right: 5, bottom: 25, left: 15 };

const TOOLTIP_STYLE: React.CSSProperties = {
  position: 'absolute',
  backgroundColor: 'var(--popover)',
  color: 'var(--popover-foreground)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '8px 10px',
  fontSize: '12px',
  boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.15)',
  zIndex: 50,
};

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

function TooltipRow({ label, value }: { label: string; value: string | null }) {
  if (value === null) return null;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

interface HeatmapViewProps {
  data: OptionsDataResponse;
  direction: Direction;
  metric: Metric;
  sizeMetric: Metric | null;
}

function HeatmapInner({
  data,
  direction,
  metric,
  sizeMetric,
  width,
  height,
}: HeatmapViewProps & { width: number; height: number }) {
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

  const { cells, maxValue, maxSizeValue } = useMemo(
    () => transformData(data, direction, metric, sizeMetric),
    [data, direction, metric, sizeMetric],
  );

  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const numCols = data.expirationDatesStringified.length;
  const numRows = data.strikes.length;
  const targetGapPx = 1;
  const xPadding = targetGapPx / (innerWidth / numCols + targetGapPx);
  const yPadding = targetGapPx / (innerHeight / numRows + targetGapPx);

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

  const isDark = resolvedTheme === 'dark';
  const colorScale = createHeatmapColorScale(direction, isDark, maxValue);

  const sizeScale = useMemo(() => {
    if (!sizeMetric || maxSizeValue === 0) return null;
    return scaleLinear<number>({
      domain: [0, maxSizeValue],
      range: [0.15, 1],
    });
  }, [sizeMetric, maxSizeValue]);

  const cellWidth = xScale.bandwidth();
  const cellHeight = yScale.bandwidth();

  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);
  const [hoveredCellKey, setHoveredCellKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        navigateToNasdaq(cell);
        setActiveCellKey(null);
        hideTooltip();
      } else {
        const { x, y } = getRelativePosition(e);
        setActiveCellKey(cellKey);
        showTooltip({ tooltipData: cell, tooltipLeft: x, tooltipTop: y });
      }
    } else {
      navigateToNasdaq(cell);
    }
  };

  const handleCellHover = (cell: CellData, e: React.MouseEvent) => {
    if (isMobile) return;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHoveredCellKey(`${cell.dateIndex}-${cell.strikeIndex}`);
    const { x, y } = getRelativePosition(e);
    showTooltip({ tooltipData: cell, tooltipLeft: x, tooltipTop: y });
  };

  const debouncedHideTooltip = () => {
    if (isMobile) return;
    setHoveredCellKey(null);
    hideTimeoutRef.current = setTimeout(() => {
      hideTooltip();
      hideTimeoutRef.current = null;
    }, 50);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onClick={() => {
        if (activeCellKey !== null) {
          setActiveCellKey(null);
          hideTooltip();
        }
      }}
    >
      <svg width={width} height={height}>
        <Group top={MARGIN.top} left={MARGIN.left}>
          <g>
            {cells.map((cell) => {
              if (cell.option === null) return null;

              const baseX = xScale(cell.dateStr) ?? 0;
              const baseY = yScale(cell.strike) ?? 0;

              let w = cellWidth;
              let h = cellHeight;
              let x = baseX;
              let y = baseY;

              if (sizeScale && cell.sizeValue !== null) {
                const ratio = sizeScale(cell.sizeValue);
                w = cellWidth * ratio;
                h = cellHeight * ratio;
                x = baseX + (cellWidth - w) / 2;
                y = baseY + (cellHeight - h) / 2;
              }

              const isActive =
                isMobile &&
                activeCellKey === `${cell.dateIndex}-${cell.strikeIndex}`;
              const cellKey = `${cell.dateIndex}-${cell.strikeIndex}`;
              const isHovered = hoveredCellKey === cellKey;
              const highlighted = isActive || isHovered;

              return (
                <rect
                  key={`cell-${cell.dateIndex}-${cell.strikeIndex}`}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={1}
                  fill={
                    cell.value !== null ? colorScale(cell.value) : 'transparent'
                  }
                  stroke={highlighted ? 'var(--foreground)' : 'none'}
                  strokeWidth={highlighted ? 1 : 0}
                  paintOrder="stroke"
                  className="cursor-pointer"
                  style={{
                    transition:
                      'fill 300ms ease, width 300ms ease, height 300ms ease, x 300ms ease, y 300ms ease',
                  }}
                  onClick={(e) => handleCellClick(cell, e)}
                  onMouseMove={(e) => handleCellHover(cell, e)}
                  onMouseLeave={debouncedHideTooltip}
                />
              );
            })}
          </g>

          {!isMobile && (
            <AxisLeft
              scale={yScale}
              tickFormat={(v) => v}
              stroke="transparent"
              tickStroke="transparent"
              tickLabelProps={() => ({
                fill: 'var(--muted-foreground)',
                fontSize: 11,
                fontFamily: 'inherit',
                textAnchor: 'end' as const,
                dominantBaseline: 'middle',
                dx: -4,
              })}
              hideTicks
            />
          )}
          {!isMobile && (
            <AxisBottom
              top={innerHeight}
              scale={xScale}
              tickFormat={(v) => v}
              stroke="transparent"
              tickStroke="transparent"
              tickLabelProps={() => ({
                fill: 'var(--muted-foreground)',
                fontSize: 11,
                fontFamily: 'inherit',
                textAnchor: 'middle' as const,
                dominantBaseline: 'hanging',
                dy: -6,
              })}
              hideTicks
            />
          )}

          <text
            x={-innerHeight / 2}
            y={isMobile ? -12 : -66}
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

      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          top={tooltipTop}
          left={tooltipLeft}
          offsetTop={-Math.max(cellHeight * 0.15, 12)}
          offsetLeft={Math.max(cellWidth * 0.15, 12)}
          className="pointer-events-none"
          style={TOOLTIP_STYLE}
        >
          <div className="flex flex-col gap-1">
            <div>
              <div className="font-semibold text-[13px]">
                {tooltipData.strike} &middot; {tooltipData.dateStr}
              </div>
              {tooltipData.option && (
                <div className="text-[10px] text-muted-foreground font-mono">
                  {tooltipData.option.symbol}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1 text-xs">
              <span className="text-muted-foreground">
                {formatMetricLabel(metric)}
              </span>
              <span className="font-semibold text-foreground">
                {tooltipData.value !== null
                  ? formatMetricValue(tooltipData.value, metric)
                  : 'N/A'}
              </span>
            </div>
            {tooltipData.option && (
              <div className="text-[11px] flex flex-col gap-px">
                {metric !== 'price' && (
                  <TooltipRow
                    label="Mid"
                    value={formatOptionField(
                      tooltipData.option.price,
                      'currency',
                    )}
                  />
                )}
                {metric !== 'spread' && (
                  <TooltipRow
                    label="Spread"
                    value={formatOptionField(
                      tooltipData.option.spread,
                      'currency',
                    )}
                  />
                )}
                {metric !== 'volume' && (
                  <TooltipRow
                    label="Vol"
                    value={formatOptionField(
                      tooltipData.option.volume,
                      'number',
                    )}
                  />
                )}
                {metric !== 'open_interest' && (
                  <TooltipRow
                    label="OI"
                    value={formatOptionField(
                      tooltipData.option.open_interest,
                      'number',
                    )}
                  />
                )}
                {metric !== 'mid_iv' && (
                  <TooltipRow
                    label="IV"
                    value={formatOptionField(tooltipData.option.mid_iv, 'iv')}
                  />
                )}
              </div>
            )}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

export function HeatmapView(props: HeatmapViewProps) {
  return (
    <ParentSize debounceTime={0}>
      {({ width, height }) => (
        <HeatmapInner {...props} width={width} height={Math.max(350, height)} />
      )}
    </ParentSize>
  );
}
