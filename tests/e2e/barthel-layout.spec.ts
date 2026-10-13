import { APP_VERSION } from "../../src/lib/version";
import { test, expect } from "@playwright/test";
test("版本與巴氏選項三欄實際對齊", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("軟體版本")).toContainText(APP_VERSION);
  await page.goto("/aging?kind=日常生活功能");
  await page.getByRole("button", { name: "＋ 新增評估" }).click();
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const row = page.locator(".score-option").first();
    await row.scrollIntoViewIfNeeded();
    const radio = await row.getByRole("radio").boundingBox();
    const points = await row.locator(".score-points").boundingBox();
    const description = await row.locator(".score-description").boundingBox();
    expect(radio!.height).toBe(21);
    expect(Math.abs(radio!.y - points!.y)).toBeLessThanOrEqual(3);
    expect(description!.y).toBe(points!.y);
    expect(points!.x).toBeGreaterThan(radio!.x + radio!.width);
    expect(description!.x).toBeGreaterThan(points!.x + points!.width);
    expect(
      await page
        .getByRole("dialog")
        .evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".barthel-question").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: "mobile-barthel-inline.png" });
});
