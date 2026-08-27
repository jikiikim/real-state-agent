import { getLawdCodes } from "./lawd-codes";
import { fetchTradesForRegion, fetchRentsForRegion } from "./molit-client";
import { findFlagshipApartment, summarizeApartments, rankTopApartments, type ApartmentSummary } from "./aggregate";

/** 3년 상승률 계산 + 거래량 집계에 쓸 기간(개월) */
const FETCH_MONTHS = 36;

export interface PropertyRecommendation {
  regionName: string;
  /** 전용 84㎡ 최고 매매 실거래가 아파트 */
  flagship: ApartmentSummary | null;
  topApartments: ApartmentSummary[];
}

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * 지역 하나를 선택했을 때 대장아파트 + 추천 Top 30을 계산한다.
 * app/api/property-recommendation/route.ts가 이 함수를 호출한다.
 */
export async function getPropertyRecommendation(regionName: string): Promise<PropertyRecommendation> {
  const lawdCodes = getLawdCodes(regionName);
  if (lawdCodes.length === 0) {
    throw new Error(`법정동코드가 등록되지 않은 지역입니다: ${regionName}`);
  }

  const endYmd = currentYearMonth();
  const [trades, rents] = await Promise.all([
    fetchTradesForRegion(lawdCodes, endYmd, FETCH_MONTHS),
    fetchRentsForRegion(lawdCodes, endYmd, FETCH_MONTHS),
  ]);
  const latestYearMonth = `${endYmd.slice(0, 4)}-${endYmd.slice(4, 6)}`;

  const flagshipTrade = findFlagshipApartment(trades);
  const summaries = summarizeApartments(trades, rents, latestYearMonth);
  const flagship = flagshipTrade
    ? (summaries.find((s) => s.aptSeq === flagshipTrade.aptSeq) ?? null)
    : null;

  return {
    regionName,
    flagship,
    topApartments: rankTopApartments(summaries),
  };
}
