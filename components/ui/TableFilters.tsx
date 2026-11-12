"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useTransition, useState, useEffect } from "react";

interface TableFiltersProps {
  showTypeFilter?: boolean;
}

export function TableFilters({ showTypeFilter = false }: TableFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q")?.toString() || "");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm) {
        params.set("q", searchTerm);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        replace(`${pathname}?${params.toString()}`);
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, pathname, replace, searchParams]);

  function handleTypeChange(value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 border-zinc-200 focus-visible:ring-zinc-900"
        />
      </div>

      {showTypeFilter && (
        <Select 
          defaultValue={searchParams.get("type")?.toString() || "all"} 
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-full sm:w-[200px] border-zinc-200 focus:ring-zinc-900">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="Cesta Básica">Cesta Básica</SelectItem>
            <SelectItem value="Kits de Higiene">Kits de Higiene</SelectItem>
            <SelectItem value="Roupas/Cobertores">Roupas/Cobertores</SelectItem>
            <SelectItem value="Apoio Psicológico">Apoio Psicológico</SelectItem>
            <SelectItem value="Orientação Jurídica">Orientação Jurídica</SelectItem>
            <SelectItem value="Outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}