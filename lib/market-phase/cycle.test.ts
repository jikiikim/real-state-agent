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
  it("전세가 매매보다 계속 위고 매매가 보합이면 1단계로만 분류된다", () => {
    const dates = weeklyDates(10);
    const sale = series(dates, dates.map(() => 90));
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);

    expect(result.segments.every((s) => s.phase === 1)).toBe(true);
    expect(result.segments.length).toBeGreaterThan(0);
  });

  it("매매가 상승 국면으로 전환되면(여전히 전세보다 낮음) 2단계가 된다", () => {
    const dates = weeklyDates(15);
    const saleValues = [
      90, 90, 90, 90, 90, 90, 90, 90, 90, // 0~8: 평탄(1단계)
      91, 92.5, 94.5, 97, 98.5, 99, // 9~14: 서서히 상승, 전세(100) 아래 유지
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);
    const phases = result.segments.map((s) => s.phase);

    expect(phases[0]).toBe(1);
    expect(phases).toContain(2);
    expect(phases.every((p) => p === 1 || p === 2)).toBe(true);
  });

  it("매매가 전세를 넘어서면(국면이 하락이 아닌 한) 3단계가 된다", () => {
    const dates = weeklyDates(20);
    const saleValues = [
      90, 90, 90, 90, 90, 90, 90, 90, // 0~7: 평탄
      92, 94.5, 97, 99, 101, 103, 105, 107, 108, 109, 109.5, 110, // 8~19: 계속 상승, 전세(100) 상향 돌파
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);
    const phases = result.segments.map((s) => s.phase);

    expect(phases).toContain(3);
    const firstThree = phases.indexOf(3);
    expect(firstThree).toBeGreaterThan(-1);
    // 3단계 진입 이후에는 매매가 전세보다 낮아지는 1·2단계로 되돌아가지 않는다(이 시나리오엔 하락이 없으므로).
    expect(phases.slice(firstThree)).toEqual(phases.slice(firstThree).map(() => 3));
  });

  it("매매가 전세보다 높은 채로 하락 국면에 들어가면 4단계가 된다(전세와의 관계는 보지 않는다)", () => {
    const dates = weeklyDates(24);
    const saleValues = [
      90, 90, 90, 90, 90, 90, 90, 90, // 0~7: 평탄
      93, 96, 99, 102, 105, 108, 111, 113, 114, 114.5, // 8~17: 상승, 전세(100) 상향 돌파 → 3단계
      112, 109, 106, 103, 101, 99.5, // 18~23: 하락 시작(4단계). 마지막엔 전세 근접/아래로
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);
    const phases = result.segments.map((s) => s.phase);

    expect(phases).toContain(3);
    expect(phases).toContain(4);
    const firstFour = phases.indexOf(4);
    // 4단계 진입 시점 세그먼트를 보면, 그 시작 시점의 매매값이 전세보다 여전히 높다.
    const fourSegment = result.segments[firstFour];
    const saleAtStart = sale.find((p) => p.date === fourSegment.startDate)!.value;
    expect(saleAtStart).toBeGreaterThan(100);
  });

  it("4단계에서 매매가 전세 아래로 재역전되면(데드크로스) 1단계로 돌아간다", () => {
    const dates = weeklyDates(30);
    const saleValues = [
      90, 90, 90, 90, 90, 90, 90, 90, // 0~7: 평탄(1단계)
      93, 96, 99, 102, 105, 108, 111, 113, 114, 114.5, // 8~17: 상승 → 3단계
      112, 109, 106, 103, 101, 99.5, 97, 94, 91, 88, 85, 83, // 18~29: 계속 하락 → 4단계, 결국 전세 아래로
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);
    const phases = result.segments.map((s) => s.phase);

    const firstFour = phases.indexOf(4);
    expect(firstFour).toBeGreaterThan(-1);
    // 4단계 다음 세그먼트는 1단계여야 한다(하락이 계속되는 채로 데드크로스가 났으므로).
    expect(phases[firstFour + 1]).toBe(1);
  });

  it("데이터가 너무 짧아 4주 누적을 계산할 수 없으면 구간이 비어 있다", () => {
    const dates = weeklyDates(3);
    const sale = series(dates, [90, 91, 92]);
    const jeonse = series(dates, [100, 100, 100]);

    const result = computeCycle(sale, jeonse);

    expect(result.segments).toEqual([]);
  });
});
