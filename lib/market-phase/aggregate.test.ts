import { describe, expect, it } from "vitest";
import { averageIndexSeries } from "./aggregate";

describe("averageIndexSeries", () => {
  it("같은 날짜끼리 값을 평균낸다", () => {
    const result = averageIndexSeries([
      [
        { date: "2025-01-06", value: 100 },
        { date: "2025-01-13", value: 102 },
      ],
      [
        { date: "2025-01-06", value: 110 },
        { date: "2025-01-13", value: 108 },
      ],
    ]);

    expect(result).toEqual([
      { date: "2025-01-06", value: 105 },
      { date: "2025-01-13", value: 105 },
    ]);
  });

  it("일부 지역에만 있는 날짜도 그 지역들만으로 평균낸다", () => {
    const result = averageIndexSeries([
      [{ date: "2025-01-06", value: 100 }],
      [
        { date: "2025-01-06", value: 200 },
        { date: "2025-01-13", value: 300 },
      ],
    ]);

    expect(result).toEqual([
      { date: "2025-01-06", value: 150 },
      { date: "2025-01-13", value: 300 },
    ]);
  });
});
