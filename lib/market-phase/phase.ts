export type Phase = "상승" | "하락" | "보합";

/**
 * 국면 판단 임계치(%). 1998~2026년 전국 아파트 증감률 참고 자료를 근거로 잡은 초기값이며,
 * 실데이터로 조정 가능하다. docs/specs/market-phase-dashboard/spec.md 참고.
 */
export const PHASE_THRESHOLD_PERCENT = 0.3;

/** 최근 몇 주의 누적 증감률로 주간 국면을 판단할지 */
export const WEEKLY_ROLLING_WEEKS = 4;

export interface IndexPoint {
  /** 조사 기준일(YYYY-MM-DD) */
  date: string;
  /** 지수값 */
  value: number;
}

/** 증감률(%)을 상승/하락/보합 3단계로 분류한다. */
export function classifyPhase(
  changeRatePercent: number,
  thresholdPercent: number = PHASE_THRESHOLD_PERCENT
): Phase {
  if (changeRatePercent >= thresholdPercent) return "상승";
  if (changeRatePercent <= -thresholdPercent) return "하락";
  return "보합";
}

export interface MonthlyChangeRate {
  /** YYYY-MM */
  month: string;
  changeRatePercent: number;
}

/**
 * 날짜순으로 정렬된 지수 시계열을 월별로 집계해 전월대비 증감률을 계산한다.
 * 각 월의 마지막 관측치를 그 달의 대표값으로 쓴다.
 */
export function computeMonthlyChangeRates(series: IndexPoint[]): MonthlyChangeRate[] {
  if (series.length === 0) return [];

  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));

  const lastValueByMonth = new Map<string, number>();
  for (const point of sorted) {
    const month = point.date.slice(0, 7);
    lastValueByMonth.set(month, point.value);
  }

  const months = [...lastValueByMonth.keys()].sort();
  const result: MonthlyChangeRate[] = [];

  for (let i = 1; i < months.length; i++) {
    const prevValue = lastValueByMonth.get(months[i - 1])!;
    const currValue = lastValueByMonth.get(months[i])!;
    if (prevValue === 0) continue;
    const changeRatePercent = ((currValue - prevValue) / prevValue) * 100;
    result.push({ month: months[i], changeRatePercent });
  }

  return result;
}

/**
 * 날짜순으로 정렬된 지수 시계열에서 최근 N주 누적 증감률을 계산한다.
 * 시계열이 N+1개 미만이면 null을 반환한다.
 */
export function computeRollingWeeklyChangeRate(
  series: IndexPoint[],
  weeks: number = WEEKLY_ROLLING_WEEKS
): number | null {
  if (series.length < weeks + 1) return null;

  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const base = sorted[sorted.length - 1 - weeks];

  if (base.value === 0) return null;
  return ((latest.value - base.value) / base.value) * 100;
}

export interface PhasePoint {
  date: string;
  phase: Phase;
}

/**
 * 시계열을 주 단위로 순회하며 각 시점의 국면(최근 N주 누적 증감률 기준)을 계산한다.
 * 앞쪽 N주는 판단할 데이터가 부족해 결과에서 제외된다.
 */
export function computePhaseHistory(
  series: IndexPoint[],
  weeks: number = WEEKLY_ROLLING_WEEKS,
  thresholdPercent: number = PHASE_THRESHOLD_PERCENT
): PhasePoint[] {
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const history: PhasePoint[] = [];

  for (let i = weeks; i < sorted.length; i++) {
    const window = sorted.slice(0, i + 1);
    const rate = computeRollingWeeklyChangeRate(window, weeks);
    if (rate === null) continue;
    history.push({ date: sorted[i].date, phase: classifyPhase(rate, thresholdPercent) });
  }

  return history;
}

/** 국면 히스토리에서 가장 최근에 targetPhase로 전환된 날짜를 찾는다. 현재 그 국면이 아니면 null. */
export function findLatestPhaseTransition(
  history: PhasePoint[],
  targetPhase: Phase
): string | null {
  if (history.length === 0) return null;
  const latest = history[history.length - 1];
  if (latest.phase !== targetPhase) return null;

  let transitionDate = latest.date;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].phase !== targetPhase) break;
    transitionDate = history[i].date;
  }
  return transitionDate;
}
