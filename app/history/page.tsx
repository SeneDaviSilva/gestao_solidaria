import { Suspense } from "react";
import { AttendanceDetailsCell } from "@/components/AttendanceDetailsCell";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { EditAttendanceDialog } from "@/components/EditAttendanceDialog";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { SortControls } from "@/components/SortControls";
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
import { deleteAttendance, getAttendances } from "@/services/attendances";
import { getBeneficiaries } from "@/services/beneficiaries";
import { getOrganizationSettings } from "@/services/settings";
import { getSupportTypes } from "@/services/supportTypes";
import { resolveSortBy, resolveSortOrder } from "@/utils/sorting";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function HistoryPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-8 text-center text-zinc-500">
            Carregando histórico...
          </CardContent>
        </Card>
      }
    >
      <HistoryContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HistoryContent({ searchParams }: PageProps) {
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
  const [attendances, supportTypes, orgSettings, allAttendances, beneficiaries] =
    await Promise.all([
      getAttendances(query, type, sortBy, sortOrder),
      getSupportTypes(),
      getOrganizationSettings(),
      getAttendances(),
      getBeneficiaries(),
    ]);
  const mappedBeneficiaries = beneficiaries.map(({ id, name }) => ({
    id,
    name,
  }));

  const exportData = allAttendances.map((record) => ({
    Assistido: record.beneficiaries?.name || "Não identificado",
    "Tipo de Apoio": record.type,
    Detalhes: record.description || "—",
    Data: new Date(record.date).toLocaleDateString("pt-BR"),
    "Registrado por": record.created_by_name || "Sistema",
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Histórico de Atendimentos
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Total de {allAttendances.length} atendimentos realizados
          </p>
        </div>
        <ExportExcelButton
          columns={[
            "Assistido",
            "Tipo de Apoio",
            "Detalhes",
            "Data",
            "Registrado por",
          ]}
          data={exportData}
          fileName="historico-atendimentos"
          orgSettings={orgSettings}
          sheetName="Histórico"
        />
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
            Todos os Atendimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assistido</TableHead>
                  <TableHead>Tipo de Apoio</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.beneficiaries?.name || "Não identificado"}
                    </TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>
                      <AttendanceDetailsCell
                        beneficiaryName={
                          record.beneficiaries?.name || "Não identificado"
                        }
                        createdByName={record.created_by_name}
                        date={record.date}
                        description={record.description}
                        type={record.type}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(record.date).toLocaleDateString("pt-BR")}
                      <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                        por {record.created_by_name || "Sistema"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <EditAttendanceDialog
                          attendance={{
                            id: record.id,
                            beneficiary_id: record.beneficiary_id,
                            type: record.type,
                            description: record.description,
                          }}
                          beneficiaries={mappedBeneficiaries}
                          supportTypes={supportTypes}
                        />
                        <DeleteRecordButton
                          confirmMessage="Tem certeza de que deseja enviar este atendimento para a lixeira?"
                          id={record.id}
                          onDelete={deleteAttendance}
                        />
                      </div>
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
