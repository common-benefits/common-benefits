/**
 * Ergonomic builders for `{operator, value}` filter literals.
 *
 * Lets callers write `f.eq("red")` instead of `{ operator: "eq", value: "red" }`
 * — the per-route filter schema (built by `withCustomFilters()`) does the
 * runtime validation, so passing the wrong helper to a filter is caught by
 * Zod at call time with a clear error path.
 */

/** Filter helpers — see module docstring. */
export const f = {
  eq: <T>(value: T) => ({ operator: "eq" as const, value }),
  neq: <T>(value: T) => ({ operator: "neq" as const, value }),
  lt: <T>(value: T) => ({ operator: "lt" as const, value }),
  lte: <T>(value: T) => ({ operator: "lte" as const, value }),
  gt: <T>(value: T) => ({ operator: "gt" as const, value }),
  gte: <T>(value: T) => ({ operator: "gte" as const, value }),
  in: <T>(value: T[]) => ({ operator: "in" as const, value }),
  notIn: <T>(value: T[]) => ({ operator: "notIn" as const, value }),
  like: (value: string) => ({ operator: "like" as const, value }),
  notLike: (value: string) => ({ operator: "notLike" as const, value }),
  between: <T>(min: T, max: T) => ({ operator: "between" as const, value: { min, max } }),
  outside: <T>(min: T, max: T) => ({ operator: "outside" as const, value: { min, max } }),
};
