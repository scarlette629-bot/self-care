import { test, expect, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { emptyData } from "../../src/data/repository";
import { metrics } from "../../src/data/metrics";
async function homeChoice(page: Page, name: string, checked: boolean) {
  const checkbox = page.getByRole("checkbox", { name, exact: true });
  await checkbox.setChecked(checked);
  await expect(checkbox).toBeEnabled();
  if (checked) await expect(checkbox).toBeChecked();
  else await expect(checkbox).not.toBeChecked();
}
async function snapshot(page: Page) {
  return page.evaluate(
    async () =>
      new Promise<ReturnType<typeof emptyData>>((resolve, reject) => {
        const open = indexedDB.open("self-care-demo-v1");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const req = db
            .transaction("snapshots")
            .objectStore("snapshots")
            .get("demo");
          req.onsuccess = () => {
            resolve(req.result.data);
            db.close();
          };
          req.onerror = () => {
            reject(req.error);
            db.close();
          };
        };
      }),
  );
}
async function seed(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "朋友，今天也好好照顧自己。" }),
  ).toBeVisible();
  const b = emptyData();
  b.custom = [
    {
      ...metrics.find((m) => m.id === "steps")!,
      id: "custom-count",
      name: "自訂活動次數",
      unit: "次",
      custom: true,
    },
  ];
  const at = new Date().toISOString();
  b.records = [
    {
      id: "11000000-0000-4000-8000-000000000001",
      metricId: "weight",
      value: 62,
      at,
      context: "",
      note: "保留原始資料",
      institution: "",
      source: "demo-local",
    },
    {
      id: "11000000-0000-4000-8000-000000000002",
      metricId: "ldl",
      value: 155,
      high: 130,
      at,
      context: "",
      note: "當次上限",
      institution: "測試機構",
      source: "demo-local",
    },
    {
      id: "11000000-0000-4000-8000-000000000003",
      metricId: "ldl",
      value: 80,
      high: 130,
      at: "2020-01-01T08:00:00+08:00",
      context: "",
      note: "舊報告",
      institution: "",
      source: "demo-local",
    },
    {
      id: "11000000-0000-4000-8000-000000000004",
      metricId: "hdl",
      value: 30,
      low: 40,
      at,
      context: "",
      note: "",
      institution: "",
      source: "demo-local",
    },
    {
      id: "11000000-0000-4000-8000-000000000005",
      metricId: "alt",
      value: 24,
      at,
      context: "",
      note: "沒有參考區間",
      institution: "",
      source: "demo-local",
    },
    {
      id: "11000000-0000-4000-8000-000000000006",
      metricId: "custom-count",
      value: 8,
      at,
      context: "",
      note: "",
      institution: "",
      source: "demo-local",
    },
  ];
  await page.evaluate(
    async (data) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("self-care-demo-v1");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction("snapshots", "readwrite");
          tx.objectStore("snapshots").put({ id: "demo", data });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
    b,
  );
  await page.reload();
  return b;
}
test("多選日常、自訂與檢驗首頁卡片；移除只改設定且重新開啟保留", async ({
  page,
}) => {
  const original = await seed(page);
  await page.goto("/data");
  await homeChoice(page, "步數加入首頁", true);
  await homeChoice(page, "自訂活動次數加入首頁", true);
  await page.goto("/labs?metric=ldl");
  const ldlName = metrics.find((m) => m.id === "ldl")!.name;
  await homeChoice(page, `${ldlName}加入首頁`, true);
  await page.goto("/");
  await expect(page.locator(".metrics-grid .metric-card")).toHaveCount(7);
  // Scope by visible name to avoid the independent abnormal summary.
  const labCard = page
    .locator(".metrics-grid .metric-card")
    .filter({ hasText: ldlName });
  await expect(labCard).toContainText("155");
  await expect(labCard).toContainText("mg/dL");
  await expect(labCard.locator('[data-status="high"]')).toBeVisible();
  await labCard.locator(".metric-reading").click();
  await expect(page).toHaveURL(/labs\?metric=ldl/);
  await expect(page.locator(".records-list .record-row")).toHaveCount(2);
  await homeChoice(page, `${ldlName}加入首頁`, false);
  await page.goto("/");
  await expect(page.locator(".metrics-grid .metric-card")).toHaveCount(6);
  await page.reload();
  await expect(page.locator(".metrics-grid .metric-card")).toHaveCount(6);
  const after = await snapshot(page);
  expect(after.records).toEqual(original.records);
  expect(after.custom).toEqual(original.custom);
  expect(after.settings.homeMetricIds).toContain("custom-count");
  expect(after.settings.homeMetricIds).not.toContain("ldl");
  await mkdir("../qa-screenshots", { recursive: true });
  await page.screenshot({
    path: `../qa-screenshots/dashboard-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("首頁趨勢選項、期間持久保存與三處檢驗狀態一致", async ({ page }) => {
  await seed(page);
  const summary = page.getByRole("region", { name: "檢驗異常摘要" });
  await expect(summary.locator('[data-status="high"]')).toHaveCount(1);
  await expect(summary.locator('[data-status="low"]')).toHaveCount(1);
  await expect(summary.locator('[data-status="critical"]')).toHaveCount(0);
  await page.getByLabel("首頁趨勢指標").selectOption("ldl");
  await page
    .locator(".trend-panel")
    .getByRole("button", { name: "全部", exact: true })
    .click();
  await expect(
    page
      .locator(".trend-panel")
      .getByRole("button", { name: "全部", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .locator(".trend-panel")
      .getByRole("button", { name: "全部", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel("首頁趨勢指標")).toHaveValue("ldl");
  await expect(
    page
      .locator(".trend-panel")
      .getByRole("button", { name: "全部", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator('.trend-panel .recharts-line-dots circle[fill="#a85108"]'),
  ).toHaveCount(1);
  await expect(summary.locator('[data-status="high"]')).toHaveCSS(
    "color",
    "rgb(168, 81, 8)",
  );
  await expect(summary.locator('[data-status="low"]')).toHaveCSS(
    "color",
    "rgb(36, 104, 181)",
  );
  await page.locator(".trend-panel summary").click();
  await expect(
    page.locator('.lab-chart-results [data-status="high"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('.lab-chart-results [data-status="normal"]'),
  ).toHaveCount(1);
  for (const range of ["7 天", "30 天", "90 天", "1 年"]) {
    await page
      .locator(".trend-panel")
      .getByRole("button", { name: range, exact: true })
      .click();
    await expect(page.locator(".trend-panel .chart-name")).toContainText(
      "共 1 筆紀錄",
    );
  }
  await page.getByLabel("首頁趨勢指標").selectOption("hba1c");
  await expect(page.getByText("尚無健康紀錄", { exact: true })).toBeVisible();
  await page.getByLabel("首頁趨勢指標").selectOption("custom-count");
  await expect(page.locator(".trend-panel .chart-name")).toContainText(
    "共 1 筆紀錄",
  );
  await page.goto("/labs?metric=ldl");
  await page.getByRole("button", { name: "歷史列表" }).click();
  await expect(page.locator('.records-list [data-status="high"]')).toHaveCount(
    1,
  );
  await expect(
    page.locator('.records-list [data-status="normal"]'),
  ).toHaveCount(1);
  await page.goto("/labs?metric=alt");
  await expect(
    page.locator('.metric-card [data-status="unknown"]'),
  ).toHaveCount(1);
});
test("新增首頁設定後 CSV 匯出再匯入保留數值、區間與識別碼", async ({
  page,
}) => {
  const original = await seed(page);
  await page.goto("/labs?metric=ldl");
  await page
    .getByRole("checkbox", {
      name: `${metrics.find((m) => m.id === "ldl")!.name}加入首頁`,
      exact: true,
    })
    .check();
  await expect(
    page.getByRole("checkbox", {
      name: `${metrics.find((m) => m.id === "ldl")!.name}加入首頁`,
      exact: true,
    }),
  ).toBeEnabled();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV 匯出", exact: true }).click();
  const bytes = await readFile((await (await downloading).path())!);
  expect(bytes.toString()).toContain("155");
  expect(bytes.toString()).toContain("130");
  await page.getByRole("button", { name: "CSV 匯入", exact: true }).click();
  await page.getByLabel("選擇 CSV 檔案").setInputFiles({
    name: "roundtrip.csv",
    mimeType: "text/csv",
    buffer: bytes,
  });
  await expect(page.getByRole("status")).toContainText("重複略過 2 筆");
  await expect(
    page.getByRole("button", { name: "確認匯入", exact: true }),
  ).toBeDisabled();
  expect((await snapshot(page)).records).toEqual(original.records);
});

test("建立自訂指標可加入首頁，清空首頁選項保留所有紀錄", async ({ page }) => {
  const original = await seed(page);
  await page.goto("/data");
  await page
    .getByRole("button", { name: "新增自訂健康指標", exact: true })
    .click();
  await page.getByLabel("指標名稱").fill("伸展分鐘");
  await page.getByLabel("單位", { exact: true }).fill("分鐘");
  await page.getByRole("button", { name: "建立指標", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("checkbox", { name: "伸展分鐘加入首頁", exact: true })
    .check();
  await expect(
    page.getByRole("checkbox", { name: "伸展分鐘加入首頁", exact: true }),
  ).toBeEnabled();
  await page.goto("/");
  await expect(
    page.locator(".metrics-grid .metric-card").filter({ hasText: "伸展分鐘" }),
  ).toContainText("尚無紀錄");
  await page.goto("/profile");
  for (const m of ["血壓", "心率", "血糖", "體重", "伸展分鐘"]) {
    const toggle = page.getByRole("checkbox", {
      name: m + "加入首頁",
      exact: true,
    });
    await toggle.uncheck();
    await expect(toggle).not.toBeChecked();
    await expect(toggle).toBeEnabled();
  }
  await page.goto("/");
  await page.reload();
  await expect(
    page.getByText("尚未選擇首頁指標", { exact: true }),
  ).toBeVisible();
  expect((await snapshot(page)).records).toEqual(original.records);
  await expect(
    page
      .getByLabel("首頁趨勢指標")
      .locator("option")
      .filter({ hasText: "伸展分鐘" }),
  ).toHaveCount(1);
});
