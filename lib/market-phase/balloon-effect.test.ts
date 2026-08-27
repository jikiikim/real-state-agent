import { describe, expect, it } from "vitest";
import { detectBalloonTransitions } from "./balloon-effect";

describe("detectBalloonTransitions", () => {
  it("상급지 상승 전환 4주 이내에 하급지가 전환되면 전이 중으로 표시한다", () => {
    const result = detectBalloonTransitions([
      { tier: 1, risingTransitionDate: "2025-01-06" },
      { tier: 2, risingTransitionDate: "2025-01-27" }, // 3주 뒤
      { tier: 3, risingTransitionDate: null },
    ]);

    expect(result.has(2)).toBe(true);
    expect(result.has(1)).toBe(false);
    expect(result.has(3)).toBe(false);
  });

  it("4주를 넘겨 전환되면 전이로 보지 않는다", () => {
    const result = detectBalloonTransitions([
      { tier: 1, risingTransitionDate: "2025-01-06" },
      { tier: 2, risingTransitionDate: "2025-03-01" }, // 훨씬 뒤
    ]);

    expect(result.has(2)).toBe(false);
  });

  it("상급지가 상승 국면이 아니면 하급지도 전이로 보지 않는다", () => {
    const result = detectBalloonTransitions([
      { tier: 1, risingTransitionDate: null },
      { tier: 2, risingTransitionDate: "2025-01-27" },
    ]);

    expect(result.has(2)).toBe(false);
  });
});
