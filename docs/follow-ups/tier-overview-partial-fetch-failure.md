# 지역 하나의 R-ONE 요청 실패가 대시보드 전체를 무너뜨린다

**Symptom**: `lib/market-phase/get-tier-market-overview.ts`의 `getTierMarketOverview`가 급지 내 모든 지역의 매매·전세 지수를 `Promise.all`로 병렬 요청한다. 지역 하나라도 요청이 실패(네트워크 오류, R-ONE 일시 장애 등)하면 `Promise.all`이 즉시 reject되어, 다른 급지가 전부 정상이어도 대시보드 전체가 렌더링되지 않는다.

**Observed evidence**: 코드 리뷰(2026-08-27, code-review low)로 발견. 실제 장애로 재현하지는 않았다 — 지금까지 로컬 실행에서는 모든 요청이 성공했다.

**Suspected cause**: `Promise.all(tierDef.regions.map((r) => fetchIndexSeries(r.clsId, "sale")))` 형태로, 개별 요청 실패를 급지 단위나 지역 단위로 격리하지 않는다.

**What was tried**: 손대지 않았다 — 스펙의 핵심 수용 기준(급지별 국면 표시)과 무관한 견고성 이슈이고, 지금은 실제 실패가 재현되지 않아 이번 구현에서는 범위 밖으로 남겼다.

**Proposed next step**: `Promise.allSettled`로 바꾸고, 실패한 지역/급지는 해당 카드에 "일부 데이터를 불러오지 못했습니다" 같은 부분 실패 상태로 표시하도록 `TierMarketOverview`에 상태 필드를 추가하는 방향을 검토한다.
