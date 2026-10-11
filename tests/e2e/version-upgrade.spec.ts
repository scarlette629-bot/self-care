import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
test('v0.1 更新為 v0.2 後原有資料完整保留',async({page})=>{
 test.skip(!process.env.UPGRADE_OLD_DIR,'需提供舊版 Release 建置路徑');
 let root=process.env.UPGRADE_OLD_DIR!;
 const server=createServer(async(req,res)=>{
  try{
   const pathname=new URL(req.url!,'http://localhost').pathname.replace(/^\/self-care\//,'');
   const file=resolve(root,pathname||'index.html');
   if(!file.startsWith(resolve(root)+'/')) {res.writeHead(403);res.end();return;}
   const data=await readFile(file);
   const types:Record<string,string>={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
   res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise<void>(r=>server.listen(4189,'127.0.0.1',r));
 try{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4189/self-care/');
  await expect(page.getByLabel('軟體版本')).toContainText('v.0.1');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready});
  await page.reload();
  await page.getByRole('button',{name:'快速記錄血壓',exact:true}).click();
  await page.getByRole('spinbutton',{name:'收縮壓（mmHg）'}).fill('123');
  await page.getByRole('spinbutton',{name:'舒張壓（mmHg）'}).fill('78');
  await page.getByRole('button',{name:'儲存紀錄'}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const snapshot=()=>page.evaluate(async()=>new Promise<string>((resolve,reject)=>{
   const req=indexedDB.open('self-care-demo-v1');req.onerror=()=>reject(req.error);req.onsuccess=()=>{
    const db=req.result;const get=db.transaction('snapshots').objectStore('snapshots').get('demo');
    get.onsuccess=()=>{resolve(JSON.stringify(get.result));db.close()};get.onerror=()=>reject(get.error);
   };
  }));
  const before=await snapshot();
  root=resolve('dist-upgrade');
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r!.update()});
  await page.getByRole('button',{name:'更新 App',exact:true}).click({timeout:20000});
  await expect(page.getByLabel('軟體版本')).toContainText('v.0.2',{timeout:20000});
  await expect(page.getByRole('button',{name:'檢查 App 更新'})).toBeVisible();
  await expect(page.locator('.demo-banner')).toHaveCount(0);
  await expect(page.getByText('123 / 78',{exact:true})).toBeVisible();
  expect(await snapshot()).toBe(before);
  await page.screenshot({path:'mobile-v0.2-verified.png'});
 }finally{await new Promise<void>(r=>server.close(()=>r()));}
});
