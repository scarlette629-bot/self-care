import {it,expect} from 'vitest';
import {referenceDefaults} from '../src/lib/referenceDefaults';
import type {HealthRecord} from '../src/lib/model';
const base:HealthRecord={id:'a',metricId:'tc',value:200,at:'2026-10-10T00:00:00Z',context:'',note:'',institution:'',source:'demo-local',low:0,high:200};
it('選同指標最新日期而非陣列位置，保留零值',()=>{
 expect(referenceDefaults('tc',[{...base,at:'2026-10-11T00:00:00Z',high:220},{...base,metricId:'alt',high:40},base])).toEqual({low:0,high:220});
});
it('不從較舊紀錄補回已清空的上下限',()=>expect(referenceDefaults('tc',[base,{...base,at:'2026-10-11T00:00:00Z',low:undefined,high:undefined}])).toEqual({low:undefined,high:undefined}));
it('編輯保留該筆原值，無歷史保持空白，不變更輸入資料',()=>{
 const before=JSON.stringify(base);
 expect(referenceDefaults('tc',[base],{...base,low:undefined,high:150})).toEqual({low:undefined,high:150});
 expect(referenceDefaults('alt',[base])).toEqual({low:undefined,high:undefined});
 expect(JSON.stringify(base)).toBe(before);
});
