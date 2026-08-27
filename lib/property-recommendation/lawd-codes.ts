/**
 * 지역명 → 법정동코드(LAWD_CD, 5자리) 매핑.
 * 국토교통부 아파트 매매 실거래가 API 조회에 쓴다.
 * lib/market-phase/tiers.ts의 지역명과 1:1 대응한다(R-ONE CLS_ID와는 별개 코드 체계).
 *
 * 시·구가 여러 법정동코드로 나뉘는 지역(예: 수원시)은 배열로 묶어 합산 조회한다.
 */
export const LAWD_CODES: Record<string, string[]> = {
  강남구: ["11680"],
  서초구: ["11650"],
  용산구: ["11170"],
  송파구: ["11710"],
  성동구: ["11200"],
  과천시: ["41290"],
  마포구: ["11440"],
  광진구: ["11215"],
  양천구: ["11470"],
  "성남 분당구": ["41135"],
  강동구: ["11740"],
  영등포구: ["11560"],
  동작구: ["11590"],
  중구: ["11140"],
  종로구: ["11110"],
  서대문구: ["11410"],
  하남시: ["41450"],
  "성남 수정구": ["41131"],
  강서구: ["11500"],
  동대문구: ["11230"],
  성북구: ["11290"],
  은평구: ["11380"],
  "용인 수지구": ["41465"],
  광명시: ["41210"],
  "안양 동안구": ["41173"],
  관악구: ["11620"],
  노원구: ["11350"],
  구로구: ["11530"],
  중랑구: ["11260"],
  금천구: ["11545"],
  강북구: ["11305"],
  도봉구: ["11320"],
  화성시: ["41590"],
  군포시: ["41410"],
  "용인 기흥구": ["41463"],
  // Assumption: GLOSSARY.md의 "수원 등"은 tiers.ts에서 "수원시" 하나로 뭉뚱그려져 있다.
  // 실거래가 조회는 구 단위라 4개 구를 모두 합산한다.
  수원시: ["41111", "41113", "41115", "41117"],
};

export function getLawdCodes(regionName: string): string[] {
  return LAWD_CODES[regionName] ?? [];
}

const REGION_NAME_BY_LAWD_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(LAWD_CODES).flatMap(([regionName, codes]) => codes.map((code) => [code, regionName]))
);

/** 법정동코드(5자리)로 지역명을 역조회한다(단지식별 API 매칭에 쓴다). */
export function getRegionNameByLawdCode(lawdCode: string): string | null {
  return REGION_NAME_BY_LAWD_CODE[lawdCode] ?? null;
}
