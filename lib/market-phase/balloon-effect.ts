import type { Tier } from "./tiers";

/** 상급지 상승 전환 후 이 기간 이내에 하급지가 상승 전환되면 풍선효과 전이로 본다 */
export const BALLOON_TRANSITION_WINDOW_DAYS = 28; // 4주

export interface TierRisingTransition {
  tier: Tier;
  /** 가장 최근 상승 전환일(YYYY-MM-DD). 현재 상승 국면이 아니면 null */
  risingTransitionDate: string | null;
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return (new Date(b).getTime() - new Date(a).getTime()) / msPerDay;
}

/**
 * 급지 등급 순서를 기준으로 풍선효과 전이 여부를 판단한다.
 * 상급지(작은 급지 번호)가 상승 전환된 후 BALLOON_TRANSITION_WINDOW_DAYS 이내에
 * 하급지도 상승 전환됐으면 그 하급지를 "전이 중"으로 표시한다.
 */
export function detectBalloonTransitions(
  tierTransitions: TierRisingTransition[]
): Set<Tier> {
  const sorted = [...tierTransitions].sort((a, b) => a.tier - b.tier);
  const transitioning = new Set<Tier>();

  for (let i = 1; i < sorted.length; i++) {
    const lower = sorted[i];
    if (!lower.risingTransitionDate) continue;

    for (let j = 0; j < i; j++) {
      const upper = sorted[j];
      if (!upper.risingTransitionDate) continue;

      const gap = daysBetween(upper.risingTransitionDate, lower.risingTransitionDate);
      if (gap >= 0 && gap <= BALLOON_TRANSITION_WINDOW_DAYS) {
        transitioning.add(lower.tier);
        break;
      }
    }
  }

  return transitioning;
}
