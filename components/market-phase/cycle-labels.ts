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

/**
 * 각 단계의 기준색(불투명). ReferenceArea fill과 요약 카드 도트는 이 색에서 파생시킨다.
 * 색상환에서 서로 최대한 떨어뜨려 인접 단계(특히 1·2단계)도 한눈에 구별되게 한다.
 */
export const CYCLE_BASE_COLORS: Record<CyclePhase, string> = {
  1: "rgb(168, 85, 247)", // violet — 전세 상승(관망)
  2: "rgb(37, 99, 235)", // blue — 매매 전환(초입)
  3: "rgb(220, 38, 38)", // red — 매매 폭등(과열)
  4: "rgb(5, 150, 105)", // emerald — 시장 조정
};

/** ReferenceArea fill 색상(라이트/다크 모두에서 무난하되 배경 위에서도 뚜렷하도록) */
export const CYCLE_AREA_COLORS: Record<CyclePhase, string> = {
  1: "rgb(168 85 247 / 0.22)",
  2: "rgb(37 99 235 / 0.22)",
  3: "rgb(220 38 38 / 0.2)",
  4: "rgb(5 150 105 / 0.22)",
};
