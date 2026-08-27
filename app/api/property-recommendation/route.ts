import { NextRequest, NextResponse } from "next/server";
import { getPropertyRecommendation } from "@/lib/property-recommendation";

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region");
  if (!region) {
    return NextResponse.json({ error: "region 쿼리 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    const result = await getPropertyRecommendation(region);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
