import type { RawTrade, RawRent } from "./molit-client";

/** 국민평형(전용 84㎡)으로 볼 전용면적 범위. 단지마다 83~85㎡ 사이로 조금씩 다르게 표기된다. */
const NATIONAL_AREA_MIN = 83;
const NATIONAL_AREA_MAX = 85;

/** 거래량 집계 기준 기간(월). 필터에는 안 쓰지만 참고 정보로 화면에 보여준다. */
const VOLUME_LOOKBACK_MONTHS = 36;

/** 전세가 상승 조건에 쓰는 연복리 기대수익률 */
const JEONSE_COMPOUND_RATE = 0.05;

/**
 * 상승률 조건에 쓰는 기준 기간(년).
 * Assumption: 원래 로직은 5년·10년 두 기간을 모두 봤지만, API 호출량(개월 수만큼 요청)을 줄이기 위해
 * 최근 3년 데이터만 가져오기로 하면서 기준 기간도 3년 하나로 통일했다.
 */
const GROWTH_LOOKBACK_YEARS = [3] as const;
/** Top 10 정렬에 쓰는 기준 기간(년) */
const SORT_GROWTH_YEARS = 3;

const TOP_N = 10;

export interface TradePoint {
  dealDate: string;
  priceManwon: number;
}

export interface GrowthByPeriod {
  years: number;
  /** 84㎡ 매매가 상승률(%). 계산 불가하면 null. */
  saleGrowthRatePercent: number | null;
  /** 84㎡ 전세가 상승률(%). 계산 불가하면 null. */
  jeonseGrowthRatePercent: number | null;
  /** 전세가 상승액이 연복리 5% 기대치를 넘는지 */
  jeonseBeatsCompound: boolean | null;
  /** 매매 상승률이 전세 상승률보다 높은지 */
  saleOutpacesJeonse: boolean | null;
}

export interface ApartmentSummary {
  aptSeq: string;
  aptName: string;
  legalDongName: string;
  buildYear: number;
  /** 전용 84㎡ 최근 매매 거래가(만원). 거래 이력이 없으면 null. */
  latestArea84PriceManwon: number | null;
  /** 전용 84㎡ 최근 전세 보증금(만원). 거래 이력이 없으면 null. */
  latestArea84JeonseManwon: number | null;
  /** 전용 84㎡ 매매 시계열(계약월 오름차순) */
  area84Trades: TradePoint[];
  /** 전용 84㎡ 순수 전세 시계열(계약월 오름차순, 반전세·월세 제외) */
  area84Jeonse: TradePoint[];
  /** 3년 기준 상승률과 필터 통과 여부 */
  growthByPeriod: GrowthByPeriod[];
  /** 전체 평형 거래량 시계열(월별 건수, 최근 3년) */
  monthlyVolume: { yearMonth: string; tradeCount: number }[];
  /** 최근 3년 전체 평형 월평균 거래건수 */
  monthlyAvgTradeCount: number;
  /** 정렬에 쓰는 3년 매매가 상승률 */
  sortGrowthRatePercent: number | null;
}

function isNationalStandardArea(sqm: number): boolean {
  return sqm >= NATIONAL_AREA_MIN && sqm <= NATIONAL_AREA_MAX;
}

function groupByAptSeq<T extends { aptSeq: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const list = map.get(item.aptSeq);
    if (list) {
      list.push(item);
    } else {
      map.set(item.aptSeq, [item]);
    }
  }
  return map;
}

function yearMonthOf(dealDate: string): string {
  return dealDate.slice(0, 7);
}

/**
 * 지역 전체 매매 실거래가 중 전용 84㎡(국민평형) 최고가 아파트를 대장아파트로 지정한다.
 */
export function findFlagshipApartment(trades: RawTrade[]): RawTrade | null {
  const area84Trades = trades.filter((t) => isNationalStandardArea(t.exclusiveAreaSqm));
  if (area84Trades.length === 0) return null;
  return area84Trades.reduce((max, t) => (t.dealAmountManwon > max.dealAmountManwon ? t : max));
}

function computeMonthlyVolume(
  trades: RawTrade[],
  latestYearMonth: string
): { yearMonth: string; tradeCount: number }[] {
  const counts = new Map<string, number>();
  for (const t of trades) {
    const ym = yearMonthOf(t.dealDate);
    counts.set(ym, (counts.get(ym) ?? 0) + 1);
  }

  // VOLUME_LOOKBACK_MONTHS개월 전체를 0건인 달도 포함해 채운다(빈 달을 빼먹으면 평균이 부풀려진다).
  const [ly, lm] = latestYearMonth.split("-").map(Number);
  const result: { yearMonth: string; tradeCount: number }[] = [];
  for (let i = VOLUME_LOOKBACK_MONTHS - 1; i >= 0; i--) {
    const totalMonths = ly * 12 + (lm - 1) - i;
    const y = Math.floor(totalMonths / 12);
    const m = (totalMonths % 12) + 1;
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    result.push({ yearMonth: ym, tradeCount: counts.get(ym) ?? 0 });
  }
  return result;
}

/** targetDate 기준 ±3개월 거래의 평균가를 구한다. */
function averagePriceAround(points: TradePoint[], targetDate: Date): number | null {
  const windowMonths = 3;
  const targetTime = targetDate.getTime();
  const monthMs = 30 * 24 * 60 * 60 * 1000;

  const nearby = points.filter((p) => {
    const diff = Math.abs(new Date(p.dealDate).getTime() - targetTime);
    return diff <= windowMonths * monthMs;
  });
  if (nearby.length === 0) return null;
  return nearby.reduce((sum, p) => sum + p.priceManwon, 0) / nearby.length;
}

