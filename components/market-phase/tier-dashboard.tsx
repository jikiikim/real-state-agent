"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TierMarketOverview } from "@/lib/market-phase";
import { PhaseBadge } from "./phase-badge";
import { MonthlyHeatmap } from "./monthly-heatmap";
import { WeeklyTrend } from "./weekly-trend";

function TierSummaryCard({ overview }: { overview: TierMarketOverview }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{overview.label}</span>
          {overview.isBalloonTransitioning && <Badge variant="outline">풍선효과 전이 중</Badge>}
        </CardTitle>
        <CardDescription className="truncate">{overview.regionNames.join(", ")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">매매</span>
          <PhaseBadge phase={overview.sale.weeklyPhase} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">전세</span>
          <PhaseBadge phase={overview.jeonse.weeklyPhase} />
        </div>
      </CardContent>
    </Card>
  );
}

function TierDetail({ overview }: { overview: TierMarketOverview }) {
  return (
    <div className="flex flex-col gap-6">
      {(
        [
          { label: "매매", data: overview.sale },
          { label: "전세", data: overview.jeonse },
        ] as const
      ).map(({ label, data }) => (
        <Card key={label}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {overview.label} {label}
              <PhaseBadge phase={data.weeklyPhase} />
            </CardTitle>
            <CardDescription>
              최근 4주 누적 증감률{" "}
              {data.weeklyChangeRatePercent !== null ? `${data.weeklyChangeRatePercent.toFixed(3)}%` : "데이터 부족"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div>
              <h4 className="mb-2 text-sm font-medium">월간 흐름 (전월대비 증감률)</h4>
              <MonthlyHeatmap monthlyChangeRates={data.monthlyChangeRates} />
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium">최근 주간 추이</h4>
              <WeeklyTrend series={data.recentWeeklySeries} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TierDashboard({ overviews }: { overviews: TierMarketOverview[] }) {
  const defaultTier = String(overviews[0]?.tier ?? 1);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviews.map((overview) => (
          <TierSummaryCard key={overview.tier} overview={overview} />
        ))}
      </div>

      <Tabs defaultValue={defaultTier}>
        <TabsList>
          {overviews.map((overview) => (
            <TabsTrigger key={overview.tier} value={String(overview.tier)}>
              {overview.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {overviews.map((overview) => (
          <TabsContent key={overview.tier} value={String(overview.tier)}>
            <TierDetail overview={overview} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
