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

test("급지 탭을 선택하면 해당 급지의 월간 히트맵과 주간 추이가 보인다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "3급지" }).click();
  await expect(page.getByText("월간 흐름 (전월대비 증감률)").first()).toBeVisible();
  await expect(page.getByText("최근 주간 추이").first()).toBeVisible();
});
