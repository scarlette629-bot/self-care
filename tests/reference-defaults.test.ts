import {recordSchema,reportStatus} from '../src/lib/model';
import {previewCSV} from '../src/lib/csv';
import {metrics} from '../src/data/metrics';
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
it('單側參考限與等於門檻判定，備份保留邊界',()=>{
 const r={...base,id:'a65578fe-e6ad-4ac6-a580-01c2f5887879',low:undefined,high:200,highExclusive:true};
 expect(reportStatus(recordSchema.parse(r))).toBe('超出本次報告參考區間');
 expect(reportStatus({...r,value:199})).toBe('—');
 expect(reportStatus({...r,highExclusive:undefined})).toBe('—');
 expect(reportStatus({...r,metricId:'hdl',low:50,high:undefined,value:50})).toBe('—');
 const p=previewCSV('指標,數值,單位,日期時間,參考上限,上限不含等於,資料來源\ntc,200,mg/dL,2026-10-10,200,true,demo-local','measurements',metrics,[],[]);
 expect(p.errors).toEqual([]);expect(p.records[0].highExclusive).toBe(true);
 expect(referenceDefaults('tc',[r]).highExclusive).toBe(true);
});
