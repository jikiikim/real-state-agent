import { describe, expect, it } from "vitest";
import {
  classifyPhase,
  computeMonthlyChangeRates,
  computeRollingWeeklyChangeRate,
  computePhaseHistory,
  findLatestPhaseTransition,
} from "./phase";

describe("classifyPhase", () => {
  it("임계치 이상이면 상승으로 분류한다", () => {
    expect(classifyPhase(0.3)).toBe("상승");
    expect(classifyPhase(1.2)).toBe("상승");
  });

  it("임계치 이하(음수)면 하락으로 분류한다", () => {
    expect(classifyPhase(-0.3)).toBe("하락");
    expect(classifyPhase(-1.2)).toBe("하락");
  });

  it("임계치 사이면 보합으로 분류한다", () => {
    expect(classifyPhase(0)).toBe("보합");
    expect(classifyPhase(0.1)).toBe("보합");
    expect(classifyPhase(-0.29)).toBe("보합");
  });
});

describe("computeMonthlyChangeRates", () => {
  it("월별 마지막 관측치 기준으로 전월대비 증감률을 계산한다", () => {
    const result = computeMonthlyChangeRates([
      { date: "2025-01-06", value: 100 },
      { date: "2025-01-27", value: 100 },
      { date: "2025-02-03", value: 101 },
      { date: "2025-02-24", value: 102 },
    ]);

    expect(result).toEqual([{ month: "2025-02", changeRatePercent: 2 }]);
  });

  it("빈 시계열이면 빈 배열을 반환한다", () => {
    expect(computeMonthlyChangeRates([])).toEqual([]);
  });
});

describe("computeRollingWeeklyChangeRate", () => {
  it("최근 N주 누적 증감률을 계산한다", () => {
    const series = [
      { date: "2025-01-06", value: 100 },
      { date: "2025-01-13", value: 100.1 },
      { date: "2025-01-20", value: 100.2 },
      { date: "2025-01-27", value: 100.3 },
      { date: "2025-02-03", value: 100.6 },
    ];
    const result = computeRollingWeeklyChangeRate(series, 4);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0.6, 2);
  });

  it("데이터가 부족하면 null을 반환한다", () => {
    const series = [
      { date: "2025-01-06", value: 100 },
      { date: "2025-01-13", value: 100.1 },
    ];
    expect(computeRollingWeeklyChangeRate(series, 4)).toBeNull();
  });
});

describe("computePhaseHistory + findLatestPhaseTransition", () => {
  it("보합에서 상승으로 전환된 시점을 찾는다", () => {
    // 처음 4주는 보합 수준(누적 0.3% 미만), 이후 값이 뛰어 상승 전환
    const series = [
      { date: "2025-01-06", value: 100 },
      { date: "2025-01-13", value: 100.05 },
      { date: "2025-01-20", value: 100.1 },
      { date: "2025-01-27", value: 100.15 },
      { date: "2025-02-03", value: 100.2 }, // 4주 누적 0.2% -> 보합
      { date: "2025-02-10", value: 101 }, // 4주 누적 0.95% -> 상승
      { date: "2025-02-17", value: 101.5 }, // 계속 상승
    ];

    const history = computePhaseHistory(series, 4);
    expect(history.map((h) => h.phase)).toEqual(["보합", "상승", "상승"]);

    const transitionDate = findLatestPhaseTransition(history, "상승");
    expect(transitionDate).toBe("2025-02-10");
  });

  it("현재 국면이 targetPhase가 아니면 null을 반환한다", () => {
    const history = [
      { date: "2025-01-01", phase: "상승" as const },
      { date: "2025-01-08", phase: "보합" as const },
    ];
    expect(findLatestPhaseTransition(history, "상승")).toBeNull();
  });
});
