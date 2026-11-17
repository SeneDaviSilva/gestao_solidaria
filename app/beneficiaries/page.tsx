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
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { TableFilters } from "@/components/ui/TableFilters";
import { getBeneficiaries } from "@/utils/supabase/beneficiaries";
import { getSupportTypes } from "@/services/supportTypes";
import { deleteBeneficiary } from "@/services/beneficiaries";

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
  const [resolvedParams, supportTypes] = await Promise.all([
    searchParams,
    getSupportTypes(),
  ]);
  const query =
    typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;
  const beneficiaries = await getBeneficiaries(query);
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
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie as famílias e indivíduos cadastrados na ONG.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ExportExcelButton
            data={exportData}
            fileName="assistidos"
            sheetName="Assistidos"
          />
          <AddBeneficiaryDialog supportTypes={supportTypes} />
        </div>
      </div>

      <TableFilters showTypeFilter={false} />
      <BeneficiaryList beneficiaries={beneficiaries} />
    </div>
  );
}

function BeneficiaryList({
  beneficiaries,
}: {
  beneficiaries: Awaited<ReturnType<typeof getBeneficiaries>>;
}) {
  return (
    <Card className="border-zinc-200 shadow-sm">
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
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beneficiaries.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{person.contact || "—"}</TableCell>
                  <TableCell>{person.category || "—"}</TableCell>
                  <TableCell className="text-right">
                    {new Date(person.created_at).toLocaleDateString("pt-BR")}
                    <div className="mt-0.5 text-xs text-zinc-400">
                      por {person.created_by_name || "Sistema"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteRecordButton
                      confirmMessage="Tem certeza de que deseja excluir este assistido? Os atendimentos vinculados a ele também serão apagados. Esta ação não pode ser desfeita."
                      id={person.id}
                      onDelete={deleteBeneficiary}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {beneficiaries.length === 0 && (
                <TableRow>
                  <TableCell
                    className="py-8 text-center text-zinc-500"
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
