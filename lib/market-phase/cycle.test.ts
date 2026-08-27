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
  it("크로스가 한 번도 없으면 구간이 비어 있다", () => {
    const dates = weeklyDates(10);
    const sale = series(dates, dates.map(() => 90));
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);

    expect(result.segments).toEqual([]);
  });

  it("골든크로스 이후 매매·전세가 둘 다 잠잠하면 2단계를 유지한다(3단계로 넘어가지 않는다)", () => {
    const dates = weeklyDates(20);
    const saleValues = [
      99.5, 99.5, 99.5, 99.5, 99.5, 99.5, // 0~5: 매매 < 전세
      100.3, // 6: 골든크로스
      ...Array(13).fill(100.3), // 7~19: 매매도 전세도 변동 없음
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);

    expect(result.segments.map((s) => s.phase)).toEqual([2]);
    expect(result.segments[0].startDate).toBe(dates[6]);
  });

  it("골든크로스 이후 매매만 오르고 전세가 함께 오르면(전세가 꺾이지 않으면) 3단계로 넘어가지 않는다", () => {
    const dates = weeklyDates(20);
    const saleValues = [
      99.5, 99.5, 99.5, 99.5, 99.5, 99.5,
      100.3,
      101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, // 매매 계속 상승
    ];
    const jeonseValues = [
      100, 100, 100, 100, 100, 100,
      100,
      100.5, 101, 101.5, 102, 102.5, 103, 103.5, 104, 104.5, 105, 105.5, 106, 106.5, // 전세도 같이 상승
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, jeonseValues);

    const result = computeCycle(sale, jeonse);

    expect(result.segments.map((s) => s.phase)).toEqual([2]);
  });

  it("전체 사이클(2→3→4→1)이 순서대로만 나타난다", () => {
    const dates = weeklyDates(40);
    const saleValues = [
      99.5, 99.5, 99.5, 99.5, 99.5, 99.5, // 0~5: 매매 < 전세
      100.3, // 6: 골든크로스
      ...Array(13).fill(100.3), // 7~19: 2단계 유지(변동 없음)
      101, 102, 103, 104, 105, 106, 107, 108, 109, 110, // 20~29: 매매 계속 상승(고공행진)
      109, 107, 105, 103, 101, 98, 95, 92, 88, 80, // 30~39: 매매 하락 전환 후 계속 하락, 결국 전세 아래로
    ];
    const jeonseValues = [
      100, 100, 100, 100, 100, 100,
      100,
      ...Array(13).fill(100), // 2단계 구간: 전세도 변동 없음
      99, 98, 97, 96, 95, 94, 93, 92, 91, 90, // 20~29: 전세 하락(꺾임) — 매매 상승과 겹쳐 3단계 진입 조건
      90, 90, 90, 90, 90, 90, 90, 90, 90, 90, // 30~39: 전세는 안정
    ];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, jeonseValues);

    const result = computeCycle(sale, jeonse);
    const phaseOrder = result.segments.map((s) => s.phase);

    expect(phaseOrder[0]).toBe(2);
    expect(phaseOrder).toContain(3);
    expect(phaseOrder).toContain(4);
    expect(phaseOrder[phaseOrder.length - 1]).toBe(1);

    // 각 단계는 순서를 거스르지 않는다(2 -> 3 -> 4 -> 1이고, 역행하거나 건너뛰지 않는다).
    const firstOf = (p: 1 | 2 | 3 | 4) => phaseOrder.indexOf(p);
    expect(firstOf(2)).toBeLessThan(firstOf(3));
    expect(firstOf(3)).toBeLessThan(firstOf(4));
    expect(firstOf(4)).toBeLessThan(phaseOrder.lastIndexOf(1));

    // 연속된 두 세그먼트는 항상 정확히 하나씩만 다음 단계로 넘어간다(끼어드는 단계가 없다).
    for (let i = 1; i < phaseOrder.length; i++) {
      const prev = phaseOrder[i - 1];
      const curr = phaseOrder[i];
      const expectedNext = prev === 4 ? 1 : ((prev + 1) as 1 | 2 | 3 | 4);
      expect(curr).toBe(expectedNext);
    }
  });

  it("데이터가 너무 짧아 4주 누적을 계산할 수 없으면 2단계에서 더 진행하지 않는다", () => {
    const dates = weeklyDates(8);
    const saleValues = [99.5, 99.5, 99.5, 100.3, 105, 108, 110, 112];
    const sale = series(dates, saleValues);
    const jeonse = series(dates, dates.map(() => 100));

    const result = computeCycle(sale, jeonse);

    expect(result.segments.every((s) => s.phase === 2)).toBe(true);
  });
});
