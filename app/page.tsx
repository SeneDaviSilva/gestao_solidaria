import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, HeartHandshake } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

type RecentAttendance = {
  id: string;
  type: string;
  date: string;
  beneficiaries?: { name: string }[];
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-zinc-500">Carregando indicadores...</p>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const supabase = await createClient();

  const { count: beneficiariesCount } = await supabase
    .from("beneficiaries")
    .select("*", { count: "exact", head: true });

  const { count: attendancesCount } = await supabase
    .from("attendances")
    .select("*", { count: "exact", head: true });

  const { data: recentAttendances } = await supabase
    .from("attendances")
    .select(`
      id,
      type,
      date,
      beneficiaries!inner(name)
    `)
    .order("date", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visão Geral</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Acompanhe os indicadores da ONG.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Total de Assistidos</CardTitle>
            <Users className="h-4 w-4 text-zinc-400 dark:text-zinc-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{beneficiariesCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Atendimentos Realizados</CardTitle>
            <HeartHandshake className="h-4 w-4 text-zinc-400 dark:text-zinc-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{attendancesCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Últimos Atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200 hover:bg-transparent dark:border-zinc-800">
                  <TableHead className="font-medium">Assistido</TableHead>
                  <TableHead className="font-medium">Tipo de Apoio</TableHead>
                  <TableHead className="font-medium text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAttendances?.map((attendance: RecentAttendance) => (
                  <TableRow className="border-zinc-100 transition-colors" key={attendance.id}>
                    <TableCell className="text-zinc-900 dark:text-zinc-100">
                      {attendance.beneficiaries?.[0]?.name}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-300">{attendance.type}</TableCell>
                    <TableCell className="text-right text-zinc-500 dark:text-zinc-400">
                      {new Date(attendance.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
                {!recentAttendances?.length && (
                  <TableRow>
                    <TableCell className="py-6 text-center text-zinc-500 dark:text-zinc-400" colSpan={3}>
                      Nenhum atendimento registrado.
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