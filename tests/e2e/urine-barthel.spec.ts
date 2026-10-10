import { test, expect } from "@playwright/test";
test("尿液三類文字報告可保存、修改與刪除", async ({ page }, info) => {
  await page.goto("/labs");
  await page.getByRole("button", { name: "尿液檢查", exact: true }).click();
  await page.getByRole("button", { name: "＋ 新增尿液報告" }).click();
  await expect(page.locator(".urine-fields")).toHaveCount(3);
  await page.getByLabel("顏色 (Color)", { exact: true }).fill("淡黃色");
  await page
    .getByLabel("比重 (Specific Gravity)", { exact: true })
    .fill("1.020");
  await page.getByLabel("蛋白質 (Protein)", { exact: true }).fill("Trace");
  await page.getByLabel("紅血球 (RBC)", { exact: true }).fill("0-2 /HPF");
  await page
    .getByLabel("細菌 / 黴菌 (Bacteria/Yeast)", { exact: true })
    .fill("少量");
  await page.getByRole("button", { name: "儲存尿液報告" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(page.getByText("1.020", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "編輯尿液報告" }).click();
  await page.getByLabel("蛋白質 (Protein)", { exact: true }).fill("陰性");
  await page.getByRole("button", { name: "儲存尿液報告" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("陰性", { exact: true })).toBeVisible();
  if (info.project.name === "mobile")
    await page.screenshot({ path: "mobile-urine-screen.png" });
  await page.goto("/timeline");
  await expect(
    page.getByRole("button", { name: /尿液檢查報告/ }),
  ).toBeVisible();
  await page.goto("/labs?group=尿液檢查");
  await page.getByRole("button", { name: "刪除尿液報告" }).click();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "尚無尿液檢查報告" }),
  ).toBeVisible();
});
test("暫停入口、巴氏點選計分、未填保護、持久保存與時間軸", async ({
  page,
}, info) => {
  await page.goto("/aging");
  for (const name of ["營養", "肌力與身體功能", "有氧活動"])
    await expect(
      page.getByRole("button", { name: new RegExp(name), exact: true }),
    ).toHaveCount(0);
  await page.getByRole("button", { name: "日常生活功能", exact: true }).click();
  await page.getByRole("button", { name: "＋ 新增評估" }).click();
  await expect(
    page.getByRole("button", { name: "儲存評估", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("對象描述（選填）").fill("術後休養範例");
  const questions = page.locator(".barthel-question");
  await expect(questions).toHaveCount(10);
  for (let i = 0; i < 10; i++)
    await questions.nth(i).getByRole("radio").first().check();
  await expect(page.locator("output")).toHaveText("總分 100 / 100 分");
  await questions.nth(8).getByRole("radio").nth(2).check();
  await expect(page.locator("output")).toHaveText("總分 90 / 100 分");
  if (info.project.name === "mobile")
    await page.screenshot({ path: "mobile-barthel-form.png" });
  await page.getByRole("button", { name: "儲存評估", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "日常生活功能", exact: true }).click();
  await expect(page.getByText("90 / 100 分", { exact: true })).toBeVisible();
  await page.goto("/timeline");
  await expect(page.getByRole("button", { name: /巴氏量表 90/ })).toBeVisible();
  await page.goto("/aging?kind=日常生活功能");
  await page.getByRole("button", { name: "編輯評估", exact: true }).click();
  await page
    .locator(".barthel-question")
    .nth(8)
    .getByRole("radio")
    .first()
    .check();
  await page.getByRole("button", { name: "儲存評估", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("100 / 100 分", { exact: true })).toBeVisible();
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "刪除評估" }).click();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "尚無巴氏量表評估" }),
  ).toBeVisible();
});
