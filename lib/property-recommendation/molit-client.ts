import { XMLParser } from "fast-xml-parser";

const TRADE_URL =
  "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev";
const RENT_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent";

export interface RawTrade {
  aptSeq: string;
  aptName: string;
  buildYear: number;
  /** 만원 단위 */
  dealAmountManwon: number;
  /** YYYY-MM-DD */
  dealDate: string;
  exclusiveAreaSqm: number;
  floor: number;
  legalDongName: string;
  lawdCode: string;
  /** 지번(본번-부번, 부번이 0이면 "본번"만). 단지식별 API 조회에 쓴다. */
  jibun: string;
}

export interface RawRent {
  aptSeq: string;
  aptName: string;
  buildYear: number;
  /** 보증금(만원 단위) */
  depositManwon: number;
  /** 0이면 순수 전세, 0보다 크면 반전세·월세 */
  monthlyRentManwon: number;
  /** YYYY-MM-DD */
  dealDate: string;
  exclusiveAreaSqm: number;
  floor: number;
  legalDongName: string;
  lawdCode: string;
}

interface MolitTradeItem {
  aptSeq: string;
  aptNm: string;
  buildYear: number | string;
  dealAmount: number | string;
  dealYear: number | string;
  dealMonth: number | string;
  dealDay: number | string;
  excluUseAr: number | string;
  floor: number | string;
  umdNm: string;
  bonbun: string;
  bubun: string;
}

interface MolitRentItem {
  aptSeq: string;
  aptNm: string;
  buildYear: number | string;
  deposit: number | string;
  monthlyRent: number | string;
  dealYear: number | string;
  dealMonth: number | string;
  dealDay: number | string;
  excluUseAr: number | string;
  floor: number | string;
  umdNm: string;
}

interface MolitResponse<TItem> {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: {
      items?: { item?: TItem[] };
      totalCount?: number;
    };
  };
}

const parser = new XMLParser({
  isArray: (name) => name === "item",
  // resultCode("000")처럼 앞자리 0이 의미 있는 코드값이 숫자로 바뀌지 않게 막는다.
  parseTagValue: false,
});

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseManwon(raw: number | string): number {
  return Number(String(raw).replace(/,/g, "").trim());
}

/**
 * 동시 요청 수를 concurrency로 제한해서 items를 처리한다.
 * 공공데이터포털이 짧은 시간에 몰리는 대량 요청을 트래픽 초과(403)로 막기 때문에 필요하다.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

const MOLIT_REQUEST_CONCURRENCY = 5;

async function fetchMolit<TItem>(
  baseUrl: string,
  lawdCode: string,
  dealYmd: string,
  label: string
): Promise<TItem[]> {
  const serviceKey = process.env.MOLIT_API_KEY;
  if (!serviceKey) {
    throw new Error("MOLIT_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const url = new URL(baseUrl);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("LAWD_CD", lawdCode);
  url.searchParams.set("DEAL_YMD", dealYmd);
  url.searchParams.set("pageNo", "1");
  // 지역 하나가 월 1,000건을 넘는 경우는 없다고 보고 고정 페이지 크기로 요청한다.
  url.searchParams.set("numOfRows", "1000");

  const res = await fetch(url.toString(), {
    // 실거래 신고는 소급 신고가 있어 과거 달도 바뀔 수 있지만, 학습용 템플릿이라 하루 단위로 캐시한다.
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) {
    throw new Error(
      `국토교통부 ${label} API 요청이 실패했습니다 (${res.status}): LAWD_CD=${lawdCode}, DEAL_YMD=${dealYmd}`
    );
  }

  const xml = await res.text();
  const data = parser.parse(xml) as MolitResponse<TItem>;
  const { resultCode, resultMsg } = data.response.header;
  if (resultCode !== "000") {
    throw new Error(
      `국토교통부 ${label} API 응답 오류(${resultCode}): ${resultMsg} (LAWD_CD=${lawdCode}, DEAL_YMD=${dealYmd})`
    );
  }

  return data.response.body?.items?.item ?? [];
}

/** bonbun("0316")·bubun("0000")을 단지식별 API의 ADRES 표기("316" 또는 "316-4")로 조합한다. */
function formatJibun(bonbun: string, bubun: string): string {
  const bon = Number(bonbun);
  const bu = Number(bubun);
  return bu > 0 ? `${bon}-${bu}` : `${bon}`;
}

