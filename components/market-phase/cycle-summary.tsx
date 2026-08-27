import { cn } from "@/lib/utils";
import type { CycleOverview, CyclePhase } from "@/lib/market-phase";
import { CYCLE_AREA_COLORS, CYCLE_BASE_COLORS, CYCLE_LABELS, CYCLE_SUMMARIES } from "./cycle-labels";

const ALL_PHASES: CyclePhase[] = [1, 2, 3, 4];

export function CycleSummary({ cycle }: { cycle: CycleOverview }) {
  const currentPhase = cycle.segments.at(-1)?.phase ?? null;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {ALL_PHASES.map((phase) => (
        <div
          key={phase}
          className={cn(
            "flex flex-col gap-1 rounded-md border p-3",
            phase === currentPhase && "border-foreground"
          )}
          style={{ backgroundColor: CYCLE_AREA_COLORS[phase] }}
        >
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CYCLE_BASE_COLORS[phase] }}
            />
            <span className="text-sm font-medium">{CYCLE_LABELS[phase]}</span>
            {phase === currentPhase && (
              <span className="text-xs text-muted-foreground">(현재)</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{CYCLE_SUMMARIES[phase]}</p>
        </div>
      ))}
    </div>
  );
}
