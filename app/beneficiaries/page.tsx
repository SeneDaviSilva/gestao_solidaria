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
import { TableFilters } from "@/components/ui/TableFilters";
import { getBeneficiaries } from "@/utils/supabase/beneficiaries";
import { getSupportTypes } from "@/services/supportTypes";

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
  const supportTypes = await getSupportTypes();

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assistidos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie as famílias e indivíduos cadastrados na ONG.
          </p>
        </div>
        <AddBeneficiaryDialog supportTypes={supportTypes} />
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="py-8 text-center text-zinc-500">
              Carregando assistidos...
            </CardContent>
          </Card>
        }
      >
        <BeneficiaryList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BeneficiaryList({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const query =
    typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;
  const beneficiaries = await getBeneficiaries(query);

  return (
    <>
      <TableFilters showTypeFilter={false} />
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
                    </TableCell>
                  </TableRow>
                ))}
                {beneficiaries.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="py-8 text-center text-zinc-500"
                      colSpan={4}
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
    </>
  );
}
