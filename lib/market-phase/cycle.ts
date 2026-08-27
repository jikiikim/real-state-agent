import { classifyPhase, computeRollingWeeklyChangeRate, WEEKLY_ROLLING_WEEKS, type IndexPoint } from "./phase";

/**
 * 매매·전세지수 관계로 정해지는 시장 사이클 4단계.
 * 1: 전세 상승, 2: 매매 전환, 3: 매매 폭등, 4: 시장 조정.
 * docs/specs/market-phase-dashboard/spec.md의 판별 규칙을 따른다.
 *
 * 매 시점을 아래 두 값의 조합으로 분류한다:
 * - 매매지수가 전세지수보다 높은지 낮은지
 * - 매매지수 자체의 국면(상승/하락/보합, 최근 4주 누적 기준)
 *
 * 1~3단계는 그 시점의 값만으로 즉시 분류된다: 매매 국면이 하락으로 전환되면
 * 전세와의 관계와 무관하게 4단계로 본다. 그 외에는 매매<전세인 동안 1(보합/하락)·
 * 2(상승)단계, 매매≥전세인 동안 3단계다.
 *
 * 4단계만 예외적으로 직전 상태를 참조한다: 매매가 전세 아래로 다시 떨어지는
 * 데드크로스가 나기 전까지는(그 사이 하락세가 잠깐 주춤해도) 4단계를 유지하고,
 * 데드크로스가 나는 시점에 그때의 매매 국면을 기준으로 1·2단계로 재분류한다.
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

function classifyCyclePhase(
  saleValue: number,
  jeonseValue: number,
  saleWeeklyPhase: "상승" | "하락" | "보합",
  previousPhase: CyclePhase | null
): CyclePhase {
  const saleBelowJeonse = saleValue < jeonseValue;

  if (previousPhase === 4) {
    // 4단계는 데드크로스(매매가 전세 아래로 재역전)가 나기 전까지는 하락세가 잠깐
    // 주춤해도 유지된다. 데드크로스가 나면 그 국면 그대로 1·2단계로 재분류한다.
    if (!saleBelowJeonse) return 4;
    return saleWeeklyPhase === "상승" ? 2 : 1;
  }

  if (saleWeeklyPhase === "하락") return 4;
  if (saleBelowJeonse) return saleWeeklyPhase === "상승" ? 2 : 1;
  return 3;
}

/**
 * 매매·전세지수 시계열로부터 사이클 구간을 계산한다.
 * 최근 weeks(기본 4)주 누적 증감률을 계산할 수 있는 시점부터만 판단하므로,
 * 앞쪽 weeks주는 어떤 단계에도 속하지 않는다.
 */
export function computeCycle(
  saleSeries: IndexPoint[],
  jeonseSeries: IndexPoint[],
  weeks: number = WEEKLY_ROLLING_WEEKS
): CycleResult {
  const merged = mergeSaleJeonseSeries(saleSeries, jeonseSeries);
  const segments: CycleSegment[] = [];

  let currentPhase: CyclePhase | null = null;
  let segmentStart: string | null = null;
  let prevDate: string | null = null;

  for (let i = weeks; i < merged.length; i++) {
    const saleWindow: IndexPoint[] = merged.slice(0, i + 1).map((p) => ({ date: p.date, value: p.sale }));
    const saleRoll = computeRollingWeeklyChangeRate(saleWindow, weeks);
    if (saleRoll === null) continue;

    const phase = classifyCyclePhase(merged[i].sale, merged[i].jeonse, classifyPhase(saleRoll), currentPhase);

    if (phase !== currentPhase) {
      if (currentPhase !== null && segmentStart !== null && prevDate !== null) {
        segments.push({ phase: currentPhase, startDate: segmentStart, endDate: prevDate });
      }
      currentPhase = phase;
      segmentStart = merged[i].date;
    }
    prevDate = merged[i].date;
  }

  if (currentPhase !== null && segmentStart !== null && prevDate !== null) {
    segments.push({ phase: currentPhase, startDate: segmentStart, endDate: prevDate });
  }

  return { segments };
}
