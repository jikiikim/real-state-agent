import { classifyPhase, computeRollingWeeklyChangeRate, WEEKLY_ROLLING_WEEKS, type IndexPoint } from "./phase";

/**
 * 매매·전세지수 관계로 정해지는 시장 사이클 4단계.
 * 1: 전세 상승, 2: 매매 전환, 3: 매매 폭등, 4: 시장 조정.
 * docs/specs/market-phase-dashboard/spec.md의 판별 규칙을 따른다.
 *
 * 이벤트 기반 순차 상태 전이다: 현재 단계마다 정확히 하나의 다음 단계 조건만 지켜보고,
 * 그 조건이 한 번 만족되면 되돌아가지 않는다. 그래서 항상 1→2→3→4→1 순서로만 흐르고,
 * 중간에 다른 단계가 끼어들지 않는다.
 *
 * - 1→2단계: 골든크로스(매매지수가 전세지수를 상향 돌파)
 * - 2→3단계: 매매 4주 누적 증감률이 전세보다 GAP_EXPANSION_THRESHOLD_PP(%p) 이상
 *   앞서는 시점("매매는 고공행진")
 * - (2 또는 3)→4단계: 매매 국면이 하락으로 전환되는 시점("매매가 꺾이는 시점").
 *   이 조건은 다른 어떤 조건보다 먼저 체크한다 — 매매가 급락해서 같은 주에 전세
 *   아래로 떨어지더라도, 먼저 4단계로 전환된 뒤에야 데드크로스로 1단계로 넘어간다.
 * - 4→1단계: 데드크로스(매매지수가 전세지수 아래로 재하향)
 *
 * 국면 판단이 처음 가능한 시점(맨 앞 weeks주 이후)에는 크로스 없이도 그 시점의
 * 매매·전세 크기 비교로 1 또는 2단계부터 시작한다(예: 데이터를 가져온 시점에 이미
 * 전세가 매매보다 높으면 1단계로 시작).
 */
export type CyclePhase = 1 | 2 | 3 | 4;

/** 매매 4주 누적 증감률이 전세보다 이만큼(%p) 이상 앞서면 3단계(고공행진)로 본다 */
export const GAP_EXPANSION_THRESHOLD_PP = 0.5;

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

/**
 * 매매·전세지수 시계열로부터 사이클 구간을 계산한다.
 * 두 시계열에 공통으로 존재하는 날짜만 사용한다. 맨 앞 weeks주는 국면 판단에
 * 필요한 누적 증감률을 계산할 수 없어 어떤 단계에도 속하지 않는다.
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

  const closeSegment = (endDate: string) => {
    if (currentPhase !== null && segmentStart !== null) {
      segments.push({ phase: currentPhase, startDate: segmentStart, endDate });
    }
  };

  for (let i = 0; i < merged.length; i++) {
    const date = merged[i].date;
    const saleRoll = computeRollingWeeklyChangeRate(commonSale.slice(0, i + 1), weeks);
    if (saleRoll === null) continue;

    const saleAtOrAboveJeonse = merged[i].sale >= merged[i].jeonse;

    if (currentPhase === null) {
      // 국면 판단이 처음 가능한 시점: 크로스 없이도 그 시점의 크기 비교로 초기 단계를 정한다.
      currentPhase = saleAtOrAboveJeonse ? 2 : 1;
      segmentStart = date;
    } else if ((currentPhase === 2 || currentPhase === 3) && classifyPhase(saleRoll) === "하락") {
      // 매매가 꺾이는 것을 최우선으로 본다. 2·3단계 어디에 있든 즉시 4단계로 전환한다.
      // 이전 구간의 끝을 전환일(date)로 잡아 다음 구간의 시작과 겹치게 해서
      // 그래프 배경 블록 사이에 빈틈이 생기지 않게 한다.
      closeSegment(date);
      currentPhase = 4;
      segmentStart = date;
    } else if (currentPhase === 4 && !saleAtOrAboveJeonse) {
      // 데드크로스
      closeSegment(date);
      currentPhase = 1;
      segmentStart = date;
    } else if (currentPhase === 1 && saleAtOrAboveJeonse) {
      // 골든크로스
      closeSegment(date);
      currentPhase = 2;
      segmentStart = date;
    } else if (currentPhase === 2) {
      const jeonseRoll = computeRollingWeeklyChangeRate(commonJeonse.slice(0, i + 1), weeks);
      if (jeonseRoll !== null && saleRoll - jeonseRoll >= GAP_EXPANSION_THRESHOLD_PP) {
        closeSegment(date);
        currentPhase = 3;
        segmentStart = date;
      }
    }
  }

  if (merged.length > 0) {
    closeSegment(merged[merged.length - 1].date);
  }

  return { segments };
}
