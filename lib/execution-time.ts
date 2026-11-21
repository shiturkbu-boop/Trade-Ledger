import type { Trade } from "./flex";

export function displayExecutionTime({ executionDate, time }: Pick<Trade, "executionDate" | "time">) {
  if (!time) return "—";
  return executionDate ? `${executionDate} ${time}` : `${time}（日期未核对）`;
}
