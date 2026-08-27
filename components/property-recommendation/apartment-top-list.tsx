import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatManwon, formatGrowthPercent, type ApartmentSummary } from "@/lib/property-recommendation";

export function ApartmentTopList({
  apartments,
  selectedAptSeq,
  onSelect,
}: {
  apartments: ApartmentSummary[];
  selectedAptSeq: string | null;
  onSelect: (aptSeq: string) => void;
}) {
  if (apartments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        조건(전세가 상승률, 매매-전세 역전, 거래량)을 모두 만족하는 아파트가 없습니다.
      </p>
    );
  }

  return (
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
          {apartments.map((apt, i) => (
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
              <TableCell className="tabular-nums text-muted-foreground">{i + 1}</TableCell>
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
  );
}
