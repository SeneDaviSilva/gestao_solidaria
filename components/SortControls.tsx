"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultSortOrder,
  resolveSortBy,
  resolveSortOrder,
  type SortBy,
  type SortOrder,
} from "@/utils/sorting";

type SortOption = {
  value: SortBy;
  label: string;
};

export function SortControls({ options }: { options: SortOption[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortBy = resolveSortBy(searchParams.get("sort"));
  const sortOrder = resolveSortOrder(searchParams.get("order"));

  function updateParams(nextSortBy: SortBy, nextSortOrder: SortOrder) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", nextSortBy);
    params.set("order", nextSortOrder);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <label
        className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400"
        htmlFor="sort-by"
      >
        Ordenar por
      </label>
      <Select
        value={sortBy}
        onValueChange={(value) => {
          if (typeof value !== "string") {
            return;
          }
          const nextSortBy = resolveSortBy(value);
          updateParams(nextSortBy, defaultSortOrder(nextSortBy));
        }}
      >
        <SelectTrigger
          className="w-full min-w-40 border-zinc-200 dark:border-zinc-700 sm:w-48"
          id="sort-by"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        aria-label={`Alternar ordem (atual: ${
          sortOrder === "asc" ? "crescente" : "decrescente"
        })`}
        className="shrink-0 border-zinc-200 dark:border-zinc-700"
        onClick={() =>
          updateParams(sortBy, sortOrder === "asc" ? "desc" : "asc")
        }
        title={sortOrder === "asc" ? "Crescente" : "Decrescente"}
        type="button"
        variant="outline"
      >
        {sortOrder === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
        <span className="sr-only">
          {sortOrder === "asc" ? "Crescente" : "Decrescente"}
        </span>
      </Button>
    </div>
  );
}
