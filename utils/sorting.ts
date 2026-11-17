export type SortBy = "created_at" | "name" | "category" | "date";
export type SortOrder = "asc" | "desc";

export function resolveSortBy(value: string | null | undefined): SortBy {
  if (
    value === "created_at" ||
    value === "name" ||
    value === "category" ||
    value === "date"
  ) {
    return value;
  }

  return "created_at";
}

export function resolveSortOrder(
  value: string | null | undefined,
): SortOrder {
  return value === "asc" ? "asc" : "desc";
}

export function defaultSortOrder(sortBy: SortBy): SortOrder {
  return sortBy === "name" || sortBy === "category" ? "asc" : "desc";
}
