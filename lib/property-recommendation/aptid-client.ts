const BASE_URL = "https://api.odcloud.kr/api/AptIdInfoSvc/v1/getAptInfo";

export interface ComplexInfo {
  /** 세대수 */
  unitCount: number;
  /** 동수 */
  buildingCount: number;
  /** 사용승인일(YYYY-MM-DD) */
  useApprovalDate: string | null;
}

interface AptInfoItem {
  ADRES: string;
  COMPLEX_NM1: string | null;
  COMPLEX_NM2: string | null;
  COMPLEX_NM3: string | null;
  DONG_CNT: number;
  UNIT_CNT: number;
  USEAPR_DT: string | null;
}

interface AptInfoResponse {
  data: AptInfoItem[];
}

/** 아파트명 비교를 위해 공백·"아파트"·괄호 표기를 지운다. */
function normalizeName(name: string | null): string {
  if (!name) return "";
  return name.replace(/\s/g, "").replace(/아파트/g, "").replace(/\(.*?\)/g, "");
}

function namesMatch(aptName: string, item: AptInfoItem): boolean {
  const target = normalizeName(aptName);
  if (!target) return false;
  return [item.COMPLEX_NM1, item.COMPLEX_NM2, item.COMPLEX_NM3].some((candidate) => {
    const normalized = normalizeName(candidate);
    return normalized.length > 0 && (normalized.includes(target) || target.includes(normalized));
  });
}

function formatUseApprovalDate(raw: string | null): string | null {
  if (!raw || raw.length !== 8) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

/**
 * 한국부동산원 공동주택 단지 식별정보 조회 서비스(odcloud.kr)로 세대수·동수를 찾는다.
 * 법정동명+지번으로 주소 LIKE 검색한 뒤, 지역명(구/시)이 주소에 포함되고
 * 아파트명이 유사한 후보를 골라낸다. 못 찾으면 null.
 */
export async function fetchComplexInfo(
  legalDongName: string,
  jibun: string,
  aptName: string,
  regionName: string | null
): Promise<ComplexInfo | null> {
  const serviceKey = process.env.APT_ID_INFO_API_KEY;
  if (!serviceKey) {
    throw new Error("APT_ID_INFO_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("page", "1");
  url.searchParams.set("perPage", "20");
  url.searchParams.set("cond[ADRES::LIKE]", `${legalDongName} ${jibun}`);

  const res = await fetch(url.toString(), {
    // 단지 기본정보는 거의 안 바뀌므로 길게 캐시한다.
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!res.ok) {
    throw new Error(`단지식별 API 요청이 실패했습니다 (${res.status}): ${legalDongName} ${jibun}`);
  }

  const data = (await res.json()) as AptInfoResponse;
  const candidates = data.data ?? [];
  if (candidates.length === 0) return null;

  // 지역명(구/시)이 주소에 포함되는 후보를 우선한다(동명이 여러 지역에 겹칠 수 있어서다).
  const regionToken = regionName?.split(" ").at(-1) ?? null;
  const regionFiltered = regionToken ? candidates.filter((c) => c.ADRES.includes(regionToken)) : candidates;
  const pool = regionFiltered.length > 0 ? regionFiltered : candidates;

  const matched = pool.find((c) => namesMatch(aptName, c)) ?? (pool.length === 1 ? pool[0] : null);
  if (!matched) return null;

  return {
    unitCount: matched.UNIT_CNT,
    buildingCount: matched.DONG_CNT,
    useApprovalDate: formatUseApprovalDate(matched.USEAPR_DT),
  };
}
