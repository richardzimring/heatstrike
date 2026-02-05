import { useMemo } from "react";
import { useTheme } from "next-themes";
import { Group } from "@visx/group";
import { scaleLinear, scaleBand } from "@visx/scale";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import type { OptionsDataResponse, Direction, Metric, Option } from "@/types";

const MARGIN = { top: 10, right: 20, bottom: 60, left: 80 };

interface HeatmapProps {
  data: OptionsDataResponse;
  direction: Direction;
  metric: Metric;
  width: number;
  height: number;
}

interface CellData {
  strike: string;
  strikeIndex: number;
  date: string;
  dateStr: string;
  dateIndex: number;
  value: number;
  option: Option;
}

function getMetricValue(option: Option, metric: Metric): number {
  const value = option[metric];
  if (!value || value === "") return 0;
  return Math.abs(parseFloat(value));
}

function transformData(
  data: OptionsDataResponse,
  direction: Direction,
  metric: Metric
): { cells: CellData[]; maxValue: number } {
  const cells: CellData[] = [];
  let maxValue = 0;

  data.options.forEach((optionChain, dateIndex) => {
    const options =
      direction === "calls" ? optionChain.calls : optionChain.puts;

    options.forEach((option, strikeIndex) => {
      const value = getMetricValue(option, metric);
      maxValue = Math.max(maxValue, value);

      cells.push({
        strike: data.strikes[strikeIndex] ?? "",
        strikeIndex,
        date: data.expirationDates[dateIndex] ?? "",
        dateStr: data.expirationDatesStringified[dateIndex] ?? "",
        dateIndex,
        value,
        option,
      });
    });
  });

  return { cells, maxValue };
}

export function Heatmap({
  data,
  direction,
  metric,
  width,
  height,
}: HeatmapProps) {
  const { resolvedTheme } = useTheme();
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<CellData>();

  const { cells, maxValue } = useMemo(
    () => transformData(data, direction, metric),
    [data, direction, metric]
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
  // In dark mode, zero is the dark background color; in light mode, zero is white
  const isDark = resolvedTheme === "dark";
  const colorScale = scaleLinear<string>({
    domain: [0, maxValue || 1],
    range:
      direction === "calls"
        ? isDark
          ? ["hsl(0, 0%, 3.9%)", "hsl(142, 76%, 36%)"] // dark background to green
          : ["hsl(0, 0%, 100%)", "hsl(142, 76%, 36%)"] // white to green
        : isDark
        ? ["hsl(0, 0%, 3.9%)", "hsl(0, 84%, 50%)"] // dark background to red
        : ["hsl(0, 0%, 100%)", "hsl(0, 84%, 50%)"], // white to red
  });

  const cellWidth = xScale.bandwidth();
  const cellHeight = yScale.bandwidth();

  const handleCellClick = (cell: CellData) => {
    const ticker = data.ticker;
    const t = ticker.replace("/", "");
    const baseUrl = "https://www.nasdaq.com/market-activity/stocks";
    const symbolID = `${"-".repeat(4 - t.length)}${cell.option.symbol.substring(
      t.length
    )}`;
    const nasUrl = `${baseUrl}/${ticker.replace(
      "/",
      "."
    )}/option-chain/call-put-options/${t}--${symbolID}`;
    window.open(nasUrl, "_blank");
  };

  const handleCellHover = (cell: CellData, x: number, y: number) => {
    showTooltip({
      tooltipData: cell,
      tooltipLeft: x + MARGIN.left + cellWidth / 2,
      tooltipTop: y + MARGIN.top,
    });
  };

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group top={MARGIN.top} left={MARGIN.left}>
          {/* Heatmap cells */}
          {cells.map((cell) => {
            const x = xScale(cell.dateStr) ?? 0;
            const y = yScale(cell.strike) ?? 0;

            return (
              <rect
                key={`cell-${cell.dateIndex}-${cell.strikeIndex}`}
                x={x}
                y={y}
                width={cellWidth}
                height={cellHeight}
                fill={cell.value > 0 ? colorScale(cell.value) : "transparent"} // todo: differentiate between null/undefined and 0. cell.value should be /undefined if the option is null or doesn't exist?.
                className="cursor-pointer hover:brightness-90"
                style={{
                  transition:
                    "fill 300ms ease-in-out, filter 150ms ease-in-out",
                }}
                onClick={() => handleCellClick(cell)}
                onMouseEnter={() => handleCellHover(cell, x, y)}
                onMouseLeave={() => hideTooltip()}
              />
            );
          })}

          {/* Y Axis - Strike Prices */}
          <AxisLeft
            scale={yScale}
            tickFormat={(v) => v}
            stroke="transparent"
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
              fontFamily: "inherit",
              textAnchor: "end",
              dominantBaseline: "middle",
              dx: -4,
            })}
            hideTicks
          />

          {/* X Axis - Expiration Dates */}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            tickFormat={(v) => v}
            stroke="transparent"
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
              fontFamily: "inherit",
              textAnchor: "middle",
              dominantBaseline: "hanging",
            })}
            hideTicks
          />

          {/* Axis Labels */}
          <text
            x={-innerHeight / 2}
            y={-65}
            transform="rotate(-90)"
            fill="currentColor"
            fontSize={13}
            fontWeight={600}
            textAnchor="middle"
            className="text-foreground"
          >
            Strike Price
          </text>
          <text
            x={innerWidth / 2}
            y={innerHeight + 55}
            fill="currentColor"
            fontSize={13}
            fontWeight={600}
            textAnchor="middle"
            className="text-foreground"
          >
            Expiration Date
          </text>
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          top={tooltipTop}
          left={tooltipLeft}
          offsetTop={-12}
          offsetLeft={0}
          className="pointer-events-none"
          style={{
            position: "absolute",
            backgroundColor: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "13px",
            boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.15)",
            zIndex: 50,
          }}
        >
          <div className="space-y-1.5">
            <div className="font-semibold text-sm">
              {tooltipData.strike} &middot; {tooltipData.dateStr}
            </div>
            <div className="text-muted-foreground text-xs">
              {metric.charAt(0).toUpperCase() +
                metric.slice(1).replace("_", " ")}
              :{" "}
              <span className="font-semibold text-foreground">
                {tooltipData.value > 0
                  ? tooltipData.value.toLocaleString()
                  : tooltipData.option[metric] === null
                  ? "N/A"
                  : "N/A"}
                {/* todo: ^ make sure we're handling null/undefined correctly */}
              </span>
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}
