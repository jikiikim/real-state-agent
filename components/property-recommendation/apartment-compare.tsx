"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatManwon, formatGrowthPercent, type ApartmentSummary } from "@/lib/property-recommendation";
import { ApartmentPriceChart, ApartmentVolumeChart } from "./apartment-price-chart";
import { useComplexInfo } from "./use-complex-info";

function ComplexInfoSection({ apartment }: { apartment: ApartmentSummary }) {
  const { data, loading, error } = useComplexInfo(apartment);

  if (loading) {
    return <p className="text-sm text-muted-foreground">단지 정보를 불러오는 중입니다...</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-muted-foreground">단지 정보를 찾지 못했습니다.</p>;
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <span>
        세대수 <span className="font-medium text-foreground">{data.unitCount.toLocaleString("ko-KR")}세대</span>
      </span>
      <span>
        동수 <span className="font-medium text-foreground">{data.buildingCount}개동</span>
      </span>
      {data.useApprovalDate && (
        <span>
          사용승인일 <span className="font-medium text-foreground">{data.useApprovalDate}</span>
        </span>
      )}
    </div>
  );
}

function ApartmentCard({
  apartment,
  badgeLabel,
}: {
  apartment: ApartmentSummary;
  badgeLabel: string;
}) {
  const growth3y = apartment.growthByPeriod.find((g) => g.years === 3) ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="truncate">{apartment.aptName}</span>
          <Badge variant="outline">{badgeLabel}</Badge>
        </CardTitle>
        <CardDescription>
          {apartment.legalDongName} · {apartment.buildYear}년 준공 · 전용 84㎡ 기준
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ComplexInfoSection apartment={apartment} />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">최근 매매가</span>
            <span className="font-medium tabular-nums">
              {apartment.latestArea84PriceManwon !== null
                ? formatManwon(apartment.latestArea84PriceManwon)
                : "-"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">최근 전세가</span>
            <span className="font-medium tabular-nums">
              {apartment.latestArea84JeonseManwon !== null
                ? formatManwon(apartment.latestArea84JeonseManwon)
                : "-"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">3년 매매가 상승률</span>
            <span className="font-medium tabular-nums">
              {formatGrowthPercent(growth3y?.saleGrowthRatePercent ?? null)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">최근 3년 월평균 거래</span>
            <span className="font-medium tabular-nums">
              {apartment.monthlyAvgTradeCount.toFixed(1)}건
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">매매/전세 실거래가(전용 84㎡)</span>
          <ApartmentPriceChart apartment={apartment} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">거래량(최근 3년, 전체 평형)</span>
          <ApartmentVolumeChart apartment={apartment} />
        </div>
      </CardContent>
    </Card>
  );
}

export function ApartmentCompare({
  flagship,
  selected,
}: {
  flagship: ApartmentSummary;
  selected: ApartmentSummary;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ApartmentCard apartment={flagship} badgeLabel="대장아파트" />
      <ApartmentCard apartment={selected} badgeLabel="선택한 아파트" />
    </div>
  );
}
