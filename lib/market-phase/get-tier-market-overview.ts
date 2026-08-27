import { TIERS, type Tier } from "./tiers";
import { fetchIndexSeries } from "./r-one-client";
import { averageIndexSeries } from "./aggregate";
import {
  classifyPhase,
  computeMonthlyChangeRates,
  computePhaseHistory,
  computeRollingWeeklyChangeRate,
  findLatestPhaseTransition,
  type MonthlyChangeRate,
  type Phase,
  type IndexPoint,
} from "./phase";
import { detectBalloonTransitions, type TierRisingTransition } from "./balloon-effect";
import { computeCycle, type CycleSegment, type CrossEvent } from "./cycle";

export interface IndexOverview {
  /** 최근 4주 데이터가 부족하면 국면을 판단할 수 없어 null이다 */
  weeklyPhase: Phase | null;
  weeklyChangeRatePercent: number | null;
  monthlyChangeRates: MonthlyChangeRate[];
  recentWeeklySeries: IndexPoint[];
}

export interface CycleOverview {
  saleSeries: IndexPoint[];
  jeonseSeries: IndexPoint[];
  segments: CycleSegment[];
  crosses: CrossEvent[];
}

export interface TierMarketOverview {
  tier: Tier;
  label: string;
  regionNames: string[];
  sale: IndexOverview;
  jeonse: IndexOverview;
  /** 상급지 상승 전환 후 4주 이내에 이 급지도 상승 전환됐는지(매매 기준) */
  isBalloonTransitioning: boolean;
  cycle: CycleOverview;
}

const RECENT_WEEKLY_POINTS = 16;
/** 매매/전세 사이클 그래프에 쓸 최근 기간(3년 ≈ 156주) */
const CYCLE_CHART_WEEKS = 156;

function buildIndexOverview(series: IndexPoint[]): { overview: IndexOverview; risingTransitionDate: string | null } {
  const weeklyChangeRatePercent = computeRollingWeeklyChangeRate(series);
  const weeklyPhase = weeklyChangeRatePercent === null ? null : classifyPhase(weeklyChangeRatePercent);
  const monthlyChangeRates = computeMonthlyChangeRates(series);
  const history = computePhaseHistory(series);
  const risingTransitionDate = findLatestPhaseTransition(history, "상승");

  return {
    overview: {
      weeklyPhase,
      weeklyChangeRatePercent,
      monthlyChangeRates,
      recentWeeklySeries: series.slice(-RECENT_WEEKLY_POINTS),
    },
    risingTransitionDate,
  };
}

/**
 * 급지별 매매·전세 국면과 풍선효과 전이 여부를 조합해서 반환한다.
 * app/page.tsx가 이 함수 하나만 호출하면 대시보드에 필요한 데이터를 전부 얻는다.
 */
export async function getTierMarketOverview(): Promise<TierMarketOverview[]> {
  const perTier = await Promise.all(
    TIERS.map(async (tierDef) => {
      const [saleSeriesByRegion, jeonseSeriesByRegion] = await Promise.all([
        Promise.all(tierDef.regions.map((r) => fetchIndexSeries(r.clsId, "sale"))),
        Promise.all(tierDef.regions.map((r) => fetchIndexSeries(r.clsId, "jeonse"))),
      ]);

      const saleSeries = averageIndexSeries(saleSeriesByRegion);
      const jeonseSeries = averageIndexSeries(jeonseSeriesByRegion);

      const sale = buildIndexOverview(saleSeries);
      const jeonse = buildIndexOverview(jeonseSeries);

      const cycleSaleSeries = saleSeries.slice(-CYCLE_CHART_WEEKS);
      const cycleJeonseSeries = jeonseSeries.slice(-CYCLE_CHART_WEEKS);
      const { segments, crosses } = computeCycle(cycleSaleSeries, cycleJeonseSeries);

      return {
        tier: tierDef.tier,
        label: tierDef.label,
        regionNames: tierDef.regions.map((r) => r.name),
        sale: sale.overview,
        jeonse: jeonse.overview,
        risingTransitionDate: sale.risingTransitionDate,
        cycle: {
          saleSeries: cycleSaleSeries,
          jeonseSeries: cycleJeonseSeries,
          segments,
          crosses,
        } satisfies CycleOverview,
      };
    })
  );

  const transitions: TierRisingTransition[] = perTier.map((t) => ({
    tier: t.tier,
    risingTransitionDate: t.risingTransitionDate,
  }));
  const balloonTiers = detectBalloonTransitions(transitions);

  return perTier.map(({ tier, label, regionNames, sale, jeonse, cycle }) => ({
    tier,
    label,
    regionNames,
    sale,
    jeonse,
    isBalloonTransitioning: balloonTiers.has(tier),
    cycle,
  }));
}
