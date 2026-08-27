"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { IndexOverview } from "@/lib/market-phase";
import { PhaseBadge } from "./phase-badge";
import { MonthlyHeatmap } from "./monthly-heatmap";
import { WeeklyTrend } from "./weekly-trend";

export function IndexDetailPanel({
  tierLabel,
  indexLabel,
  data,
}: {
  tierLabel: string;
  indexLabel: string;
  data: IndexOverview;
}) {
  const [showWeekly, setShowWeekly] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tierLabel} {indexLabel}
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
          <Button variant="outline" size="sm" onClick={() => setShowWeekly((v) => !v)}>
            상세 데이터 {showWeekly ? "숨기기" : "보기"}
          </Button>
          {showWeekly && (
            <div className="mt-3">
              <h4 className="mb-2 text-sm font-medium">최근 주간 추이</h4>
              <WeeklyTrend series={data.recentWeeklySeries} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
