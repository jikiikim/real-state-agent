export type Tier = 1 | 2 | 3 | 4 | 5 | 6;

export interface Region {
  name: string;
  /** R-ONE Open API 지역 코드(CLS_ID) */
  clsId: string;
}

export interface TierDefinition {
  tier: Tier;
  label: string;
  regions: Region[];
}

// GLOSSARY.md의 급지 정의를 그대로 따른다. 급지 구성을 바꿀 때는 이 목록을 직접 수정한다.
export const TIERS: TierDefinition[] = [
  {
    tier: 1,
    label: "1급지",
    regions: [
      { name: "강남구", clsId: "50068" },
      { name: "서초구", clsId: "50067" },
    ],
  },
  {
    tier: 2,
    label: "2급지",
    regions: [
      { name: "용산구", clsId: "50045" },
      { name: "송파구", clsId: "50069" },
      { name: "성동구", clsId: "50047" },
      { name: "과천시", clsId: "50071" },
    ],
  },
  {
    tier: 3,
    label: "3급지",
    regions: [
      { name: "마포구", clsId: "50058" },
      { name: "광진구", clsId: "50048" },
      { name: "양천구", clsId: "50060" },
      { name: "성남 분당구", clsId: "50080" },
      { name: "강동구", clsId: "50070" },
    ],
  },
  {
    tier: 4,
    label: "4급지",
    regions: [
      { name: "영등포구", clsId: "50064" },
      { name: "동작구", clsId: "50065" },
      { name: "중구", clsId: "50044" },
      { name: "종로구", clsId: "50043" },
      { name: "서대문구", clsId: "50057" },
      { name: "하남시", clsId: "50108" },
      { name: "성남 수정구", clsId: "50078" },
    ],
  },
  {
    tier: 5,
    label: "5급지",
    regions: [
      { name: "강서구", clsId: "50061" },
      { name: "동대문구", clsId: "50049" },
      { name: "성북구", clsId: "50051" },
      { name: "은평구", clsId: "50056" },
      { name: "용인 수지구", clsId: "50091" },
      { name: "광명시", clsId: "50097" },
      { name: "안양 동안구", clsId: "50074" },
      { name: "관악구", clsId: "50066" },
      { name: "노원구", clsId: "50054" },
    ],
  },
  {
    tier: 6,
    label: "6급지 이하",
    regions: [
      { name: "구로구", clsId: "50062" },
      { name: "중랑구", clsId: "50050" },
      { name: "금천구", clsId: "50063" },
      { name: "강북구", clsId: "50052" },
      { name: "도봉구", clsId: "50053" },
      { name: "화성시", clsId: "50104" },
      { name: "군포시", clsId: "50075" },
      { name: "용인 기흥구", clsId: "50090" },
      { name: "수원시", clsId: "50083" },
    ],
  },
];
