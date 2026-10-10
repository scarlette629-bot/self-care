import { test, expect } from "@playwright/test";
test("新增、編輯、重新整理、趨勢、時間軸與刪除保持一致", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "朋友，今天也好好照顧自己。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "新增紀錄", exact: true }).click();
  await page.getByRole("button", { name: "記錄血壓", exact: true }).click();
  await page
    .getByRole("textbox", { name: "測量日期與時間" })
    .fill("2026-10-10T08:00");
  await page.getByRole("spinbutton", { name: "收縮壓（mmHg）" }).fill("118");
  await page.getByRole("spinbutton", { name: "舒張壓（mmHg）" }).fill("76");
  await page.getByRole("button", { name: "儲存紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(page.getByText("118 / 76", { exact: true })).toBeVisible();
  await page.goto("/data");
  await page.getByRole("button", { name: "歷史列表" }).click();
  await page.getByRole("button", { name: "編輯血壓紀錄" }).click();
  await page.getByRole("spinbutton", { name: "收縮壓（mmHg）" }).fill("120");
  await page.getByRole("button", { name: "儲存紀錄" }).click();
  await expect(
    page.getByText("120 / 76", { exact: false }).first(),
  ).toBeVisible();
  await page.goto("/trends");
  await page.getByRole("button", { name: "資料", exact: true }).click();
  await expect(page.getByRole("cell", { name: "120 / 76 mmHg" })).toBeVisible();
  await page.goto("/timeline");
  await expect(page.getByText("血壓 120 / 76 mmHg")).toBeVisible();
  await page.goto("/data");
  await page.getByRole("button", { name: "歷史列表" }).click();
  await page.getByRole("button", { name: "刪除血壓紀錄" }).click();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await expect(page.getByRole("heading", { name: "還沒有紀錄" })).toBeVisible();
  await page.goto("/timeline");
  await expect(
    page.getByRole("heading", { name: "時間軸還是空白的" }),
  ).toBeVisible();
});
test("提醒完成狀態與設定持久保存，行動版無水平溢位", async ({ page }) => {
  await page.goto("/reminders");
  await page.getByRole("button", { name: "新增提醒", exact: true }).click();
  await page.getByRole("textbox", { name: "提醒名稱" }).fill("健康檢查測試");
  await page.getByRole("button", { name: "儲存提醒" }).click();
  await page.getByRole("button", { name: "完成健康檢查測試" }).click();
  await page.getByRole("button", { name: "已完成", exact: true }).click();
  await expect(page.getByText("健康檢查測試", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "已完成", exact: true }).click();
  await expect(page.getByText("健康檢查測試", { exact: true })).toBeVisible();
  await page.goto("/profile");
  await page.getByRole("textbox", { name: "如何稱呼你" }).fill("小安");
  await page.getByRole("button", { name: "儲存個人資料" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "個人設定已儲存在此瀏覽器。",
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "小安，今天也好好照顧自己。" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("PWA manifest、service worker 與離線新增", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).display).toBe("standalone");
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText("目前離線 · 仍可操作本機紀錄，沒有雲端同步"),
  ).toBeVisible();
  await page.getByRole("button", { name: "新增紀錄", exact: true }).click();
  await page.getByRole("button", { name: "記錄血壓", exact: true }).click();
  await page.getByRole("spinbutton", { name: "收縮壓（mmHg）" }).fill("110");
  await page.getByRole("spinbutton", { name: "舒張壓（mmHg）" }).fill("70");
  await page.getByRole("button", { name: "儲存紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(page.getByText("110 / 70", { exact: true })).toBeVisible();
  await context.setOffline(false);
});
test("範例載入、血脂比較與響應式預覽", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "載入範例資料" }).click();
  await page.getByRole("button", { name: "加入範例資料" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("118 / 76", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `preview-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.goto("/trends");
  if (testInfo.project.name === "mobile")
    await page.getByRole("button", { name: "血脂", exact: true }).click();
  else
    await page
      .getByRole("combobox", { name: "趨勢指標" })
      .selectOption("lipids");
  await page.getByRole("button", { name: "1 年", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /總膽固醇、三酸甘油酯、LDL-C、HDL-C趨勢/ }),
  ).toBeVisible();
  await page.screenshot({
    path: `preview-trends-${testInfo.project.name}.png`,
    fullPage: true,
  });
  for (const route of [
    "/",
    "/labs",
    "/trends",
    "/women",
    "/aging",
    "/profile",
    "/timeline",
    "/reminders",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("檢驗參考區間驗證、CSV 匯出與備份匯入驗證", async ({ page }) => {
  await page.goto("/labs?metric=hba1c");
  await page.getByRole("button", { name: "新增紀錄", exact: true }).click();
  await page.getByRole("spinbutton", { name: "數值（%）" }).fill("5.4");
  await page.getByRole("spinbutton", { name: "報告參考下限" }).fill("10");
  await page.getByRole("spinbutton", { name: "報告參考上限" }).fill("5");
  await page.getByRole("button", { name: "儲存紀錄" }).click();
  await expect(page.getByRole("alert").last()).toContainText("參考區間");
  await page.getByRole("spinbutton", { name: "報告參考下限" }).fill("3");
  await page.getByRole("button", { name: "儲存紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "歷史列表" }).click();
  await expect(
    page.getByText("超出本次報告參考區間", { exact: true }),
  ).toBeVisible();
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV 匯出" }).click();
  expect((await csv).suggestedFilename()).toContain(".csv");
  await page.goto("/profile");
  const saved = page.waitForEvent("download");
  await page.getByRole("button", { name: /匯出完整 JSON 備份/ }).click();
  const path = await (await saved).path();
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":999}'),
  });
  await expect(page.getByRole("status")).toContainText("備份格式錯誤");
  await page.locator("input[type=file]").setInputFiles(path!);
  await expect(
    page.getByRole("heading", { name: "以備份取代目前資料？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await page.getByRole("button", { name: "切換深色模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
