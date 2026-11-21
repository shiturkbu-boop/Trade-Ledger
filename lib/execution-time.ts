import type { Trade } from "./flex";

const formatter = (timeZone: string) => new Intl.DateTimeFormat("sv-SE", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const eastern = formatter("America/New_York");
const hongKong = formatter("Asia/Hong_Kong");
const oneHour = 3_600_000;

export function displayExecutionTime({ executionDate, time }: Pick<Trade, "executionDate" | "time">) {
  if (!time) return "—";
  if (!executionDate) return `${time} ET（日期未核对）`;

  const wallTime = `${executionDate} ${time}`;
  const asUtc = Date.parse(`${executionDate}T${time}Z`);
  const candidates = [asUtc + 4 * oneHour, asUtc + 5 * oneHour]
    .filter(instant => eastern.format(instant) === wallTime);

  // During the autumn clock change, an offset-free Flex timestamp can occur twice.
  return candidates.length === 1 ? hongKong.format(candidates[0]) : `${wallTime} ET`;
}
