import { describe, expect, it } from "vitest";
import { computeCycle } from "./cycle";
import type { IndexPoint } from "./phase";

function weeklyDates(count: number, start = "2025-01-06"): string[] {
  const dates: string[] = [];
  const base = new Date(start);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i * 7);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function series(dates: string[], values: number[]): IndexPoint[] {
  return dates.map((date, i) => ({ date, value: values[i] }));
}

describe("computeCycle", () => {
  it("데이터 시작 시점에 전세가 매매보다 높으면 크로스 없이도 1단계로 바로 시작한다", () => {
    const dates = weeklyDates(10);
    const sale = series(dates, dates.map(() => 90));
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);

    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.segments[0].phase).toBe(1);
    // 국면 계산이 가능한 첫 시점(index 4, weeks=4)부터 바로 1단계다.
    expect(result.segments[0].startDate).toBe(dates[4]);
  });

  it("데이터 시작 시점에 매매가 전세보다 높거나 같으면 크로스 없이도 2단계로 바로 시작한다", () => {
    const dates = weeklyDates(10);
    const sale = series(dates, dates.map(() => 105));
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);

    expect(result.segments[0].phase).toBe(2);
  });

  it("골든크로스 이후 갭이 작으면 2단계를 유지한다(3단계로 넘어가지 않는다)", () => {
    const dates = weeklyDates(20);
    const saleValues = [
      99.9, 99.9, 99.9, 99.9, 99.9, 99.9, // 0~5: 매매 < 전세
      100.05, // 6: 골든크로스(아주 미세하게)
      ...Array(13).fill(100.05), // 7~19: 매매도 전세도 변동 없음(갭 없음)
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);

    expect(result.segments.map((s) => s.phase)).toEqual([1, 2]);
  });

  it("2단계에서 갭 없이 매매가 바로 꺾이면 3단계를 거치지 않고 곧바로 4단계로 간다", () => {
    const dates = weeklyDates(25);
    const saleValues = [
      99.9, 99.9, 99.9, 99.9, 99.9, 99.9, // 0~5: 매매 < 전세
      100.05, // 6: 골든크로스(아주 미세하게)
      100.05, 100.05, 100.05, 100.05, 100.05, 100.05, 100.05, 100.05, // 7~14: 2단계 완전히 안정화
      98, 95, 90, 85, 80, 74, 68, 62, 56, 50, // 15~24: 매매 급락
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);
    const phases = result.segments.map((s) => s.phase);

    expect(phases).not.toContain(3);
    expect(phases).toContain(4);
  });

  it("전체 사이클(2→3→4→1)이 갭 확대 기준으로 순서대로만 나타난다", () => {
    const dates = weeklyDates(34);
    const saleValues = [
      99.9, 99.9, 99.9, 99.9, 99.9, 99.9, // 0~5: 매매 < 전세
      100.05, // 6: 골든크로스(아주 미세하게)
      100.05, 100.05, 100.05, 100.05, 100.05, 100.05, 100.05, // 7~13: 2단계 완전히 안정화
      101, 102, 103, 104, 105, 106, 107, 108, 109, 110, // 14~23: 매매 급등(갭 확대 → 3단계)
      109, 107, 105, 103, 101, 98, 95, 92, 88, 80, // 24~33: 매매 하락 전환 후 계속 하락, 전세 아래로
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);
    const phaseOrder = result.segments.map((s) => s.phase);

    expect(phaseOrder[0]).toBe(1);
    expect(phaseOrder).toContain(2);
    expect(phaseOrder).toContain(3);
    expect(phaseOrder).toContain(4);
    expect(phaseOrder[phaseOrder.length - 1]).toBe(1);

    const firstOf = (p: 1 | 2 | 3 | 4) => phaseOrder.indexOf(p);
    const lastOf = (p: 1 | 2 | 3 | 4) => phaseOrder.lastIndexOf(p);
    expect(firstOf(1)).toBeLessThan(firstOf(2));
    expect(firstOf(2)).toBeLessThan(firstOf(3));
    expect(firstOf(3)).toBeLessThan(firstOf(4));
    expect(firstOf(4)).toBeLessThan(lastOf(1));

    // 연속된 두 세그먼트는 항상 정확히 하나씩만 다음 단계로 넘어간다(끼어드는 단계가 없다).
    for (let i = 1; i < phaseOrder.length; i++) {
      const prev = phaseOrder[i - 1];
      const curr = phaseOrder[i];
      const expectedNext = prev === 4 ? 1 : ((prev + 1) as 1 | 2 | 3 | 4);
      expect(curr).toBe(expectedNext);
    }
  });

  it("데이터가 너무 짧아 4주 누적을 계산할 수 없으면 구간이 비어 있다", () => {
    const dates = weeklyDates(3);
    const sale = series(dates, [90, 91, 92]);
    const jeonse = series(dates, [100, 100, 100]);

    const result = computeCycle(sale, jeonse);

    expect(result.segments).toEqual([]);
  });
});
