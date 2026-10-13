import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
test("v0.5 → v0.6 PWA 更新保留舊資料、新設定與離線再次開啟", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.DASHBOARD_OLD_DIR || !process.env.DASHBOARD_NEW_DIR,
    "需要指定 v0.5 與 v0.6 repository-base 建置目錄",
  );
  let root = resolve(process.env.DASHBOARD_OLD_DIR!);
  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url!, "http://localhost").pathname.replace(
        /^\/self-care\//,
        "",
      );
      const file = resolve(root, path || "index.html");
      if (!file.startsWith(root + "/")) {
        res.writeHead(403);
        res.end();
        return;
      }
      const types: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".webmanifest": "application/manifest+json",
      };
      const bytes = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(bytes);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((r) => server.listen(4191, "127.0.0.1", r));
  const snapshot = () =>
    page.evaluate(
      async () =>
        new Promise<string>((resolve, reject) => {
          const req = indexedDB.open("self-care-demo-v1");
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            const db = req.result;
            const get = db
              .transaction("snapshots")
              .objectStore("snapshots")
              .get("demo");
            get.onsuccess = () => {
              resolve(JSON.stringify(get.result));
              db.close();
            };
            get.onerror = () => {
              reject(get.error);
              db.close();
            };
          };
        }),
    );
  try {
    await page.goto("http://127.0.0.1:4191/self-care/");
    await expect(page.getByLabel("軟體版本")).toContainText("v.0.5");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect
      .poll(() =>
        page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      )
      .toBe(true);
    await page.goto("http://127.0.0.1:4191/self-care/#/data?metric=weight");
    await page.getByRole("button", { name: "新增體重", exact: true }).click();
    await page.getByRole("spinbutton", { name: "數值（kg）" }).fill("63");
    await page.getByRole("button", { name: "儲存紀錄", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    const before = await snapshot();
    root = resolve(process.env.DASHBOARD_NEW_DIR!);
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      await r!.update();
    });
    await page
      .getByRole("button", { name: "更新 App", exact: true })
      .click({ timeout: 20000 });
    await expect(page.getByLabel("軟體版本")).toContainText("v.0.6", {
      timeout: 20000,
    });
    expect(await snapshot()).toBe(before);
    await page.goto("http://127.0.0.1:4191/self-care/#/data");
    await page
      .getByRole("checkbox", { name: "步數加入首頁", exact: true })
      .check();
    await expect(
      page.getByRole("checkbox", { name: "步數加入首頁", exact: true }),
    ).toBeEnabled();
    await page.goto("http://127.0.0.1:4191/self-care/#/");
    await page.getByLabel("首頁趨勢指標").selectOption("weight");
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
    const after = await snapshot();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByLabel("首頁趨勢指標")).toHaveValue("weight");
    await expect(
      page.locator(".metrics-grid .metric-card").filter({ hasText: "體重" }),
    ).toContainText("63");
    await expect(
      page.locator(".metrics-grid .metric-card").filter({ hasText: "步數" }),
    ).toBeVisible();
    expect(await snapshot()).toBe(after);
  } finally {
    await context.setOffline(false);
    await new Promise<void>((r) => server.close(() => r()));
  }
});
