import { Suspense } from "react";
import { AddAttendanceDialog } from "@/components/AddAttendanceDialog";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { TableFilters } from "@/components/ui/TableFilters";
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
import { getAttendances } from "@/utils/supabase/attendances";
import { getBeneficiaries } from "@/utils/supabase/beneficiaries";
import { getSupportTypes } from "@/services/supportTypes";
import { deleteAttendance } from "@/services/attendances";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function AttendancesPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-8 text-center text-zinc-500">
            Carregando atendimentos...
          </CardContent>
        </Card>
      }
    >
      <AttendanceContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AttendanceContent({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const query =
    typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;
  const type =
    typeof resolvedParams.type === "string" ? resolvedParams.type : undefined;
  const [attendances, beneficiaries, supportTypes] = await Promise.all([
    getAttendances(query, type),
    getBeneficiaries(),
    getSupportTypes(),
  ]);
  const mappedBeneficiaries = beneficiaries.map(({ id, name }) => ({
    id,
    name,
  }));
  const exportData = attendances.map((record) => ({
    Assistido: record.beneficiaries?.name || "Desconhecido",
    "Apoio Concedido": record.type,
    Detalhes: record.description || "—",
    Data: new Date(record.date).toLocaleDateString("pt-BR"),
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Atendimentos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Histórico de entregas e serviços prestados.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ExportExcelButton
            data={exportData}
            fileName="atendimentos"
            sheetName="Atendimentos"
          />
          <AddAttendanceDialog
            beneficiaries={mappedBeneficiaries}
            supportTypes={supportTypes}
          />
        </div>
      </div>

      <TableFilters showTypeFilter />

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Histórico de Atendimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assistido</TableHead>
                  <TableHead>Apoio Concedido</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.beneficiaries?.name || "Desconhecido"}
                    </TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-zinc-500">
                      {record.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(record.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteRecordButton
                        confirmMessage="Tem certeza de que deseja excluir este atendimento? Esta ação não pode ser desfeita."
                        id={record.id}
                        onDelete={deleteAttendance}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {attendances.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="py-8 text-center text-zinc-500"
                      colSpan={5}
                    >
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
