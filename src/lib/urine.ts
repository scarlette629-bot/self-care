import { z } from "zod";
export const urineSections = [
  {
    name: "一、物理性質檢查",
    fields: [
      ["color", "顏色 (Color)", "淡黃色 / 正常"],
      ["clarity", "外觀 / 混濁度 (Appearance / Clarity)", "澄清 / 略帶混濁"],
      ["ph", "酸鹼值 (pH)", "6.0"],
      ["gravity", "比重 (Specific Gravity)", "1.020"],
    ],
  },
  {
    name: "二、化學成分檢查（試紙測試）",
    fields: [
      ["protein", "蛋白質 (Protein)", "陰性 / Trace / 1+"],
      ["glucose", "葡萄糖 (Glucose)", "陰性 / 陽性"],
      ["ketones", "酮體 (Ketones)", "陰性"],
      ["blood", "潛血 (Blood)", "陰性 / 1+ / 2+"],
      ["bilirubin", "膽紅素 (Bilirubin)", "陰性"],
      ["urobilinogen", "尿膽素原 (Urobilinogen)", "正常 / 0.2"],
      ["nitrite", "亞硝酸鹽 (Nitrite)", "陰性 / 陽性"],
      ["leukocytes", "白血球酯酶 (Leukocyte Esterase)", "陰性 / 陽性 / Trace"],
    ],
  },
  {
    name: "三、顯微鏡沉渣檢查",
    fields: [
      ["rbc", "紅血球 (RBC)", "0-2 /HPF"],
      ["wbc", "白血球 (WBC)", "1-3 /HPF"],
      ["epithelial", "上皮細胞 (Epithelial Cells)", "少許"],
      ["casts", "圓柱體 (Casts)", "無 / 玻璃樣圓柱 0-1"],
      ["crystals", "結晶體 (Crystals)", "無"],
      ["bacteria", "細菌 / 黴菌 (Bacteria/Yeast)", "陰性 / 少量"],
    ],
  },
];
export const urineSchema = z
  .object({
    id: z.uuid(),
    at: z.iso.datetime({ offset: true }),
    institution: z.string().max(200),
    note: z.string().max(3000),
    results: z.record(z.string(), z.string().trim().max(200)),
  })
  .superRefine((r, c) => {
    const fields = urineSections.flatMap((s) => s.fields.map((f) => f[0]));
    if (!fields.some((k) => r.results[k]?.trim()))
      c.addIssue({ code: "custom", message: "請至少填寫一項檢查結果" });
    for (const key of Object.keys(r.results))
      if (!fields.includes(key))
        c.addIssue({ code: "custom", message: "包含未知尿液檢查欄位" });
  });
export type UrineReport = z.infer<typeof urineSchema>;
