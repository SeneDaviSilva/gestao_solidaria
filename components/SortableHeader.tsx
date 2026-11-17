"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TableHead } from "@/components/ui/table";
import {
  defaultSortOrder,
  resolveSortBy,
  resolveSortOrder,
  type SortBy,
} from "@/utils/sorting";

export function SortableHeader({
  sortBy: headerSortBy,
  children,
  aliases = [],
  className,
}: {
  sortBy: SortBy;
  children: React.ReactNode;
  aliases?: SortBy[];
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortBy = resolveSortBy(searchParams.get("sort"));
  const sortOrder = resolveSortOrder(searchParams.get("order"));
  const active = sortBy === headerSortBy || aliases.includes(sortBy);

  function handleSort() {
    const nextSortOrder = active
      ? sortOrder === "asc"
        ? "desc"
        : "asc"
      : defaultSortOrder(headerSortBy);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", headerSortBy);
    params.set("order", nextSortOrder);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <TableHead
      aria-sort={
        active
          ? sortOrder === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className={className}
    >
      <button
        className="inline-flex items-center gap-1.5 hover:text-foreground"
        onClick={handleSort}
        type="button"
      >
        <span>{children}</span>
        {active ? (
          sortOrder === "asc" ? (
            <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown
            aria-hidden="true"
            className="h-3.5 w-3.5 text-zinc-400"
          />
        )}
      </button>
    </TableHead>
  );
}
