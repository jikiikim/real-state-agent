"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatManwon, formatGrowthPercent, type ApartmentSummary } from "@/lib/property-recommendation";

const PAGE_SIZE = 10;

export function ApartmentTopList({
  apartments,
  selectedAptSeq,
  onSelect,
}: {
  apartments: ApartmentSummary[];
  selectedAptSeq: string | null;
  onSelect: (aptSeq: string) => void;
}) {
  const [page, setPage] = useState(1);

  if (apartments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        조건(전세가 상승률, 매매-전세 역전, 거래량)을 모두 만족하는 아파트가 없습니다.
      </p>
    );
  }

  const totalPages = Math.ceil(apartments.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageApartments = apartments.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>순위</TableHead>
              <TableHead>아파트</TableHead>
              <TableHead className="text-right">최근 매매가(84㎡)</TableHead>
              <TableHead className="text-right">3년 상승률</TableHead>
              <TableHead className="text-right">월평균 거래</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageApartments.map((apt, i) => (
              <TableRow
                key={apt.aptSeq}
                role="button"
                tabIndex={0}
                aria-pressed={apt.aptSeq === selectedAptSeq}
                onClick={() => onSelect(apt.aptSeq)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(apt.aptSeq);
                  }
                }}
                className={cn("cursor-pointer", apt.aptSeq === selectedAptSeq && "bg-muted")}
              >
                <TableCell className="tabular-nums text-muted-foreground">{startIndex + i + 1}</TableCell>
                <TableCell className="font-medium">
                  {apt.aptName}
                  <span className="ml-1 text-xs text-muted-foreground">{apt.legalDongName}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {apt.latestArea84PriceManwon !== null ? formatManwon(apt.latestArea84PriceManwon) : "-"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatGrowthPercent(apt.sortGrowthRatePercent)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{apt.monthlyAvgTradeCount.toFixed(1)}건</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            이전
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