function computeGrowthRatePercent(points: TradePoint[], latestDate: Date, years: number): number | null {
  if (points.length === 0) return null;

  const recentPrice = averagePriceAround(points, latestDate);
  const pastDate = new Date(latestDate);
  pastDate.setFullYear(pastDate.getFullYear() - years);
  const pastPrice = averagePriceAround(points, pastDate);

  if (recentPrice === null || pastPrice === null || pastPrice === 0) return null;
  return ((recentPrice - pastPrice) / pastPrice) * 100;
}

/** pastPrice를 연복리 rate로 years년 굴렸을 때의 기대가(만원) */
function compoundedValue(pastPrice: number, years: number, rate: number): number {
  return pastPrice * Math.pow(1 + rate, years);
}

function computeGrowthByPeriod(
  saleTrades: TradePoint[],
  jeonseTrades: TradePoint[],
  latestDate: Date
): GrowthByPeriod[] {
  return GROWTH_LOOKBACK_YEARS.map((years) => {
    const saleGrowthRatePercent = computeGrowthRatePercent(saleTrades, latestDate, years);

    const jeonseRecent = averagePriceAround(jeonseTrades, latestDate);
    const jeonsePastDate = new Date(latestDate);
    jeonsePastDate.setFullYear(jeonsePastDate.getFullYear() - years);
    const jeonsePast = averagePriceAround(jeonseTrades, jeonsePastDate);
    const jeonseGrowthRatePercent =
      jeonseRecent !== null && jeonsePast !== null && jeonsePast !== 0
        ? ((jeonseRecent - jeonsePast) / jeonsePast) * 100
        : null;

    const jeonseBeatsCompound =
      jeonseRecent !== null && jeonsePast !== null
        ? jeonseRecent >= compoundedValue(jeonsePast, years, JEONSE_COMPOUND_RATE)
        : null;

    const saleOutpacesJeonse =
      saleGrowthRatePercent !== null && jeonseGrowthRatePercent !== null
        ? saleGrowthRatePercent > jeonseGrowthRatePercent
        : null;

    return { years, saleGrowthRatePercent, jeonseGrowthRatePercent, jeonseBeatsCompound, saleOutpacesJeonse };
  });
}

export function buildApartmentSummary(
  aptSeq: string,
  trades: RawTrade[],
  rents: RawRent[],
  latestYearMonth: string
): ApartmentSummary {
  const first = trades[0] ?? rents[0];
  const area84Trades: TradePoint[] = trades
    .filter((t) => isNationalStandardArea(t.exclusiveAreaSqm))
    .map((t) => ({ dealDate: t.dealDate, priceManwon: t.dealAmountManwon }))
    .sort((a, b) => a.dealDate.localeCompare(b.dealDate));

  const area84Jeonse: TradePoint[] = rents
    .filter((r) => r.monthlyRentManwon === 0 && isNationalStandardArea(r.exclusiveAreaSqm))
    .map((r) => ({ dealDate: r.dealDate, priceManwon: r.depositManwon }))
    .sort((a, b) => a.dealDate.localeCompare(b.dealDate));

  const [ly, lm] = latestYearMonth.split("-").map(Number);
  const latestDate = new Date(ly, lm - 1, 15);

  const monthlyVolume = computeMonthlyVolume(trades, latestYearMonth);
  const totalVolume = monthlyVolume.reduce((sum, m) => sum + m.tradeCount, 0);
  const growthByPeriod = computeGrowthByPeriod(area84Trades, area84Jeonse, latestDate);

  return {
    aptSeq,
    aptName: first.aptName,
    legalDongName: first.legalDongName,
    buildYear: Number(first.buildYear),
    latestArea84PriceManwon: area84Trades.at(-1)?.priceManwon ?? null,
    latestArea84JeonseManwon: area84Jeonse.at(-1)?.priceManwon ?? null,
    area84Trades,
    area84Jeonse,
    growthByPeriod,
    monthlyVolume,
    monthlyAvgTradeCount: totalVolume / VOLUME_LOOKBACK_MONTHS,
    sortGrowthRatePercent: computeGrowthRatePercent(area84Trades, latestDate, SORT_GROWTH_YEARS),
  };
}

export function summarizeApartments(
  trades: RawTrade[],
  rents: RawRent[],
  latestYearMonth: string
): ApartmentSummary[] {
  const tradesByApt = groupByAptSeq(trades);
  // Assumption: 매매·전월세 API가 같은 aptSeq 채번 체계(예: "11680-381")를 공유한다고 보고 매칭한다.
  const rentsByApt = groupByAptSeq(rents);
  return Array.from(tradesByApt.entries()).map(([aptSeq, list]) =>
    buildApartmentSummary(aptSeq, list, rentsByApt.get(aptSeq) ?? [], latestYearMonth)
  );
}

/**
 * 다음 조건을 모두 만족하는 아파트 중 3년 매매가 상승률이 높은 순으로 Top 10을 뽑는다.
 * - 1) 전세가 상승액이 3년 기준 연복리 5% 기대치를 넘음
 * - 2) 매매 상승률이 3년 기준 전세 상승률보다 높음
 *
 * Assumption: 0) 세대수, 3) 거래량 조건은 뺐다
 * (docs/follow-ups/property-recommendation-jeonse-and-household-count.md,
 *  docs/follow-ups/property-recommendation-volume-filter-too-strict.md 참고).
 */
export function rankTopApartments(summaries: ApartmentSummary[]): ApartmentSummary[] {
  return summaries
    .filter((s) => s.growthByPeriod.every((g) => g.jeonseBeatsCompound === true))
    .filter((s) => s.growthByPeriod.every((g) => g.saleOutpacesJeonse === true))
    .sort((a, b) => (b.sortGrowthRatePercent ?? 0) - (a.sortGrowthRatePercent ?? 0))
    .slice(0, TOP_N);
}
