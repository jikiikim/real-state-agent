import { describe, expect, it } from "vitest";
import { computeCycle, type CyclePhase } from "./cycle";
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
  it("크로스가 한 번도 없으면 구간과 크로스가 비어 있다", () => {
    const dates = weeklyDates(10);
    const sale = series(dates, dates.map(() => 90));
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);

    expect(result.crosses).toEqual([]);
    expect(result.segments).toEqual([]);
  });

  it("골든크로스 이후 갭이 작으면 2단계를 유지한다", () => {
    const dates = weeklyDates(20);
    const saleValues = [
      99.5, 99.5, 99.5, 99.5, 99.5, 99.5, // 0~5: 매매 < 전세
      100.3, // 6: 골든크로스
      ...Array(13).fill(100.3), // 7~19: 완만 유지
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);

    expect(result.crosses).toEqual([{ type: "golden", date: dates[6] }]);
    expect(result.segments.map((s) => s.phase)).toEqual([2]);
    expect(result.segments[0].startDate).toBe(dates[6]);
  });

  it("전체 사이클(1→2→3→4→1)이 순서대로 나타난다", () => {
    const dates = weeklyDates(30);
    const saleValues = [
      99.5, 99.5, 99.5, 99.5, 99.5, 99.5, // 0~5: 매매 < 전세
      100.3, // 6: 골든크로스
      ...Array(13).fill(100.3), // 7~19: 완만 유지(2단계)
      105, // 20: 급등 → 갭 확대(3단계)
      104,
      103,
      102,
      101, // 21~24: 서서히 하락
      100, // 25
      99, // 26: 데드크로스(매매<전세)
      98,
      97,
      96, // 27~29
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);

    expect(result.crosses.map((c) => c.type)).toEqual(["golden", "dead"]);
    const phaseOrder = result.segments.map((s) => s.phase);
    // 2단계 시작 후 3, 4단계를 순서대로 거쳐 다시 1단계로 돌아온다.
    expect(phaseOrder[0]).toBe(2);
    expect(phaseOrder).toContain(3);
    expect(phaseOrder).toContain(4);
    expect(phaseOrder[phaseOrder.length - 1]).toBe(1);
    // 각 단계는 순서를 거스르지 않는다(2 -> 3 -> 4 -> 1).
    const firstOf = (p: CyclePhase) => phaseOrder.indexOf(p);
    expect(firstOf(2)).toBeLessThan(firstOf(3));
    expect(firstOf(3)).toBeLessThan(firstOf(4));
    expect(firstOf(4)).toBeLessThan(phaseOrder.lastIndexOf(1));
  });

  it("두 시계열의 공통 날짜만 사용한다", () => {
    const sale = series(weeklyDates(5, "2025-01-06"), [90, 91, 92, 93, 94]);
    const jeonse = series(weeklyDates(5, "2025-01-13"), [100, 100, 100, 100, 100]);

    // 겹치는 날짜가 4개(01-13 ~ 02-03)뿐이라 예외 없이 계산된다.
    expect(() => computeCycle(sale, jeonse)).not.toThrow();
  });
});
