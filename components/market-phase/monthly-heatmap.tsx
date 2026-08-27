import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { MonthlyChangeRate } from "@/lib/market-phase";
import { heatmapCellClassName } from "./heatmap-color";

const MONTH_COLUMNS = Array.from({ length: 12 }, (_, i) => i + 1);

function groupByYear(rates: MonthlyChangeRate[]): Map<string, Map<number, number>> {
  const byYear = new Map<string, Map<number, number>>();
  for (const { month, changeRatePercent } of rates) {
    const [year, monthStr] = month.split("-");
    const monthNum = Number(monthStr);
    if (!byYear.has(year)) byYear.set(year, new Map());
    byYear.get(year)!.set(monthNum, changeRatePercent);
  }
  return byYear;
}

export function MonthlyHeatmap({ monthlyChangeRates }: { monthlyChangeRates: MonthlyChangeRate[] }) {
  const byYear = groupByYear(monthlyChangeRates);
  const years = [...byYear.keys()].sort();

  if (years.length === 0) {
    return <p className="text-sm text-muted-foreground">표시할 월간 데이터가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">연도</TableHead>
            {MONTH_COLUMNS.map((m) => (
              <TableHead key={m} className="text-center">
                {m}월
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {years.map((year) => {
            const months = byYear.get(year)!;
            return (
              <TableRow key={year}>
                <TableCell className="sticky left-0 bg-background font-medium">{year}</TableCell>
                {MONTH_COLUMNS.map((m) => {
                  const rate = months.get(m);
                  return (
                    <TableCell
                      key={m}
                      className={cn(
                        "text-center tabular-nums",
                        rate !== undefined && heatmapCellClassName(rate)
                      )}
                    >
                      {rate !== undefined ? `${rate.toFixed(2)}%` : ""}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
