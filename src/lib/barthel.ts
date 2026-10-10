import { z } from "zod";
export const barthelSource =
  "https://www.ntshb.gov.tw/df_ufiles/1128/%E5%B7%B4%E6%B0%8F%E9%87%8F%E8%A1%A8.pdf";
export const barthelItems = [
  {
    id: "feeding",
    name: "進食",
    group: "自我照顧能力",
    options: [
      [10, "合理時間內自行取食，能自行穿脫進食輔具"],
      [5, "需協助穿脫輔具，或僅能用湯匙進食"],
      [0, "無法自行取食，或用時過長"],
    ],
  },
  {
    id: "grooming",
    name: "個人衛生修飾",
    group: "自我照顧能力",
    options: [
      [5, "自行洗手、刷牙、洗臉及梳頭"],
      [0, "需要部分或全部協助"],
    ],
  },
  {
    id: "bathing",
    name: "洗澡",
    group: "自我照顧能力",
    options: [
      [5, "獨立完成盆浴或淋浴，無須旁人陪同"],
      [0, "需要協助"],
    ],
  },
  {
    id: "dressing",
    name: "穿脫衣褲鞋襪",
    group: "自我照顧能力",
    options: [
      [10, "自行穿脫衣鞋及處理鈕釦、拉鍊、鞋帶"],
      [5, "經協助可自行完成超過一半動作"],
      [0, "無法自行完成"],
    ],
  },
  {
    id: "bowels",
    name: "大便控制",
    group: "自我照顧能力",
    options: [
      [10, "無失禁，能自行處理灌腸或塞劑"],
      [5, "偶有失禁（每週不超過一次），或需協助灌腸、塞劑"],
      [0, "無法控制，需他人處理"],
    ],
  },
  {
    id: "bladder",
    name: "小便控制",
    group: "自我照顧能力",
    options: [
      [10, "無失禁，或能自行使用及清潔尿套、尿袋"],
      [5, "偶有失禁、尿急來不及如廁，或需協助處理尿套"],
      [0, "無法控制，需他人處理"],
    ],
  },
  {
    id: "toilet",
    name: "如廁",
    group: "自我照顧能力",
    options: [
      [10, "自行上下馬桶、穿脫衣物及擦拭，不弄髒衣物"],
      [5, "需協助平衡、衣物整理或擦拭"],
      [0, "無法自行完成"],
    ],
  },
  {
    id: "transfer",
    name: "移位：床與椅子",
    group: "行動能力",
    options: [
      [15, "整個移位過程獨立完成"],
      [10, "需少量協助、提醒或安全監督"],
      [5, "可自行坐起，但起身或移動需協助"],
      [0, "無法自行移動"],
    ],
  },
  {
    id: "mobility",
    name: "平地走動",
    group: "行動能力",
    options: [
      [15, "可獨立行走 50 公尺以上，可使用輔具"],
      [10, "稍加扶持或口頭指導，可行走 50 公尺以上"],
      [5, "不能行走，但可獨立操控輪椅並推行 50 公尺以上"],
      [0, "無法自行行走，輪椅也需他人推行"],
    ],
  },
  {
    id: "stairs",
    name: "上下樓梯",
    group: "行動能力",
    options: [
      [10, "自行上下樓梯，可使用扶手或柺杖"],
      [5, "需他人協助或監督"],
      [0, "無法上下樓梯"],
    ],
  },
] as const;
export function barthelTotal(scores: Record<string, number>) {
  return barthelItems.every((i) => i.options.some((o) => o[0] === scores[i.id]))
    ? barthelItems.reduce((n, i) => n + scores[i.id], 0)
    : undefined;
}
export const barthelSchema = z
  .object({
    id: z.uuid(),
    at: z.iso.datetime({ offset: true }),
    version: z.literal("ntshb-adl-100-v1"),
    description: z.string().max(500),
    caregiver: z.string().max(500),
    note: z.string().max(3000),
    scores: z.record(z.string(), z.number()),
  })
  .superRefine((r, c) => {
    if (barthelTotal(r.scores) === undefined)
      c.addIssue({
        code: "custom",
        message: "請完成全部 10 題，並使用各題有效分數",
      });
    if (
      Object.keys(r.scores).some((k) => !barthelItems.some((i) => i.id === k))
    )
      c.addIssue({ code: "custom", message: "包含未知評分項目" });
  });
export type BarthelRecord = z.infer<typeof barthelSchema>;
