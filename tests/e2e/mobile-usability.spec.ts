import { demoData } from "../../src/data/repository";
import { test, expect } from "@playwright/test";
test("手機快速記錄、抽屜表單與大字模式", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "手機互動檢查");
  await page.goto("/");
  await page.getByRole("button", { name: "快速記錄體重" }).click();
  const sheet = page.getByRole("dialog", { name: "新增體重紀錄" });
  await expect(sheet).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    "hidden",
  );
  await page.getByRole("spinbutton", { name: "數值（kg）" }).fill("63.2");
  await page.getByRole("button", { name: "儲存紀錄" }).click();
  await expect(sheet).not.toBeVisible();
  await expect(page.getByText("63.2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "新增紀錄", exact: true }).click();
  await page.getByRole("textbox", { name: "搜尋要記錄的指標" }).fill("血糖");
  await page.getByRole("button", { name: "記錄血糖", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "新增血糖紀錄" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "關閉", exact: true }).click();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  await page
    .locator(".mobile-module-shortcuts")
    .getByRole("link", { name: "檢驗數據", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("🧪 檢驗與檢查");
  await page.getByRole("button", { name: "新增紀錄", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "想記錄哪一項？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "關閉", exact: true }).click();
  await page
    .getByRole("navigation", { name: "手機主要導覽" })
    .getByRole("link", { name: "我的", exact: true })
    .click();
  await page.getByRole("combobox", { name: "文字大小" }).selectOption("1.3");
  await expect(page.locator("html")).toHaveCSS("font-size", "20.8px");
  await page
    .getByRole("navigation", { name: "手機主要導覽" })
    .getByRole("link", { name: "趨勢", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("健康趨勢");
  for (const [label, days] of [["2 年", 730], ["3 年", 1095]] as const) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByRole("button", { name: label, exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(`最近 ${days} 天`, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "血糖", exact: true }).click();
  await expect(page.locator('select[aria-label="趨勢指標"]')).toHaveValue(
    "glucose",
  );
  await page.getByRole("button", { name: "更多指標與日期" }).click();
  await page.getByRole("combobox", { name: "更多趨勢期間" }).selectOption("0");
  await expect(page.getByLabel("開始日期")).toBeVisible();
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("手機觸控尺寸、單欄卡片與主要畫面預覽", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "手機排版檢查");
  await page.goto("/");
  await page.goto("/profile");
  await page.locator("input.file-input").setInputFiles({name:"fixture.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(demoData()))});
  await page.getByRole("button", { name: "確認", exact:true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/");
  for (const name of ["快速記錄血壓", "新增血壓"]) {
    const box = await page
      .getByRole("button", { name, exact: true })
      .boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  const boxes = await page
    .locator(".dashboard-primary .metric-card")
    .evaluateAll((nodes) =>
      nodes.map((n) => ({
        left: n.getBoundingClientRect().left,
        top: n.getBoundingClientRect().top,
      })),
    );
  expect(boxes[0].left).toBe(boxes[1].left);
  expect(boxes[1].top).toBeGreaterThan(boxes[0].top);
  await page.screenshot({ path: "mobile-home-screen.png" });
  await page.getByRole("button", { name: "快速記錄血壓" }).click();
  await page.getByRole("spinbutton", { name: "收縮壓（mmHg）" }).fill("118");
  await page.getByRole("spinbutton", { name: "舒張壓（mmHg）" }).fill("76");
  await page.screenshot({ path: "mobile-entry-screen.png" });
  await page.getByRole("button", { name: "關閉", exact: true }).click();
  await page
    .getByRole("navigation", { name: "手機主要導覽" })
    .getByRole("link", { name: "趨勢", exact: true })
    .click();
  await page.getByRole("button", { name: "血脂", exact: true }).click();
  await page.getByRole("button", { name: "1 年", exact: true }).click();
  for (const button of ["7 天", "30 天", "90 天", "1 年"]) {
    const box = await page
      .getByRole("button", { name: button, exact: true })
      .boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: "mobile-trends-screen.png" });
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/", "/data", "/trends", "/reminders", "/profile"]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});
