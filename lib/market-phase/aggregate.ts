import type { IndexPoint } from "./phase";

/**
 * 여러 지역의 지수 시계열을 같은 날짜끼리 단순 평균해 급지 대표 시계열을 만든다.
 * 급지 판단 기준을 지역별로 나누기보다 급지 전체 흐름으로 보기 위한 초기 방식이며,
 * 필요하면 지역별 가중치를 나중에 추가할 수 있다.
 */
export function averageIndexSeries(seriesList: IndexPoint[][]): IndexPoint[] {
  const byDate = new Map<string, number[]>();

  for (const series of seriesList) {
    for (const point of series) {
      const values = byDate.get(point.date) ?? [];
      values.push(point.value);
      byDate.set(point.date, values);
    }
  }

  return [...byDate.entries()]
    .map(([date, values]) => ({
      date,
      value: values.reduce((sum, v) => sum + v, 0) / values.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
