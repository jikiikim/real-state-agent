"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SALE_LINE_COLOR, JEONSE_LINE_COLOR } from "@/components/market-phase/cycle-labels";
import type { ApartmentSummary } from "@/lib/property-recommendation";

const priceChartConfig = {
  sale: { label: "매매가(만원)", color: SALE_LINE_COLOR },
  jeonse: { label: "전세가(만원)", color: JEONSE_LINE_COLOR },
} satisfies ChartConfig;

const volumeChartConfig = {
  tradeCount: { label: "거래건수", color: SALE_LINE_COLOR },
} satisfies ChartConfig;

interface PricePoint {
  date: string;
  sale?: number;
  jeonse?: number;
}

function mergePriceSeries(
  trades: ApartmentSummary["area84Trades"],
  jeonse: ApartmentSummary["area84Jeonse"]
): PricePoint[] {
  const map = new Map<string, PricePoint>();
  for (const t of trades) {
    const existing = map.get(t.dealDate) ?? { date: t.dealDate };
    map.set(t.dealDate, { ...existing, sale: t.priceManwon });
  }
  for (const j of jeonse) {
    const existing = map.get(j.dealDate) ?? { date: j.dealDate };
    map.set(j.dealDate, { ...existing, jeonse: j.priceManwon });
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function ApartmentPriceChart({ apartment }: { apartment: ApartmentSummary }) {
  const data = mergePriceSeries(apartment.area84Trades, apartment.area84Jeonse);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">전용 84㎡ 매매/전세 실거래 이력이 없습니다.</p>;
  }

  return (
    <ChartContainer config={priceChartConfig} className="aspect-auto h-56 w-full">
      <LineChart data={data} margin={{ left: 12, right: 12, top: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(2, 7)} minTickGap={40} />
        <YAxis domain={["auto", "auto"]} width={56} tickFormatter={(v: number) => `${Math.round(v / 10000)}억`} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="sale"
          type="monotone"
          stroke={SALE_LINE_COLOR}
          dot={false}
          strokeWidth={2}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          dataKey="jeonse"
          type="monotone"
          stroke={JEONSE_LINE_COLOR}
          dot={false}
          strokeWidth={2}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function ApartmentVolumeChart({ apartment }: { apartment: ApartmentSummary }) {
  if (apartment.monthlyVolume.length === 0) {
    return <p className="text-sm text-muted-foreground">거래량 데이터가 없습니다.</p>;
  }

  return (
    <ChartContainer config={volumeChartConfig} className="aspect-auto h-32 w-full">
      <BarChart data={apartment.monthlyVolume} margin={{ left: 12, right: 12, top: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="yearMonth" tickFormatter={(value: string) => value.slice(2, 7)} minTickGap={40} />
        <YAxis width={32} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="tradeCount" fill={SALE_LINE_COLOR} radius={2} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
