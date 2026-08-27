"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatManwon, type PropertyRecommendation } from "@/lib/property-recommendation";
import { ApartmentTopList } from "./apartment-top-list";
import { ApartmentCompare } from "./apartment-compare";

export function PropertyRecommendationPanel({
  tierLabel,
  regionNames,
}: {
  tierLabel: string;
  regionNames: string[];
}) {
  const [selectedRegion, setSelectedRegion] = useState(regionNames[0]);
  const [data, setData] = useState<PropertyRecommendation | null>(null);
  const [selectedAptSeq, setSelectedAptSeq] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setSelectedAptSeq(null);

      try {
        const res = await fetch(`/api/property-recommendation?region=${encodeURIComponent(selectedRegion)}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "매물 추천 데이터를 불러오지 못했습니다.");
        const result = body as PropertyRecommendation;
        if (!cancelled) {
          setData(result);
          setSelectedAptSeq(result.topApartments[0]?.aptSeq ?? null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

  const selectedApartment = data?.topApartments.find((a) => a.aptSeq === selectedAptSeq) ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tierLabel} 매물 추천</CardTitle>
        <CardDescription>
          지역을 선택하면 전용 84㎡ 대장아파트와, 전세가·매매가·거래량 조건을 만족하는 Top 30 아파트를 보여줍니다. 아래 아파트를 클릭하세요!
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Select value={selectedRegion} onValueChange={(value) => setSelectedRegion(value as string)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {regionNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading && <p className="text-sm text-muted-foreground">국토교통부 실거래가를 불러오는 중입니다...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && data && (
          <>
            {data.flagship ? (
              <p className="text-sm text-muted-foreground">
                대장아파트: <span className="font-medium text-foreground">{data.flagship.aptName}</span>
                {data.flagship.latestArea84PriceManwon !== null && (
                  <> ({formatManwon(data.flagship.latestArea84PriceManwon)})</>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">이 지역에서 전용 84㎡ 실거래 이력을 찾지 못했습니다.</p>
            )}

            <ApartmentTopList
              apartments={data.topApartments}
              selectedAptSeq={selectedAptSeq}
              onSelect={setSelectedAptSeq}
            />

            {data.flagship && selectedApartment && (
              <ApartmentCompare flagship={data.flagship} selected={selectedApartment} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