/** 국토교통부 아파트 매매 실거래가 상세 자료를 한 달치 가져온다. */
export async function fetchMonthlyTrades(lawdCode: string, dealYmd: string): Promise<RawTrade[]> {
  const items = await fetchMolit<MolitTradeItem>(TRADE_URL, lawdCode, dealYmd, "매매 실거래가");
  return items.map((item) => ({
    aptSeq: item.aptSeq,
    aptName: item.aptNm.trim(),
    buildYear: Number(item.buildYear),
    dealAmountManwon: parseManwon(item.dealAmount),
    dealDate: `${item.dealYear}-${pad2(Number(item.dealMonth))}-${pad2(Number(item.dealDay))}`,
    exclusiveAreaSqm: Number(item.excluUseAr),
    floor: Number(item.floor),
    legalDongName: item.umdNm.trim(),
    lawdCode,
    jibun: formatJibun(item.bonbun, item.bubun),
  }));
}

/** 국토교통부 아파트 전월세 실거래 자료를 한 달치 가져온다(전세·반전세·월세 모두 포함). */
export async function fetchMonthlyRents(lawdCode: string, dealYmd: string): Promise<RawRent[]> {
  const items = await fetchMolit<MolitRentItem>(RENT_URL, lawdCode, dealYmd, "전월세 실거래가");
  return items.map((item) => ({
    aptSeq: item.aptSeq,
    aptName: item.aptNm.trim(),
    buildYear: Number(item.buildYear),
    depositManwon: parseManwon(item.deposit),
    monthlyRentManwon: parseManwon(item.monthlyRent),
    dealDate: `${item.dealYear}-${pad2(Number(item.dealMonth))}-${pad2(Number(item.dealDay))}`,
    exclusiveAreaSqm: Number(item.excluUseAr),
    floor: Number(item.floor),
    legalDongName: item.umdNm.trim(),
    lawdCode,
  }));
}

/** endYmd(포함)부터 과거 monthsCount개월치 YYYYMM 목록을 최신순으로 만든다. */
export function buildYmdRange(endYmd: string, monthsCount: number): string[] {
  const year = Number(endYmd.slice(0, 4));
  const month = Number(endYmd.slice(4, 6));
  const result: string[] = [];
  for (let i = 0; i < monthsCount; i++) {
    const totalMonths = year * 12 + (month - 1) - i;
    const y = Math.floor(totalMonths / 12);
    const m = (totalMonths % 12) + 1;
    result.push(`${y}${pad2(m)}`);
  }
  return result;
}

/** 여러 법정동코드에 대해 최근 monthsCount개월치 매매 실거래가를 모두 가져온다. */
export async function fetchTradesForRegion(
  lawdCodes: string[],
  endYmd: string,
  monthsCount: number
): Promise<RawTrade[]> {
  const months = buildYmdRange(endYmd, monthsCount);
  const requests = lawdCodes.flatMap((code) => months.map((ymd) => ({ code, ymd })));
  const results = await mapWithConcurrency(requests, MOLIT_REQUEST_CONCURRENCY, ({ code, ymd }) =>
    fetchMonthlyTrades(code, ymd)
  );
  return results.flat();
}

/** 여러 법정동코드에 대해 최근 monthsCount개월치 전월세 실거래가를 모두 가져온다. */
export async function fetchRentsForRegion(
  lawdCodes: string[],
  endYmd: string,
  monthsCount: number
): Promise<RawRent[]> {
  const months = buildYmdRange(endYmd, monthsCount);
  const requests = lawdCodes.flatMap((code) => months.map((ymd) => ({ code, ymd })));
  const results = await mapWithConcurrency(requests, MOLIT_REQUEST_CONCURRENCY, ({ code, ymd }) =>
    fetchMonthlyRents(code, ymd)
  );
  return results.flat();
}
