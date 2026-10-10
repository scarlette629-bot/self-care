import { metrics } from "./metrics";
import { useStore } from "../lib/store";
export function useDefinitions() {
  const custom = useStore((s) => s.data.custom);
  return [...metrics, ...custom];
}
