import { Suspense } from "react";
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
import { AddBeneficiaryDialog } from "@/components/AddBeneficiaryDialog";
import { BulkBeneficiariesDialog } from "@/components/BulkBeneficiariesDialog";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { EditBeneficiaryDialog } from "@/components/EditBeneficiaryDialog";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { SortControls } from "@/components/SortControls";
import { SortableHeader } from "@/components/SortableHeader";
import { TableFilters } from "@/components/ui/TableFilters";
import { getBeneficiaries } from "@/services/beneficiaries";
import { getOrganizationSettings } from "@/services/settings";
import { getSupportTypes } from "@/services/supportTypes";
import { deleteBeneficiary } from "@/services/beneficiaries";
import { resolveSortBy, resolveSortOrder } from "@/utils/sorting";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function BeneficiariesPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-8 text-center text-zinc-500">
            Carregando assistidos...
          </CardContent>
        </Card>
      }
    >
      <BeneficiaryContent searchParams={searchParams} />
    </Suspense>
  );
}

async function BeneficiaryContent({ searchParams }: PageProps) {
  const [resolvedParams, supportTypes, orgSettings] = await Promise.all([
    searchParams,
    getSupportTypes(),
    getOrganizationSettings(),
  ]);
  const query =
    typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;
  const sortBy = resolveSortBy(
    typeof resolvedParams.sort === "string" ? resolvedParams.sort : null,
  );
  const sortOrder = resolveSortOrder(
    typeof resolvedParams.order === "string" ? resolvedParams.order : null,
  );
  const [beneficiaries, allBeneficiaries] = await Promise.all([
    getBeneficiaries(query, sortBy, sortOrder),
    getBeneficiaries(),
  ]);
  const exportData = beneficiaries.map((person) => ({
    Nome: person.name,
    Contato: person.contact || "—",
    Categoria: person.category || "—",
    "Data de Cadastro": new Date(person.created_at).toLocaleDateString("pt-BR"),
    "Registrado por": person.created_by_name || "Sistema",
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assistidos</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Gerencie as famílias e indivíduos cadastrados na ONG.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ExportExcelButton
            columns={[
              "Nome",
              "Contato",
              "Categoria",
              "Data de Cadastro",
              "Registrado por",
            ]}
            data={exportData}
            fileName="assistidos"
            orgSettings={orgSettings}
            sheetName="Assistidos"
          />
          <BulkBeneficiariesDialog
            beneficiaries={allBeneficiaries}
            supportTypes={supportTypes}
          />
          <AddBeneficiaryDialog supportTypes={supportTypes} />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <TableFilters showTypeFilter={false} />
        <SortControls
          options={[
            { value: "created_at", label: "Ordem de Adição" },
            { value: "name", label: "Nome" },
            { value: "category", label: "Categoria" },
            { value: "date", label: "Data" },
          ]}
        />
      </div>
      <BeneficiaryList
        beneficiaries={beneficiaries}
        supportTypes={supportTypes}
      />
    </div>
  );
}

function BeneficiaryList({
  beneficiaries,
  supportTypes,
}: {
  beneficiaries: Awaited<ReturnType<typeof getBeneficiaries>>;
  supportTypes: Awaited<ReturnType<typeof getSupportTypes>>;
}) {
  return (
    <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Lista de Assistidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader sortBy="name">Nome</SortableHeader>
                <TableHead>Contato</TableHead>
                <SortableHeader sortBy="category">Categoria</SortableHeader>
                <SortableHeader
                  className="text-right"
                  sortBy="date"
                  aliases={["created_at"]}
                >
                  Data de Cadastro
                </SortableHeader>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beneficiaries.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell className="text-zinc-700 dark:text-zinc-200">
                    {person.contact || "—"}
                  </TableCell>
                  <TableCell className="text-zinc-700 dark:text-zinc-200">
                    {person.category || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(person.created_at).toLocaleDateString("pt-BR")}
                    <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      por {person.created_by_name || "Sistema"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <EditBeneficiaryDialog
                        beneficiary={{
                          id: person.id,
                          name: person.name,
                          contact: person.contact,
                          category: person.category || "",
                        }}
                        supportTypes={supportTypes}
                      />
                      <DeleteRecordButton
                        confirmMessage="Tem certeza de que deseja enviar este assistido e os atendimentos vinculados para a lixeira?"
                        id={person.id}
                        onDelete={deleteBeneficiary}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {beneficiaries.length === 0 && (
                <TableRow>
                  <TableCell
                    className="py-8 text-center text-zinc-500 dark:text-zinc-400"
                    colSpan={5}
                  >
                    Nenhum assistido encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
