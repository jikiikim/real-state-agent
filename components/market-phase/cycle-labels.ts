import type { CyclePhase } from "@/lib/market-phase";

export const CYCLE_LABELS: Record<CyclePhase, string> = {
  1: "1단계 · 전세 상승",
  2: "2단계 · 매매 전환",
  3: "3단계 · 매매 폭등",
  4: "4단계 · 시장 조정",
};

/** 그래프 배경 블록 위에 쓰는 짧은 라벨 */
export const CYCLE_SHORT_LABELS: Record<CyclePhase, string> = {
  1: "1단계",
  2: "2단계",
  3: "3단계",
  4: "4단계",
};

export const CYCLE_SUMMARIES: Record<CyclePhase, string> = {
  1: "매매 심리 위축, 전세 수요 증가로 전세가율 최고점",
  2: "전세 부담에 매수 전환 + 갭투자 유입, 매매지수 본격 상승",
  3: "뒤늦은 매수세 유입(포모), 매매지수 급등하며 전세와 갭 확대",
  4: "대출규제·입주물량 증가로 매수세 둔화, 매매지수가 꺾여 전세보다 더 내려간다",
};

/** 매매·전세지수 꺾은선 색. 4단계 배경 색과 겹치지 않는 계열로 대비를 확보한다. */
export const SALE_LINE_COLOR = "#6366f1"; // indigo-500
export const JEONSE_LINE_COLOR = "#f59e0b"; // amber-500

/** 각 단계의 기준색(불투명). ReferenceArea fill과 요약 카드 도트는 이 색에서 파생시킨다. */
export const CYCLE_BASE_COLORS: Record<CyclePhase, string> = {
  1: "rgb(148, 163, 184)", // slate — 전세 상승(관망)
  2: "rgb(59, 130, 246)", // blue — 매매 전환(초입)
  3: "rgb(239, 68, 68)", // red — 매매 폭등(과열)
  4: "rgb(16, 185, 129)", // emerald — 시장 조정
};

/** ReferenceArea fill 색상(라이트/다크 모두에서 무난하도록 낮은 불투명도) */
export const CYCLE_AREA_COLORS: Record<CyclePhase, string> = {
  1: "rgb(148 163 184 / 0.18)",
  2: "rgb(59 130 246 / 0.16)",
  3: "rgb(239 68 68 / 0.16)",
  4: "rgb(16 185 129 / 0.18)",
};
