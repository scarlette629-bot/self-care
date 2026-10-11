import {test,expect} from '@playwright/test';
test('手機更新檢查與離線提示，首頁移除 Demo 區塊',async({page,context})=>{
 await page.setViewportSize({width:360,height:800});
 await page.goto('/');
 await expect(page.locator('.demo-banner')).toHaveCount(0);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 await page.getByRole('button',{name:'檢查 App 更新'}).click();
 await expect(page.getByRole('status')).toContainText('目前已是最新版',{timeout:25000});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await context.setOffline(true);
 await page.getByRole('button',{name:'檢查 App 更新'}).click();
 await expect(page.getByRole('status')).toContainText('請連上網路');
 await context.setOffline(false);
});
