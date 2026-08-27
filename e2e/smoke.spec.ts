import { expect, test } from "@playwright/test";

test("대시보드가 열리고 급지별 국면이 표시된다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("급지별 국면 판단 대시보드");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "급지별 국면 판단 대시보드"
  );
  await expect(page.getByText("1급지").first()).toBeVisible();
  await expect(page.getByText("6급지 이하").first()).toBeVisible();
});

test("급지 탭을 선택하면 매매/전세 가격변동 탭이 기본으로 보이고 사이클 4단계 요약이 나온다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "3급지" }).click();
  await expect(page.getByText("최근 3년 주간 지수와 시장 사이클 4단계")).toBeVisible();
  await expect(page.getByText("1단계 · 전세 상승")).toBeVisible();
  await expect(page.getByText("4단계 · 시장 조정")).toBeVisible();
});

test("매매 탭에서는 월간 히트맵이 바로 보이고, 주간 추이는 버튼을 눌러야 보인다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "3급지" }).click();
  await page.getByRole("tab", { name: "매매", exact: true }).click();

  await expect(page.getByText("월간 흐름 (전월대비 증감률)")).toBeVisible();
  await expect(page.getByText("최근 주간 추이")).toBeHidden();

  await page.getByRole("button", { name: "상세 데이터 보기" }).click();
  await expect(page.getByText("최근 주간 추이")).toBeVisible();

  await page.getByRole("button", { name: "상세 데이터 숨기기" }).click();
  await expect(page.getByText("최근 주간 추이")).toBeHidden();
});
