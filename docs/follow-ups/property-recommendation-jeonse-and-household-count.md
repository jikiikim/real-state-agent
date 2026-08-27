# 매물 추천 필터에서 세대수 조건이 빠져 있다

**Symptom**: `lib/property-recommendation/aggregate.ts`의 `rankTopApartments`가 사용자가 원래 정의한 4개 필터(0.세대수 1000세대 이상, 1.전세가 상승액 연복리 5% 초과(5년·10년 모두), 2.매매 상승률 > 전세 상승률, 3.거래량 월평균 5건 이상) 중 0번(세대수)만 빠져 있다. 1·2·3번은 국토교통부 매매·전월세 실거래가 API로 구현했다.

**Observed evidence**: 세션 중 사용자에게 직접 확인함(2026-08-27) — 처음엔 "전월세, 세대수 제외"로 축소 지시를 받았으나, 이후 전월세 API 활용신청이 완료되어 전세 조건은 복원했다. 세대수만 여전히 데이터 소스가 없다.

**Suspected cause**: 세대수는 매매·전월세 실거래가 API 응답에 없다. `AptBasisInfoServiceV3`(공동주택 기본정보) 엔드포인트를 테스트했더니 "NO_OPENAPI_SERVICE_ERROR"(서비스 없음/폐기)가 나왔다. 정확한 최신 서비스명·엔드포인트를 다시 확인해야 한다.

**What was tried**: `AptBasisInfoServiceV3`(`http://apis.data.go.kr/1613000/AptBasisInfoServiceV3/getAphusBassInfoV3`)를 같은 서비스키로 curl 테스트했다. 실패.

**Proposed next step**:
1. `data.go.kr`에서 "공동주택 단지 목록제공 서비스"(https://www.data.go.kr/data/15057332/openapi.do) 또는 "공동주택 기본 정보제공 서비스"(https://www.data.go.kr/data/15058453/openapi.do)의 최신 엔드포인트·요청 파라미터를 다시 확인한다.
2. 실거래가 API의 `aptSeq`("11680-381" 형식)를 세대수 API의 단지코드(`kaptCode`, "A10027118" 형식)에 매칭하는 방법을 확인한다(형식이 달라 직접 매칭이 안 될 수 있다).
3. 세대수가 확보되면 `rankTopApartments`에 0번 필터(1000세대 이상)를 추가한다.
