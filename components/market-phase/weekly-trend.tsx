import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { IndexPoint } from "@/lib/market-phase";
import { heatmapCellClassName } from "./heatmap-color";

export function WeeklyTrend({ series }: { series: IndexPoint[] }) {
  if (series.length === 0) {
    return <p className="text-sm text-muted-foreground">표시할 주간 데이터가 없습니다.</p>;
  }

  const rows = series.map((point, i) => {
    const prev = series[i - 1];
    const changeRatePercent = prev && prev.value !== 0 ? ((point.value - prev.value) / prev.value) * 100 : null;
    return { ...point, changeRatePercent };
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>조사일</TableHead>
            <TableHead className="text-right">지수</TableHead>
            <TableHead className="text-right">전주대비</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...rows].reverse().map((row) => (
            <TableRow key={row.date}>
              <TableCell>{row.date}</TableCell>
              <TableCell className="text-right tabular-nums">{row.value.toFixed(3)}</TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  row.changeRatePercent !== null && heatmapCellClassName(row.changeRatePercent)
                )}
              >
                {row.changeRatePercent !== null ? `${row.changeRatePercent.toFixed(3)}%` : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
