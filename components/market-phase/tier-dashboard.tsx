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
import { IndexDetailPanel } from "./index-detail-panel";
import { CycleChart } from "./cycle-chart";
import { CycleSummary } from "./cycle-summary";

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
    <Tabs defaultValue="cycle">
      <TabsList>
        <TabsTrigger value="cycle">매매/전세 가격변동</TabsTrigger>
        <TabsTrigger value="sale">매매</TabsTrigger>
        <TabsTrigger value="jeonse">전세</TabsTrigger>
      </TabsList>
      <TabsContent value="cycle">
        <Card>
          <CardHeader>
            <CardTitle>{overview.label} 매매/전세 가격변동</CardTitle>
            <CardDescription>최근 3년 주간 지수와 시장 사이클 4단계</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <CycleChart cycle={overview.cycle} />
            <CycleSummary cycle={overview.cycle} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="sale">
        <IndexDetailPanel tierLabel={overview.label} indexLabel="매매" data={overview.sale} />
      </TabsContent>
      <TabsContent value="jeonse">
        <IndexDetailPanel tierLabel={overview.label} indexLabel="전세" data={overview.jeonse} />
      </TabsContent>
    </Tabs>
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
