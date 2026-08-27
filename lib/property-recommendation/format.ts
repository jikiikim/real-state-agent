/** 만원 단위 금액을 "6억 5,767" 형태의 한국식 표기로 바꾼다. */
export function formatManwon(manwon: number): string {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok === 0) return `${rest.toLocaleString("ko-KR")}만원`;
  if (rest === 0) return `${eok}억`;
  return `${eok}억 ${rest.toLocaleString("ko-KR")}`;
}

export function formatGrowthPercent(percent: number | null): string {
  if (percent === null) return "-";
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}
