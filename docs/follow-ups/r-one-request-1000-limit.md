# R-ONE 주간 시계열이 1,000건을 넘으면 조회가 전부 실패한다

**Symptom**: `lib/market-phase/r-one-client.ts`의 `fetchIndexSeries`가 2012년부터 현재까지 전체 기간을 한 번의 요청(pSize=1000)으로 가져온다. 데이터가 1,000건을 넘으면 R-ONE API가 정상 응답 대신 `ERROR-336`("데이터요청은 한번에 최대 1,000건을 넘을 수 없습니다")만 반환해, 지수 값을 하나도 못 가져와 대시보드 전체가 깨진다.

**Observed evidence**: 2026-08-27 기준 강남구 매매지수(WK, 2012~) 조회 결과는 743건으로 아직 한계 이내다(`curl` 테스트로 확인). 주 1건씩 쌓이므로 약 2031년경 1,000건을 넘을 것으로 계산된다.

**Suspected cause**: `fetchIndexSeries`가 `pIndex`/`pSize` 기반 페이지네이션 없이 고정된 `pSize=1000` 한 번의 요청으로만 전체 기간을 커버하도록 짜여 있다.

**What was tried**: 현재는 손대지 않았다 — 지금 시점에는 데이터가 한계 이내라 재현되지 않고, 스펙 범위(대시보드 핵심 기능) 밖의 방어적 확장이라 이번 구현에서는 넘어갔다.

**Proposed next step**: `fetchIndexSeries`에 `pIndex` 루프를 추가해 `list_total_count`가 1,000을 넘으면 다음 페이지를 이어서 요청하도록 고친다. 또는 START_WRTTIME을 롤링(예: 최근 10년)으로 좁혀 요청 건수 자체를 줄이는 방법도 검토할 수 있다.
