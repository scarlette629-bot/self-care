import { test, expect, type Page } from "@playwright/test";
async function ready(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator("h1")).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("檢驗分類、腫瘤標記紀錄與自訂項目", async ({ page }) => {
  await ready(page, "/labs");
  for (const group of [
    "血液",
    "血糖",
    "血脂",
    "肝功能",
    "腎功能",
    "甲狀腺",
    "電解質",
    "營養",
    "荷爾蒙",
  ])
    await expect(
      page.getByRole("button", { name: group, exact: true }),
    ).toBeVisible();
  await page.getByRole("button", { name: "🧬 腫瘤標記", exact: true }).click();
  for (const metric of ["AFP", "CEA", "CA 19-9", "CA 125", "CA 15-3", "PSA"])
    await expect(
      page.getByRole("button", { name: `新增${metric}`, exact: true }),
    ).toBeVisible();
  await page.getByRole("button", { name: "新增AFP", exact: true }).click();
  await page.getByLabel("數值（ng/mL）").fill("4.2");
  await page.getByLabel("檢驗機構").fill("範例檢驗室");
  await page.getByRole("button", { name: "儲存紀錄", exact: true }).click();
  await expect(page.getByText("4.2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "新增其他腫瘤標記項目" }).click();
  await expect(page.getByRole("dialog").getByLabel("檢驗分類")).toHaveValue(
    "腫瘤標記",
  );
  await page.getByLabel("指標名稱").fill("自訂標記");
  await page.getByLabel("單位", { exact: true }).fill("U/mL");
  await page.getByRole("button", { name: "建立指標" }).click();
  await expect(
    page.getByRole("button", { name: "新增自訂標記", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "🧬 腫瘤標記", exact: true }).click();
  await expect(page.getByText("4.2", { exact: true })).toBeVisible();
  await noOverflow(page);
});

test("疫苗年度提醒、劑次、女性保健共用資料與備份", async ({ page }, info) => {
  await ready(page, "/preventive");
  await page
    .getByRole("button", { name: "流感疫苗 每年提醒 · 預設 10 月" })
    .click();
  await expect(page.getByLabel("每年提醒月份")).toHaveValue("10");
  await page.getByLabel("疫苗名稱", { exact: true }).fill("流感範例疫苗");
  await page.getByRole("button", { name: "＋ 新增一筆", exact: true }).click();
  const date = await page.getByLabel("施打日期", { exact: true }).inputValue();
  await page.getByRole("button", { name: "儲存保健紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByText(`${date.slice(0, 4)} 年度：已完成`),
  ).toBeVisible();
  await expect(
    page.getByText(`目前提醒日期：${Number(date.slice(0, 4)) + 1}-10-01`),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "帶狀疱疹疫苗 年齡提醒 · 第 1、2 劑紀錄" })
    .click();
  await page.getByLabel("年齡條件提醒（歲，可留白）").fill("50");
  await page.getByLabel("疫苗名稱", { exact: true }).fill("範例帶狀疱疹疫苗");
  await page.getByRole("button", { name: "＋ 新增一筆", exact: true }).click();
  await page.getByLabel("下一劑提醒日期").fill("2027-02-10");
  await page.getByRole("button", { name: "儲存保健紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("已記錄第 1 劑", { exact: true })).toBeVisible();
  const shingles = page
    .locator(".care-card")
    .filter({
      has: page.getByRole("heading", { name: "帶狀疱疹疫苗", exact: true }),
    });
  await shingles.getByRole("button", { name: "新增施打紀錄" }).click();
  await page.getByLabel("🔔 開啟提醒").uncheck();
  await page.getByRole("button", { name: "儲存保健紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("兩劑紀錄完成", { exact: true })).toBeVisible();
  await expect(
    shingles.getByRole("button", { name: "兩劑紀錄已完成" }),
  ).toBeDisabled();
  if (info.project.name === "mobile")
    await page.screenshot({ path: "mobile-vaccines-screen.png" });
  await page
    .getByRole("button", { name: "🌸 女性預防保健", exact: true })
    .click();
  await page
    .getByRole("button", { name: "子宮頸抹片 檢查紀錄 · 結果 · 下次追蹤" })
    .click();
  await page.getByRole("button", { name: "＋ 新增一筆", exact: true }).click();
  await page.getByLabel("檢查院所").fill("範例婦女健康中心");
  await page.getByLabel("檢查結果").fill("已收報告，待回診討論");
  await page.getByLabel("報告摘要 / 備註").fill("共用紀錄測試");
  await page.getByLabel("下次建議 / 追蹤日期").fill("2027-04-10");
  await page.getByLabel("🔔 開啟提醒").check();
  await page.getByRole("button", { name: "儲存保健紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await ready(page, "/women");
  await page.getByRole("button", { name: /06 女性預防保健/ }).click();
  await page
    .getByRole("button", { name: "編輯子宮頸抹片", exact: true })
    .click();
  await expect(page.getByLabel("檢查院所")).toHaveValue("範例婦女健康中心");
  await page.getByLabel("檢查結果").fill("更新後報告結果");
  await page.getByRole("button", { name: "儲存保健紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await ready(page, "/reminders");
  await page.getByRole("link", { name: /子宮頸抹片 · 下次追蹤/ }).click();
  await expect(page.getByLabel("檢查結果")).toHaveValue("更新後報告結果");
  await page.getByRole("button", { name: "關閉", exact: true }).click();
  await ready(page, "/timeline");
  await expect(
    page.getByRole("button", { name: /更新後報告結果/ }),
  ).toBeVisible();
  await ready(page, "/profile");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: /匯出完整 JSON 備份/ }).click();
  const download = await downloading;
  const stream = await download.createReadStream();
  let json = "";
  for await (const chunk of stream!) json += chunk.toString();
  const backup = JSON.parse(json);
  expect(backup.care).toHaveLength(3);
  expect(
    backup.care.find((p: { name: string }) => p.name === "子宮頸抹片").visits[0]
      .result,
  ).toBe("更新後報告結果");
  await page.getByRole("button", { name: /清除所有本機資料/ }).click();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "structured-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(json),
    });
  await expect(
    page.getByRole("dialog", { name: "以備份取代目前資料？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await ready(page, "/preventive");
  await expect(page.getByText("兩劑紀錄完成", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "刪除帶狀疱疹疫苗", exact: true })
    .click();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "編輯帶狀疱疹疫苗", exact: true }),
  ).toHaveCount(0);
});

test("七項女性健康、週期預估、偏頭痛交叉觀察、修改刪除與手機排版", async ({
  page,
}, info) => {
  await ready(page, "/women");
  for (const day of ["2026-07-01", "2026-07-29", "2026-08-26"]) {
    await page.getByRole("button", { name: "新增紀錄", exact: true }).click();
    await page.getByLabel("月經開始", { exact: true }).fill(day + "T08:00");
    await page.getByLabel("經血量").selectOption("中量");
    await page.getByRole("button", { name: "儲存女性健康紀錄" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
  await expect(
    page.getByRole("heading", { name: "下次生理期預估 · 2026-09-23" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /02 經前症候群/ }).click();
  await page.getByRole("button", { name: "新增紀錄", exact: true }).click();
  await page.getByLabel("身體症狀").fill("範例腹脹");
  await page.getByLabel("情緒變化").fill("心情紀錄");
  await page.getByLabel("睡眠狀況").fill("入睡較慢");
  await page
    .getByRole("combobox", { name: "頭痛", exact: true })
    .selectOption("有");
  await page.getByRole("button", { name: "儲存女性健康紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: /03 更年期與停經/ }).click();
  await page.getByRole("button", { name: "新增紀錄", exact: true }).click();
  await page.getByLabel("熱潮紅程度（0–3）").fill("2");
  await page.getByLabel("最後一次月經開始日期").fill("2026-08-26");
  await page.getByLabel("停經狀態（自行記錄）").selectOption("未確認");
  await page.getByRole("button", { name: "儲存女性健康紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: /04 荷爾蒙相關藥物/ }).click();
  await page.getByRole("button", { name: "新增用藥事件" }).click();
  await page.getByLabel("藥物名稱").fill("範例藥物");
  await page.getByLabel("劑量 / 使用方式").fill("範例用量");
  await page.getByLabel("用藥事件").selectOption("劑量調整");
  await page.getByLabel("原藥名 / 原劑量").fill("原範例用量");
  await page.getByRole("button", { name: "儲存女性健康紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: /05 🧠 偏頭痛/ }).click();
  await page.getByRole("button", { name: "新增紀錄", exact: true }).click();
  await page.getByLabel("發作時間").fill("2026-08-26T23:30");
  await page.getByLabel("疼痛程度（0–10）").fill("7");
  await page.getByLabel("持續時間（小時）").fill("2");
  await page.getByLabel("先兆", { exact: true }).fill("個人觀察");
  await page.getByLabel("急性用藥 / 劑量").fill("範例急性用藥");
  await page.getByLabel("預防性用藥 / 劑量").fill("範例預防用藥");
  await page.getByLabel("可能影響因子").fill("睡眠不足，壓力");
  if (info.project.name === "mobile")
    await page.screenshot({ path: "mobile-migraine-form.png" });
  await page.getByRole("button", { name: "儲存女性健康紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: /07 女性健康趨勢/ }).click();
  await expect(
    page.getByText("1 次發作 · 1 個發作起始日。", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".observation-stats b").nth(0)).toHaveText("3");
  await expect(page.locator(".observation-stats b").nth(1)).toHaveText("1");
  await page.getByLabel("比較項目").selectOption("其他影響因子");
  await expect(page.getByText("睡眠不足", { exact: true })).toBeVisible();
  if (info.project.name === "mobile")
    await page.screenshot({ path: "mobile-women-screen.png" });
  await page.reload();
  await page.getByRole("button", { name: /05 🧠 偏頭痛/ }).click();
  await expect(page.getByText("範例急性用藥", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "編輯偏頭痛紀錄" }).click();
  await page.getByLabel("疼痛程度（0–10）").fill("6");
  await page.getByRole("button", { name: "儲存女性健康紀錄" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".journal-details dd").first()).toHaveText("6");
  await page.getByRole("button", { name: "刪除偏頭痛紀錄" }).click();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "尚無偏頭痛紀錄" }),
  ).toBeVisible();
  if (info.project.name === "mobile") {
    await ready(page, "/profile");
    await page.getByLabel("文字大小").selectOption("1.3");
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of ["/women", "/preventive", "/labs"]) {
        await ready(page, route);
        await noOverflow(page);
      }
    }
  }
});
