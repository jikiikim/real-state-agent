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
 * 단계가 깊어질수록(1→4) 옅은 초록에서 짙은 초록으로 진해지는 그라데이션으로 잡는다.
 */
export const CYCLE_BASE_COLORS: Record<CyclePhase, string> = {
  1: "#E6F2DD",
  2: "#B1D3B9",
  3: "#88BDA4",
  4: "#659287",
};

/** ReferenceArea fill 색상. 매매/전세 라인이 배경 위에서도 보이도록 살짝 투명하게 쓴다. */
export const CYCLE_AREA_COLORS: Record<CyclePhase, string> = {
  1: "rgb(230 242 221 / 0.85)",
  2: "rgb(177 211 185 / 0.85)",
  3: "rgb(136 189 164 / 0.85)",
  4: "rgb(101 146 135 / 0.85)",
};

/** 그래프 블록 라벨 텍스트 색. 1단계처럼 배경이 연할 때도 읽히도록 가장 짙은 톤으로 고정한다. */
export const CYCLE_LABEL_TEXT_COLOR = "#3f5f57";
