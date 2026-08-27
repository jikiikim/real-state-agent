import { NextRequest, NextResponse } from "next/server";
import { fetchComplexInfo } from "@/lib/property-recommendation/aptid-client";

export async function GET(request: NextRequest) {
  const legalDongName = request.nextUrl.searchParams.get("legalDongName");
  const jibun = request.nextUrl.searchParams.get("jibun");
  const aptName = request.nextUrl.searchParams.get("aptName");
  const regionName = request.nextUrl.searchParams.get("regionName");

  if (!legalDongName || !jibun || !aptName) {
    return NextResponse.json(
      { error: "legalDongName, jibun, aptName 쿼리 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const result = await fetchComplexInfo(legalDongName, jibun, aptName, regionName);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
