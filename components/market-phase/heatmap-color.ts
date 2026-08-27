/** 증감률(%) 강도에 따른 히트맵 배경/글자색. 상승은 빨강 계열, 하락은 파랑 계열로 진하기를 나눈다. */
export function heatmapCellClassName(changeRatePercent: number): string {
  const abs = Math.abs(changeRatePercent);

  if (changeRatePercent > 0) {
    if (abs >= 2) return "bg-red-600 text-white dark:bg-red-500";
    if (abs >= 1) return "bg-red-400 text-white dark:bg-red-600/80";
    if (abs >= 0.3) return "bg-red-200 dark:bg-red-900/50";
    return "bg-transparent";
  }

  if (changeRatePercent < 0) {
    if (abs >= 2) return "bg-blue-600 text-white dark:bg-blue-500";
    if (abs >= 1) return "bg-blue-400 text-white dark:bg-blue-600/80";
    if (abs >= 0.3) return "bg-blue-200 dark:bg-blue-900/50";
    return "bg-transparent";
  }

  return "bg-transparent";
}
