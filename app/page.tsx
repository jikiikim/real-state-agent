import { getTierMarketOverview } from "@/lib/market-phase";
import { TierDashboard } from "@/components/market-phase/tier-dashboard";

export default async function Home() {
  const overviews = await getTierMarketOverview();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">급지별 국면 판단 대시보드</h1>
          <p className="text-sm text-muted-foreground">
            서울·수도권 급지별 매매·전세지수 흐름을 보고 현재 국면(상승/하락/보합)과 풍선효과 전이 여부를 확인하세요.
            데이터 출처: 한국부동산원(R-ONE) 주간 아파트가격동향.
          </p>
        </div>
        <TierDashboard overviews={overviews} />
      </main>
    </div>
  );
}
