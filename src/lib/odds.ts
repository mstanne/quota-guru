// Helpers for odds that may be real numbers or placeholders such as "[QUOTA_1]".
// While the template is filled with placeholders, the first operator is treated as "best"
// so that highlight styles stay visible in the mock-up.
import { oddsOperators } from "../data/operators";

export type OddValue = number | string;
/** Odds of one event for each operator: { [operatorId]: { [outcome]: value } } */
export type OddsByOperator = Record<string, Record<string, OddValue>>;

export const isNumericOdd = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** "2.45" for numbers, the placeholder text otherwise. */
export const formatOdd = (v: OddValue | null | undefined, fallback = "[QUOTA]") =>
  v === null || v === undefined ? fallback : isNumericOdd(v) ? v.toFixed(2) : v;

/** Builds placeholder odds for every comparison operator, e.g. placeholderOdds({ home: "[QUOTA_1]" }). */
export function placeholderOdds(outcomes: Record<string, string>, operatorIds = oddsOperators.map((o) => o.id)) {
  return Object.fromEntries(operatorIds.map((id) => [id, { ...outcomes }])) as OddsByOperator;
}

/** Best value for an outcome across a list of rows. */
export function bestValue(values: OddValue[]): OddValue | null {
  const nums = values.filter(isNumericOdd);
  if (nums.length) return Math.max(...nums);
  return values[0] ?? null; // placeholder mode
}

/** True if the row at `index` holds the best value for that outcome. */
export function isBestAt(values: OddValue[], index: number) {
  const nums = values.filter(isNumericOdd);
  if (nums.length) return isNumericOdd(values[index]) && values[index] === Math.max(...nums);
  return index === 0; // placeholder mode
}

/** Operator id + value of the best odd for an outcome. */
export function bestEntry(odds: OddsByOperator, outcome: string) {
  const entries = Object.entries(odds);
  const values = entries.map(([, o]) => o[outcome]);
  const i = values.findIndex((_, idx) => isBestAt(values, idx));
  return i >= 0 ? { operatorId: entries[i][0], value: values[i] } : { operatorId: "", value: "[QUOTA]" as OddValue };
}

/** Product of odds (accumulator). `null` if any value is still a placeholder. */
export function productOfOdds(values: OddValue[]): number | null {
  if (!values.every(isNumericOdd)) return null;
  return (values as number[]).reduce((p, v) => p * v, 1);
}
