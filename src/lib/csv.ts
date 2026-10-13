import { z } from "zod";
import { recordSchema, type HealthRecord, type Metric } from "./model";
import { urineSchema, urineSections, type UrineReport } from "./urine";

// RFC-style quoted fields, embedded newlines, CRLF and UTF-8 BOM.
export function parseCSV(text: string): string[][] {
  if (new TextEncoder().encode(text).length > 5 * 1024 * 1024)
    throw new Error("CSV 不可超過 5 MB");
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    closed = false;
  const src = text.replace(/^\uFEFF/, "");
  const cell = () => {
    row.push(field);
    field = "";
    closed = false;
    if (row.length > 100) throw new Error("欄位不可超過 100 個");
  };
  const line = () => {
    cell();
    if (row.some((v) => v.trim())) rows.push(row);
    row = [];
    if (rows.length > 10001) throw new Error("每次最多匯入 10,000 筆");
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += ch;
      continue;
    }
    if (ch === ",") {
      cell();
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      line();
      continue;
    }
    if (closed) throw new Error("引號結束後只能接逗號或換行");
    if (ch === '"') {
      if (field) throw new Error("欄位中的引號必須使用雙引號跳脫");
      quoted = true;
    } else field += ch;
  }
  if (quoted) throw new Error("CSV 引號未結束");
  if (field || closed || row.length) line();
  if (rows.length < 2) throw new Error("CSV 需包含欄位標題及至少一筆資料");
  return rows;
}
function dateValue(value: string) {
  const raw = value.trim();
  const local = raw.replace(" ", "T");
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(local)
    ? local + "T00:00:00+08:00"
    : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(local)
      ? local + (local.length === 16 ? ":00" : "") + "+08:00"
      : local;
  if (!z.iso.datetime({ offset: true }).safeParse(iso).success)
    throw new Error("日期格式無效，請使用 YYYY-MM-DD 或 ISO 日期時間");
  return new Date(iso).toISOString();
}
function decodeCell(value: string) {
  return /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value;
}
function parseBoundary(value: string) {
  if (!value) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error("邊界欄位請填 true 或 false");
}
function numberValue(raw: string, required = false) {
  const value = decodeCell(raw).trim();
  if (!value) {
    if (required) throw new Error("缺少數值");
    return undefined;
  }
  if (
    !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value) ||
    !Number.isFinite(Number(value))
  )
    throw new Error(`數值格式無效：${value.slice(0, 30)}`);
  return Number(value);
}
export function measurementKey(r: HealthRecord) {
  return JSON.stringify([
    r.metricId,
    new Date(r.at).toISOString(),
    r.value,
    r.secondary ?? null,
    r.context,
    r.note,
    r.low ?? null,
    r.high ?? null,
    r.institution,
    r.lowExclusive ?? false,
    r.highExclusive ?? false,
  ]);
}
export function urineKey(r: UrineReport) {
  return JSON.stringify([
    new Date(r.at).toISOString(),
    r.institution,
    r.note,
    urineSections.flatMap((s) => s.fields.map(([key]) => r.results[key] ?? "")),
  ]);
}
export type ImportPreview = {
  records: HealthRecord[];
  urine: UrineReport[];
  errors: string[];
  duplicates: number;
  total: number;
};
export function previewCSV(
  text: string,
  mode: "measurements" | "urine",
  defs: Metric[],
  existing: HealthRecord[],
  urineExisting: UrineReport[],
): ImportPreview {
  const parsed = parseCSV(text);
  const headers = parsed[0].map((s) => s.trim());
  if (new Set(headers).size !== headers.length)
    throw new Error("CSV 含重複欄位標題");
  const allowed =
    mode === "urine"
      ? [
          "檢查時間",
          "檢驗院所",
          "備註",
          ...urineSections.flatMap((s) => s.fields.map((f) => f[1])),
        ]
      : [
          "指標",
          "數值",
          "第二數值",
          "單位",
          "日期時間",
          "情境",
          "參考下限",
          "參考上限",
        "下限不含等於", "上限不含等於", "資料來源",
          "機構",
          "備註",
        ];
  const unknown = headers.filter((h) => !allowed.includes(h));
  if (unknown.length)
    throw new Error(
      `未知欄位：${unknown.join("、")}，請依範本修正，避免遺漏資料`,
    );
  const required =
    mode === "urine" ? ["檢查時間"] : ["指標", "數值", "日期時間", "單位"];
  for (const h of required)
    if (!headers.includes(h)) throw new Error(`缺少必要欄位：${h}`);
  if (
    mode === "urine" &&
    !urineSections.some((s) => s.fields.some((f) => headers.includes(f[1])))
  )
    throw new Error("找不到尿液檢查結果欄位，請使用尿液 CSV 範本");
  const result: ImportPreview = {
    records: [],
    urine: [],
    errors: [],
    duplicates: 0,
    total: parsed.length - 1,
  };
  const seen = new Set(
    mode === "urine"
      ? urineExisting.map(urineKey)
      : existing.map(measurementKey),
  );
  parsed.slice(1).forEach((row, index) => {
    try {
      if (row.length !== headers.length) throw new Error("欄位數與標題不符");
      const get = (key: string) =>
        decodeCell(row[headers.indexOf(key)] ?? "").trim();
      if (mode === "urine") {
        const report = urineSchema.parse({
          id: crypto.randomUUID(),
          at: dateValue(get("檢查時間")),
          institution: get("檢驗院所"),
          note: get("備註"),
          results: Object.fromEntries(
            urineSections.flatMap((s) =>
              s.fields.map(([key, label]) => [key, get(label)]),
            ),
          ),
        });
        const key = urineKey(report);
        if (seen.has(key)) result.duplicates++;
        else {
          result.urine.push(report);
          seen.add(key);
        }
      } else {
        const name = get("指標");
        const candidates = defs.filter(
          (m) =>
            m.id === name ||
            m.name === name ||
            m.english.toLowerCase() === name.toLowerCase(),
        );
        if (candidates.length !== 1)
          throw new Error(
            candidates.length
              ? "指標名稱重複，請使用指標 ID"
              : "未知指標，請先建立對應的自訂指標",
          );
        const metric = candidates[0];
        if (get("單位") !== metric.unit)
          throw new Error(
            `單位不符：${metric.name} 必須為 ${metric.unit}（不自動換算）`,
          );
        const record = recordSchema.parse({
          id: crypto.randomUUID(),
          metricId: metric.id,
          value: numberValue(get("數值"), true),
          secondary: numberValue(get("第二數值")),
          at: dateValue(get("日期時間")),
          context: get("情境"),
          note: get("備註"),
          low: numberValue(get("參考下限")),
          high: numberValue(get("參考上限")),
          lowExclusive: parseBoundary(get("下限不含等於")),
          highExclusive: parseBoundary(get("上限不含等於")),
          institution: get("機構"),
          source: "demo-local",
        });
        if (metric.secondary && record.secondary === undefined)
          throw new Error("此指標需要第二數值");
        if (!metric.secondary && record.secondary !== undefined)
          throw new Error("此指標不支援第二數值");
        const key = measurementKey(record);
        if (seen.has(key)) result.duplicates++;
        else {
          result.records.push(record);
          seen.add(key);
        }
      }
    } catch (e) {
      const message =
        e instanceof z.ZodError
          ? e.issues.map((i) => i.message).join("；")
          : e instanceof Error
            ? e.message
            : "格式錯誤";
      result.errors.push(`第 ${index + 1} 筆：${message}`);
    }
  });
  return result;
}
