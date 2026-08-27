import {
  classifyPhase,
  computeRollingWeeklyChangeRate,
  WEEKLY_ROLLING_WEEKS,
  type IndexPoint,
} from "./phase";

/**
 * 매매·전세지수 관계로 정해지는 시장 사이클 4단계.
 * 1: 전세 상승, 2: 매매 전환, 3: 매매 폭등, 4: 시장 조정.
 * docs/specs/market-phase-dashboard/spec.md의 전환 규칙을 따른다.
 */
export type CyclePhase = 1 | 2 | 3 | 4;

/** 매매 4주 누적 증감률이 전세보다 이만큼(%p) 이상 앞서기 시작하면 3단계(과열)로 본다 */
export const GAP_EXPANSION_THRESHOLD_PP = 1;

export interface CycleSegment {
  phase: CyclePhase;
  /** 이 구간의 시작일(포함) */
  startDate: string;
  /** 이 구간의 끝일(포함) */
  endDate: string;
}

export interface CrossEvent {
  type: "golden" | "dead";
  date: string;
}

export interface CycleResult {
  segments: CycleSegment[];
  crosses: CrossEvent[];
}

function sign(n: number): -1 | 0 | 1 {
  if (n > 0) return 1;
  if (n < 0) return -1;
  return 0;
}

export interface MergedIndexPoint {
  date: string;
  sale: number;
  jeonse: number;
}

/**
 * 매매·전세 두 시계열을 날짜 기준으로 합친다. 두 시계열에 공통으로 존재하는 날짜만 남긴다.
 * computeCycle과 사이클 그래프 컴포넌트가 같은 "공통 날짜" 정의를 쓰도록 이 함수 하나로 통일한다.
 */
export function mergeSaleJeonseSeries(
  saleSeries: IndexPoint[],
  jeonseSeries: IndexPoint[]
): MergedIndexPoint[] {
  const jeonseByDate = new Map(jeonseSeries.map((p) => [p.date, p.value]));
  const saleByDate = new Map(saleSeries.map((p) => [p.date, p.value]));
  const dates = [...saleByDate.keys()].filter((d) => jeonseByDate.has(d)).sort();

  return dates.map((date) => ({
    date,
    sale: saleByDate.get(date)!,
    jeonse: jeonseByDate.get(date)!,
  }));
}

/**
 * 매매·전세지수 시계열로부터 사이클 구간과 골든/데드크로스 시점을 계산한다.
 * 두 시계열에 공통으로 존재하는 날짜만 사용한다.
 * 첫 크로스가 나타나기 전까지는 어떤 단계에도 속하지 않는다(직전 사이클 이력을 알 수 없으므로).
 */
export function computeCycle(
  saleSeries: IndexPoint[],
  jeonseSeries: IndexPoint[],
  weeks: number = WEEKLY_ROLLING_WEEKS
): CycleResult {
  const merged = mergeSaleJeonseSeries(saleSeries, jeonseSeries);
  const dates = merged.map((p) => p.date);
  const commonSale: IndexPoint[] = merged.map((p) => ({ date: p.date, value: p.sale }));
  const commonJeonse: IndexPoint[] = merged.map((p) => ({ date: p.date, value: p.jeonse }));

  const crosses: CrossEvent[] = [];
  const segments: CycleSegment[] = [];

  let currentPhase: CyclePhase | null = null;
  let segmentStart: string | null = null;
  let prevSign: -1 | 0 | 1 | null = null;

  const closeSegment = (endDate: string) => {
    if (currentPhase !== null && segmentStart !== null) {
      segments.push({ phase: currentPhase, startDate: segmentStart, endDate });
    }
  };

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const diffSign = sign(commonSale[i].value - commonJeonse[i].value);
    const effectiveSign: -1 | 0 | 1 = diffSign === 0 ? (prevSign ?? 0) : diffSign;
    let justTransitioned = false;

    if (prevSign !== null && prevSign !== 0 && effectiveSign !== 0 && effectiveSign !== prevSign) {
      if (effectiveSign > 0) {
        crosses.push({ type: "golden", date });
        closeSegment(dates[i - 1]);
        currentPhase = 2;
        segmentStart = date;
      } else {
        crosses.push({ type: "dead", date });
        closeSegment(dates[i - 1]);
        currentPhase = 1;
        segmentStart = date;
      }
      justTransitioned = true;
    }

    // 이번 턴에 방금 크로스로 전환됐다면, 그 직후 조건은 다음 턴부터 평가한다.
    // 그렇지 않으면 dates[i - 1]이 segmentStart(=date)보다 앞선 잘못된 구간이 생긴다.
    if (!justTransitioned && currentPhase === 2) {
      const saleRoll = computeRollingWeeklyChangeRate(commonSale.slice(0, i + 1), weeks);
      const jeonseRoll = computeRollingWeeklyChangeRate(commonJeonse.slice(0, i + 1), weeks);
      if (saleRoll !== null && jeonseRoll !== null && saleRoll - jeonseRoll >= GAP_EXPANSION_THRESHOLD_PP) {
        closeSegment(dates[i - 1]);
        currentPhase = 3;
        segmentStart = date;
      }
    } else if (!justTransitioned && currentPhase === 3) {
      const saleRoll = computeRollingWeeklyChangeRate(commonSale.slice(0, i + 1), weeks);
      if (saleRoll !== null && classifyPhase(saleRoll) === "하락") {
        closeSegment(dates[i - 1]);
        currentPhase = 4;
        segmentStart = date;
      }
    }

    prevSign = effectiveSign;
  }

  if (dates.length > 0) {
    closeSegment(dates[dates.length - 1]);
  }

  return { segments, crosses };
}
