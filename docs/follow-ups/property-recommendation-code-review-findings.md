# 매물 추천 코드 리뷰에서 나온 사소한 이슈 2건

**Symptom**:
1. `lib/property-recommendation/aggregate.ts`의 `computeGrowthByPeriod`(전세 부분)가 바로 위에 있는 `computeGrowthRatePercent` 함수를 안 쓰고 같은 계산(`averagePriceAround` 두 번 호출 + 퍼센트 계산)을 인라인으로 중복 구현했다.
2. `components/property-recommendation/apartment-price-chart.tsx`의 `mergePriceSeries`가 같은 날짜에 거래가 여러 건이면 `Map.set`으로 마지막 값만 남기고 앞의 거래를 덮어써서 그래프에서 누락시킨다.

**Observed evidence**: code-review low(2026-08-27)에서 발견. 둘 다 주 경로(매물 추천 화면이 뜨고 데이터가 표시되는 것)를 깨뜨리지는 않아 이번 검증 예산에서는 손대지 않았다.

**Suspected cause**: 1번은 단순 리팩토링 누락. 2번은 하루에 같은 단지에서 여러 세대가 거래되는 경우(실제 강남구 데이터에서도 관찰됨, 예: 2024-06-24에 425000만원 거래 2건)를 고려하지 않고 짠 병합 로직.

**Proposed next step**:
1. `computeGrowthByPeriod`의 전세 계산 부분을 `computeGrowthRatePercent(jeonseTrades, latestDate, years)` 호출로 교체한다.
2. `mergePriceSeries`에서 같은 날짜에 여러 거래가 있으면 평균을 내거나, Map 대신 배열로 유지해 포인트를 모두 그래프에 반영한다.
