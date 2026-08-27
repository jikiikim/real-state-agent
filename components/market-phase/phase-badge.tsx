import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Phase } from "@/lib/market-phase";

const PHASE_STYLE: Record<Phase, string> = {
  상승: "bg-red-600 text-white dark:bg-red-500",
  하락: "bg-blue-600 text-white dark:bg-blue-500",
  보합: "",
};

export function PhaseBadge({ phase }: { phase: Phase | null }) {
  if (phase === null) {
    return <Badge variant="outline">데이터 부족</Badge>;
  }

  return (
    <Badge
      variant={phase === "보합" ? "secondary" : "default"}
      className={cn(PHASE_STYLE[phase])}
    >
      {phase}
    </Badge>
  );
}
