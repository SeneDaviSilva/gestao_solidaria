import { Suspense } from "react";
import { AddAttendanceDialog } from "@/components/AddAttendanceDialog";
import { BulkAttendancesDialog } from "@/components/BulkAttendancesDialog";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { SortControls } from "@/components/SortControls";
import { SortableHeader } from "@/components/SortableHeader";
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
import {
  deleteAttendance,
  getAttendances,
} from "@/services/attendances";
import { getBeneficiaries } from "@/services/beneficiaries";
import { getOrganizationSettings } from "@/services/settings";
import { getSupportTypes } from "@/services/supportTypes";
import { resolveSortBy, resolveSortOrder } from "@/utils/sorting";

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
  const sortBy = resolveSortBy(
    typeof resolvedParams.sort === "string" ? resolvedParams.sort : null,
  );
  const sortOrder = resolveSortOrder(
    typeof resolvedParams.order === "string" ? resolvedParams.order : null,
  );
  const [attendances, beneficiaries, supportTypes, orgSettings] =
    await Promise.all([
      getAttendances(query, type, sortBy, sortOrder),
      getBeneficiaries(),
      getSupportTypes(),
      getOrganizationSettings(),
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
    "Registrado por": record.created_by_name || "Sistema",
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Atendimentos</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Histórico de entregas e serviços prestados.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ExportExcelButton
            columns={[
              "Assistido",
              "Apoio Concedido",
              "Detalhes",
              "Data",
              "Registrado por",
            ]}
            data={exportData}
            fileName="atendimentos"
            orgSettings={orgSettings}
            sheetName="Atendimentos"
          />
          <BulkAttendancesDialog
            beneficiaries={mappedBeneficiaries}
            supportTypes={supportTypes}
          />
          <AddAttendanceDialog
            beneficiaries={mappedBeneficiaries}
            supportTypes={supportTypes}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <TableFilters showTypeFilter />
        <SortControls
          options={[
            { value: "created_at", label: "Ordem de Adição" },
            { value: "name", label: "Nome" },
            { value: "category", label: "Tipo de Apoio" },
            { value: "date", label: "Data" },
          ]}
        />
      </div>

      <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
                  <SortableHeader sortBy="name">Assistido</SortableHeader>
                  <SortableHeader sortBy="category">
                    Apoio Concedido
                  </SortableHeader>
                  <TableHead>Detalhes</TableHead>
                  <SortableHeader className="text-right" sortBy="date">
                    Data
                  </SortableHeader>
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
                    <TableCell className="max-w-xs truncate text-sm text-zinc-500 dark:text-zinc-400">
                      {record.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(record.date).toLocaleDateString("pt-BR")}
                      <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                        por {record.created_by_name || "Sistema"}
                      </div>
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
                      className="py-8 text-center text-zinc-500 dark:text-zinc-400"
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
