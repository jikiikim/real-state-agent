import { classifyPhase, computeRollingWeeklyChangeRate, WEEKLY_ROLLING_WEEKS, type IndexPoint } from "./phase";

/**
 * 매매·전세지수 관계로 정해지는 시장 사이클 4단계.
 * 1: 전세 상승, 2: 매매 전환, 3: 매매 폭등, 4: 시장 조정.
 * docs/specs/market-phase-dashboard/spec.md의 판별 규칙을 따른다.
 *
 * 이벤트 기반 순차 상태 전이다: 각 단계는 정확히 하나의 다음 단계 조건만 지켜보고,
 * 그 조건이 한 번 만족되면 다음 단계로 넘어간 뒤에는 되돌아가지 않는다.
 * 그래서 항상 1→2→3→4→1 순서로만 흐르고, 중간에 다른 단계가 끼어들지 않는다.
 *
 * - 1→2단계: 골든크로스(매매지수가 전세지수를 상향 돌파)
 * - 2→3단계: 매매 국면이 상승이고 동시에 전세 국면이 하락으로 전환되는 시점
 *   ("매매는 고공행진, 전세는 꺾이는 시점")
 * - 3→4단계: 매매 국면이 하락으로 전환되는 시점("매매가 꺾이는 시점")
 * - 4→1단계: 데드크로스(매매지수가 전세지수 아래로 재하향)
 */
export type CyclePhase = 1 | 2 | 3 | 4;

export interface CycleSegment {
  phase: CyclePhase;
  /** 이 구간의 시작일(포함) */
  startDate: string;
  /** 이 구간의 끝일(포함) */
  endDate: string;
}

export interface CycleResult {
  segments: CycleSegment[];
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

function sign(n: number): -1 | 0 | 1 {
  if (n > 0) return 1;
  if (n < 0) return -1;
  return 0;
}

/**
 * 매매·전세지수 시계열로부터 사이클 구간을 계산한다.
 * 두 시계열에 공통으로 존재하는 날짜만 사용하며, 아직 크로스가 한 번도 없었던
 * 맨 앞 구간은 직전 사이클 이력을 알 수 없으므로 어떤 단계에도 속하지 않는다.
 */
export function computeCycle(
  saleSeries: IndexPoint[],
  jeonseSeries: IndexPoint[],
  weeks: number = WEEKLY_ROLLING_WEEKS
): CycleResult {
  const merged = mergeSaleJeonseSeries(saleSeries, jeonseSeries);
  const commonSale: IndexPoint[] = merged.map((p) => ({ date: p.date, value: p.sale }));
  const commonJeonse: IndexPoint[] = merged.map((p) => ({ date: p.date, value: p.jeonse }));

  const segments: CycleSegment[] = [];
  let currentPhase: CyclePhase | null = null;
  let segmentStart: string | null = null;
  let prevSign: -1 | 0 | 1 | null = null;

  const closeSegment = (endDate: string) => {
    if (currentPhase !== null && segmentStart !== null) {
      segments.push({ phase: currentPhase, startDate: segmentStart, endDate });
    }
  };

  for (let i = 0; i < merged.length; i++) {
    const date = merged[i].date;
    const diffSign = sign(merged[i].sale - merged[i].jeonse);
    const effectiveSign: -1 | 0 | 1 = diffSign === 0 ? (prevSign ?? 0) : diffSign;
    let justTransitioned = false;

    if (prevSign !== null && prevSign !== 0 && effectiveSign !== 0 && effectiveSign !== prevSign) {
      if (effectiveSign > 0) {
        // 골든크로스: 1단계(또는 판단 불가 상태) -> 2단계
        closeSegment(merged[i - 1].date);
        currentPhase = 2;
      } else {
        // 데드크로스: 4단계 -> 1단계
        closeSegment(merged[i - 1].date);
        currentPhase = 1;
      }
      segmentStart = date;
      justTransitioned = true;
    }

    // 이번 턴에 방금 크로스로 전환됐다면 그 직후 조건은 다음 턴부터 평가한다.
    // 그렇지 않으면 merged[i-1]이 segmentStart(=date)보다 앞선 잘못된 구간이 생긴다.
    if (!justTransitioned && currentPhase === 2) {
      const saleRoll = computeRollingWeeklyChangeRate(commonSale.slice(0, i + 1), weeks);
      const jeonseRoll = computeRollingWeeklyChangeRate(commonJeonse.slice(0, i + 1), weeks);
      if (
        saleRoll !== null &&
        jeonseRoll !== null &&
        classifyPhase(saleRoll) === "상승" &&
        classifyPhase(jeonseRoll) === "하락"
      ) {
        closeSegment(merged[i - 1].date);
        currentPhase = 3;
        segmentStart = date;
      }
    } else if (!justTransitioned && currentPhase === 3) {
      const saleRoll = computeRollingWeeklyChangeRate(commonSale.slice(0, i + 1), weeks);
      if (saleRoll !== null && classifyPhase(saleRoll) === "하락") {
        closeSegment(merged[i - 1].date);
        currentPhase = 4;
        segmentStart = date;
      }
    }

    prevSign = effectiveSign;
  }

  if (merged.length > 0) {
    closeSegment(merged[merged.length - 1].date);
  }

  return { segments };
}
