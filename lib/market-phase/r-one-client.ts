import type { IndexPoint } from "./phase";

const BASE_URL = "https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do";

/** 한국부동산원 R-ONE 주간 아파트가격동향의 통계표 ID */
const STATBL_ID = {
  sale: "T244183132827305", // (주) 매매가격지수
  jeonse: "T247713133046872", // (주) 전세가격지수
} as const;

export type IndexKind = keyof typeof STATBL_ID;

interface SttsApiRow {
  WRTTIME_DESC: string;
  DTA_VAL: number;
}

interface SttsApiSuccessResponse {
  SttsApiTblData: [
    { head: [{ list_total_count: number }, { RESULT: { CODE: string; MESSAGE: string } }] },
    { row?: SttsApiRow[] }
  ];
}

/** 요청 자체가 잘못된 경우(파라미터 오류 등) 최상위에 RESULT가 바로 온다 */
interface SttsApiErrorResponse {
  RESULT: { CODE: string; MESSAGE: string };
}

type SttsApiResponse = SttsApiSuccessResponse | SttsApiErrorResponse;

function isErrorResponse(data: SttsApiResponse): data is SttsApiErrorResponse {
  return "RESULT" in data;
}

/**
 * R-ONE 주간 매매·전세가격지수 시계열을 가져온다.
 * 2012년 서비스 시작 시점부터 최신까지 한 번에 조회한다(pSize를 충분히 크게 설정).
 */
export async function fetchIndexSeries(
  clsId: string,
  kind: IndexKind
): Promise<IndexPoint[]> {
  const apiKey = process.env.R_ONE_API_KEY;
  if (!apiKey) {
    throw new Error("R_ONE_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("KEY", apiKey);
  url.searchParams.set("STATBL_ID", STATBL_ID[kind]);
  url.searchParams.set("DTACYCLE_CD", "WK");
  url.searchParams.set("CLS_ID", clsId);
  url.searchParams.set("ITM_ID", "10001");
  url.searchParams.set("START_WRTTIME", "201201");
  url.searchParams.set("END_WRTTIME", "203001");
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", "1000"); // R-ONE API 최대 요청 건수

  const res = await fetch(url.toString(), {
    // 주간 지수라 자주 바뀌지 않으니 하루 단위로 캐시한다.
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) {
    throw new Error(`R-ONE API 요청이 실패했습니다 (${res.status}): CLS_ID=${clsId}, kind=${kind}`);
  }

  const data = (await res.json()) as SttsApiResponse;
  if (isErrorResponse(data)) {
    throw new Error(
      `R-ONE API 요청 오류(${data.RESULT.CODE}): ${data.RESULT.MESSAGE} (CLS_ID=${clsId}, kind=${kind})`
    );
  }

  const [head, body] = data.SttsApiTblData;
  const resultCode = head.head[1].RESULT.CODE;
  if (resultCode !== "INFO-000") {
    throw new Error(`R-ONE API 응답 오류(${resultCode}): CLS_ID=${clsId}, kind=${kind}`);
  }

  const rows = body.row ?? [];
  return rows
    .map((row) => ({ date: row.WRTTIME_DESC, value: row.DTA_VAL }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
