import Dexie, { type Table } from "dexie";
import { backupSchema, type Backup } from "../lib/model";
class DemoDB extends Dexie {
  snapshots!: Table<{ id: string; data: Backup }, string>;
  constructor() {
    super("self-care-demo-v1");
    this.version(1).stores({ snapshots: "id" });
  }
}
const db = new DemoDB();
export const repository = {
  async load() {
    const row = await db.snapshots.get("demo");
    return row ? backupSchema.parse(row.data) : undefined;
  },
  async save(data: Backup) {
    backupSchema.parse(data);
    await db.snapshots.put({ id: "demo", data });
  },
};
export function emptyData(): Backup {
  return {
    version: 1,
    barthel: [],
    urine: [],
    care: [],
    women: [],
    records: [],
    events: [],
    reminders: [],
    custom: [],
    settings: {
      nickname: "朋友",
      birthdate: "",
      dark: false,
      font: 1,
      hidden: [],
      timezone: "Asia/Taipei",
    },
  };
}
export function demoData(): Backup {
  const b = emptyData();
  const date = (days: number, hour = 8) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const add = (
    metricId: string,
    value: number,
    days: number,
    secondary?: number,
  ) =>
    b.records.push({
      id: crypto.randomUUID(),
      metricId,
      value,
      secondary,
      at: date(days),
      context: "範例測量",
      note: "示範數據，非真實健康紀錄",
      institution: "示範健康中心",
      source: "demo-local",
    });
  for (let i = 6; i >= 0; i--) {
    add(
      "bp",
      [122, 119, 124, 118, 120, 116, 118][6 - i],
      i,
      [80, 78, 82, 76, 79, 74, 76][6 - i],
    );
    add("weight", Math.round((62.5 + i * 0.08) * 10) / 10, i);
    add("glucose", [99, 97, 102, 98, 94, 100, 96][6 - i], i);
    add("sleep", [7.2, 6.8, 7.5, 7, 6.5, 7.8, 7.4][6 - i], i);
  }
  for (const [days, tc, tg, ldl, hdl] of [
    [270, 208, 134, 138, 67],
    [180, 182, 96, 111, 55],
    [90, 198, 112, 135, 51],
    [3, 219, 139, 143, 55],
  ]) {
    add("tc", tc, days);
    add("tg", tg, days);
    add("ldl", ldl, days);
    add("hdl", hdl, days);
  }
  add("hba1c", 5.4, 3);
  add("alt", 24, 3);
  add("egfr", 95, 3);
  b.reminders = [
    {
      id: crypto.randomUUID(),
      name: "記錄晚間血壓",
      category: "健康量測",
      at: date(0, 20),
      done: false,
      note: "使用者自訂範例提醒",
    },
    {
      id: crypto.randomUUID(),
      name: "牙科定期檢查",
      category: "預防保健",
      at: date(-5, 10),
      done: false,
      note: "示範安排，請依個人需求設定",
    },
  ];
  return b;
}
