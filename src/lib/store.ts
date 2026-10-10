import { create } from "zustand";
import { repository, emptyData } from "../data/repository";
import type { Backup } from "./model";
type Store = {
  data: Backup;
  ready: boolean;
  error: string;
  busy: boolean;
  init: () => Promise<void>;
  commit: (change: (b: Backup) => Backup) => Promise<void>;
};
let chain = Promise.resolve();
export const useStore = create<Store>((set, get) => ({
  data: emptyData(),
  ready: false,
  error: "",
  busy: false,
  init: async () => {
    try {
      const data = await repository.load();
      set({ data: data ?? emptyData(), ready: true });
    } catch {
      set({ ready: true, error: "無法讀取本機資料庫。請允許瀏覽器儲存權限。" });
    }
  },
  commit: (change) => {
    const op = chain.then(async () => {
      set({ busy: true, error: "" });
      try {
        const next = change(get().data);
        await repository.save(next);
        set({ data: next });
      } catch (e) {
        set({ error: "儲存失敗，資料尚未更新。請檢查儲存空間與輸入格式。" });
        throw e;
      } finally {
        set({ busy: false });
      }
    });
    chain = op.catch(() => {});
    return op;
  },
}));
