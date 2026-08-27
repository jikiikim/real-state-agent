"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { TierMarketOverview } from "@/lib/market-phase";
import { PhaseBadge } from "./phase-badge";
import { IndexDetailPanel } from "./index-detail-panel";
import { CycleChart } from "./cycle-chart";
import { CycleSummary } from "./cycle-summary";
import { PropertyRecommendationPanel } from "@/components/property-recommendation/property-recommendation-panel";

function TierSummaryCard({
  overview,
  selected,
  onSelect,
}: {
  overview: TierMarketOverview;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "cursor-pointer transition-shadow hover:ring-foreground/25 focus-visible:outline-1 focus-visible:outline-ring",
        selected && "bg-primary/5 ring-2 ring-primary"
      )}
    >
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
        <TabsTrigger value="recommendation">매물 추천</TabsTrigger>
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
      <TabsContent value="recommendation">
        <PropertyRecommendationPanel tierLabel={overview.label} regionNames={overview.regionNames} />
      </TabsContent>
    </Tabs>
  );
}

export function TierDashboard({ overviews }: { overviews: TierMarketOverview[] }) {
  const [selectedTier, setSelectedTier] = useState(overviews[0]?.tier);
  const selectedOverview = overviews.find((o) => o.tier === selectedTier) ?? overviews[0];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviews.map((overview) => (
          <TierSummaryCard
            key={overview.tier}
            overview={overview}
            selected={overview.tier === selectedOverview?.tier}
            onSelect={() => setSelectedTier(overview.tier)}
          />
        ))}
      </div>

      {selectedOverview && <TierDetail key={selectedOverview.tier} overview={selectedOverview} />}
    </div>
  );
}
