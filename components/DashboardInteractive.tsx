"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HeartHandshake, Users, TrendingUp, Scale } from "lucide-react";
import { AddBeneficiaryDialog } from "@/components/AddBeneficiaryDialog";
import { AddAttendanceDialog } from "@/components/AddAttendanceDialog";
import { AttendanceDetailsCell } from "@/components/AttendanceDetailsCell";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Beneficiary = {
  id: string;
  name: string;
  created_at: string;
};

type Attendance = {
  id: string;
  type: string;
  date: string;
  created_at: string;
  description: string | null;
  created_by_name: string | null;
  beneficiaries?: { name: string } | { name: string }[] | null;
};

type SupportType = { id: string; name: string };

type Period = "7" | "30" | "year" | "all";

function beneficiaryName(attendance: Attendance) {
  return Array.isArray(attendance.beneficiaries)
    ? attendance.beneficiaries[0]?.name
    : attendance.beneficiaries?.name;
}

export function DashboardInteractive({
  beneficiaries,
  attendances,
  supportTypes,
}: {
  beneficiaries: Beneficiary[];
  attendances: Attendance[];
  supportTypes: SupportType[];
}) {
  const [period, setPeriod] = useState<Period>("30");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const periodAttendances = useMemo(() => {
    if (period === "all") return attendances;

    const now = new Date();
    let start: Date;
    if (period === "year") {
      start = new Date(now.getFullYear(), 0, 1);
    } else {
      start = new Date(now);
      start.setDate(now.getDate() - (period === "7" ? 7 : 30));
    }

    return attendances.filter((attendance) => {
      const date = new Date(attendance.created_at || attendance.date);
      return !Number.isNaN(date.getTime()) && date >= start;
    });
  }, [attendances, period]);

  const periodBeneficiaries = useMemo(() => {
    if (period === "all") return beneficiaries;
    const now = new Date();
    let start: Date;
    if (period === "year") {
      start = new Date(now.getFullYear(), 0, 1);
    } else {
      start = new Date(now);
      start.setDate(now.getDate() - (period === "7" ? 7 : 30));
    }
    return beneficiaries.filter((beneficiary) => {
      const date = new Date(beneficiary.created_at);
      return !Number.isNaN(date.getTime()) && date >= start;
    });
  }, [beneficiaries, period]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    periodAttendances.forEach((attendance) => {
      counts.set(attendance.type, (counts.get(attendance.type) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [periodAttendances]);

  const mostDemanded = typeCounts[0]?.name || "Sem dados";
  const maxTypeCount = typeCounts[0]?.count || 0;
  const average =
    periodBeneficiaries.length > 0
      ? periodAttendances.length / periodBeneficiaries.length
      : 0;

  const recent = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return periodAttendances
      .filter((attendance) =>
        typeFilter ? attendance.type === typeFilter : true,
      )
      .filter((attendance) => {
        if (!normalizedSearch) return true;
        return (beneficiaryName(attendance) || "")
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch);
      })
      .slice(0, 15);
  }, [periodAttendances, search, typeFilter]);

  const periodOptions: { value: Period; label: string }[] = [
    { value: "7", label: "Últimos 7 dias" },
    { value: "30", label: "Últimos 30 dias" },
    { value: "year", label: "Este Ano" },
    { value: "all", label: "Todo o período" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão Geral</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Indicadores e atividades recentes da ONG.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddBeneficiaryDialog supportTypes={supportTypes} />
          <AddAttendanceDialog
            beneficiaries={beneficiaries.map(({ id, name }) => ({ id, name }))}
            supportTypes={supportTypes}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {periodOptions.map((option) => (
          <button
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              period === option.value
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
            key={option.value}
            onClick={() => setPeriod(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          label="Total de Assistidos"
          value={periodBeneficiaries.length}
        />
        <KpiCard
          icon={<HeartHandshake className="h-4 w-4" />}
          label="Atendimentos Realizados"
          value={`${periodAttendances.length} no período / ${attendances.length} total`}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Apoio Mais Demandado"
          value={mostDemanded}
        />
        <KpiCard
          icon={<Scale className="h-4 w-4" />}
          label="Média por Assistido"
          value={average.toFixed(1)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição por Tipo de Apoio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {typeCounts.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum atendimento no período.</p>
          ) : (
            typeCounts.map(({ name, count }) => {
              const percentage =
                periodAttendances.length > 0
                  ? (count / periodAttendances.length) * 100
                  : 0;
              const active = typeFilter === name;
              return (
                <button
                  className={`w-full rounded-md p-2 text-left transition-colors ${
                    active
                      ? "bg-zinc-100 ring-1 ring-zinc-900 dark:bg-zinc-800 dark:ring-zinc-100"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  }`}
                  key={name}
                  onClick={() => setTypeFilter(active ? null : name)}
                  type="button"
                >
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <span className="font-medium">{name}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {count} · {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                      style={{ width: `${(count / maxTypeCount) * 100}%` }}
                    />
                  </div>
                </button>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Últimos 15 Atendimentos</CardTitle>
            {typeFilter && (
              <button
                className="mt-2 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                onClick={() => setTypeFilter(null)}
                type="button"
              >
                Filtrando por: {typeFilter} ✕
              </button>
            )}
          </div>
          <Link
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            href="/history"
          >
            Ver histórico completo →
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            className="max-w-sm"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pelo nome do assistido..."
            value={search}
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assistido</TableHead>
                  <TableHead>Tipo de Apoio</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>{beneficiaryName(attendance) || "Não identificado"}</TableCell>
                    <TableCell>{attendance.type}</TableCell>
                    <TableCell className="text-right">
                      {new Date(attendance.date).toLocaleDateString("pt-BR")}
                      {attendance.created_by_name && (
                        <div className="mt-0.5 text-xs text-zinc-400">
                          por {attendance.created_by_name}
                        </div>
                      )}
                      <AttendanceDetailsCell
                        alwaysShowDetailsButton
                        beneficiaryName={
                          beneficiaryName(attendance) || "Não identificado"
                        }
                        createdByName={attendance.created_by_name}
                        date={attendance.date}
                        description={attendance.description}
                        type={attendance.type}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {recent.length === 0 && (
                  <TableRow>
                    <TableCell className="py-6 text-center text-zinc-500" colSpan={3}>
                      Nenhum atendimento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {label}
        </CardTitle>
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
