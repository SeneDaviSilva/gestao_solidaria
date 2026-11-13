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
        <p className="text-sm text-zinc-500 mt-1">Acompanhe os indicadores da ONG.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Total de Assistidos</CardTitle>
            <Users className="w-4 h-4 text-zinc-400"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{beneficiariesCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Atendimentos Realizados</CardTitle>
            <HeartHandshake className="w-4 h-4 text-zinc-400"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{attendancesCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-zinc-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Últimos Atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 hover:bg-transparent">
                <TableHead className="font-medium">Assistido</TableHead>
                <TableHead className="font-medium">Tipo de Apoio</TableHead>
                <TableHead className="font-medium text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAttendances?.map((attendance: RecentAttendance) => (
                <TableRow className="border-zinc-100 transition-colors" key={attendance.id}>
                  <TableCell className="text-zinc-900">
                    {attendance.beneficiaries?.[0]?.name}
                  </TableCell>
                  <TableCell className="text-zinc-600">{attendance.type}</TableCell>
                  <TableCell className="text-right text-zinc-500">
                    {new Date(attendance.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {!recentAttendances?.length && (
                <TableRow>
                  <TableCell className="text-center text-zinc-500 py-6" colSpan={3}>
                    Nenhum atendimento registrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}