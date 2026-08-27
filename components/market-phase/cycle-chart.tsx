"use client";

import { CartesianGrid, Label, Line, LineChart, ReferenceArea, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { mergeSaleJeonseSeries, type CycleOverview } from "@/lib/market-phase";
import {
  CYCLE_AREA_COLORS,
  CYCLE_LABEL_TEXT_COLOR,
  CYCLE_SHORT_LABELS,
  JEONSE_LINE_COLOR,
  SALE_LINE_COLOR,
} from "./cycle-labels";

const chartConfig = {
  sale: { label: "매매지수", color: SALE_LINE_COLOR },
  jeonse: { label: "전세지수", color: JEONSE_LINE_COLOR },
} satisfies ChartConfig;

export function CycleChart({ cycle }: { cycle: CycleOverview }) {
  const data = mergeSaleJeonseSeries(cycle.saleSeries, cycle.jeonseSeries);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">표시할 사이클 데이터가 없습니다.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
      <LineChart data={data} margin={{ left: 12, right: 12, top: 20 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(2, 7)} minTickGap={40} />
        <YAxis domain={["auto", "auto"]} width={48} />
        {cycle.segments.map((segment, i) => (
          <ReferenceArea
            key={`${segment.phase}-${segment.startDate}-${i}`}
            x1={segment.startDate}
            x2={segment.endDate}
            fill={CYCLE_AREA_COLORS[segment.phase]}
            stroke="none"
            ifOverflow="hidden"
          >
            <Label
              value={CYCLE_SHORT_LABELS[segment.phase]}
              position="insideTop"
              fontSize={11}
              fill={CYCLE_LABEL_TEXT_COLOR}
            />
          </ReferenceArea>
        ))}
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="sale" type="monotone" stroke={SALE_LINE_COLOR} dot={false} strokeWidth={2} isAnimationActive={false} />
        <Line dataKey="jeonse" type="monotone" stroke={JEONSE_LINE_COLOR} dot={false} strokeWidth={2} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  );
}
