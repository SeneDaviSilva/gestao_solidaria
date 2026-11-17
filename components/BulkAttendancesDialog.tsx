"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListPlus } from "lucide-react";
import { toast } from "sonner";
import { createAttendancesBulk } from "@/services/attendances";
import type { SupportType } from "@/services/supportTypes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type BeneficiaryOption = {
  id: string;
  name: string;
};

type ParsedAttendance = {
  lineNumber: number;
  beneficiaryName: string;
  beneficiaryId?: string;
  type: string;
  description: string;
  valid: boolean;
  status: string;
  warning?: string;
};

function normalizeValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function BulkAttendancesDialog({
  beneficiaries,
  supportTypes,
}: {
  beneficiaries: BeneficiaryOption[];
  supportTypes: SupportType[];
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const preview = useMemo<ParsedAttendance[]>(() => {
    const beneficiariesByName = new Map(
      beneficiaries.map((beneficiary) => [
        normalizeValue(beneficiary.name),
        beneficiary,
      ]),
    );
    const supportTypesByName = new Map(
      supportTypes.map((supportType) => [
        normalizeValue(supportType.name),
        supportType.name,
      ]),
    );
    const fallbackType = supportTypesByName.get("outros");

    return text.split(/\r?\n/).flatMap((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) {
        return [];
      }

      const [rawName = "", rawType = "", ...descriptionParts] =
        line.split("|");
      const beneficiaryName = rawName.trim();
      const requestedType = rawType.trim();
      const description = descriptionParts.join("|").trim();
      const beneficiary = beneficiariesByName.get(
        normalizeValue(beneficiaryName),
      );
      const matchedType = supportTypesByName.get(
        normalizeValue(requestedType),
      );
      const type = matchedType ?? fallbackType ?? "";
      const valid = Boolean(beneficiary && type);

      let warning: string | undefined;
      if (!beneficiary) {
        warning = "Cadastre o assistido primeiro em Assistidos.";
      } else if (!matchedType && fallbackType) {
        warning = `Tipo de apoio ajustado para ${fallbackType}.`;
      } else if (!type) {
        warning = 'Tipo não encontrado e a opção "Outros" não está cadastrada.';
      }

      return [
        {
          lineNumber: index + 1,
          beneficiaryName,
          beneficiaryId: beneficiary?.id,
          type,
          description,
          valid,
          status: !beneficiary
            ? "Não encontrado"
            : valid
              ? "Válida"
              : "Tipo inválido",
          warning,
        },
      ];
    });
  }, [beneficiaries, supportTypes, text]);

  const validRecords = preview.filter(
    (record): record is ParsedAttendance & { beneficiaryId: string } =>
      record.valid && Boolean(record.beneficiaryId),
  );

  async function importAttendances() {
    if (validRecords.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const result = await createAttendancesBulk(
        validRecords.map((record) => ({
          beneficiary_id: record.beneficiaryId,
          type: record.type,
          description: record.description,
        })),
      );

      if (!result.success) {
        toast.error("Não foi possível importar os atendimentos.", {
          description: result.error,
        });
        return;
      }

      const skipped = preview.length - result.count;
      toast.success(`${result.count} atendimentos importados com sucesso.`, {
        description:
          skipped > 0
            ? `${skipped} linha(s) inválida(s) foram ignoradas.`
            : undefined,
      });
      setOpen(false);
      setText("");
      router.refresh();
    } catch (error) {
      toast.error("Não foi possível importar os atendimentos.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button className="border-zinc-200 dark:border-zinc-700" variant="outline">
            <ListPlus className="mr-2 h-4 w-4" />
            Importar em Massa
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar Atendimentos em Massa</DialogTitle>
          <DialogDescription>
            Uma linha por atendimento: Nome do Assistido | Tipo de Apoio |
            Observação (opcional).
          </DialogDescription>
        </DialogHeader>

        <textarea
          aria-label="Atendimentos para importar"
          className="min-h-36 w-full resize-y rounded-md border border-zinc-200 bg-background p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-700"
          onChange={(event) => setText(event.target.value)}
          placeholder={
            "Maria da Silva | Cesta Básica | Entrega mutirão sábado"
          }
          value={text}
        />

        <div>
          <h3 className="text-sm font-medium">Pré-visualização</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {validRecords.length} válidos de {preview.length} linhas. Apenas
            linhas válidas serão importadas.
          </p>
        </div>

        <div className="max-h-64 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="p-2">Status</th>
                <th className="p-2">Assistido</th>
                <th className="p-2">Tipo de Apoio</th>
                <th className="p-2">Observação</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((record) => (
                <tr
                  className="border-t border-zinc-200 dark:border-zinc-800"
                  key={record.lineNumber}
                >
                  <td
                    className={`p-2 font-medium ${
                      record.valid
                        ? record.warning
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-green-700 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {record.status}
                    {record.warning && (
                      <span className="block font-normal">{record.warning}</span>
                    )}
                  </td>
                  <td className="p-2">{record.beneficiaryName || "—"}</td>
                  <td className="p-2">{record.type || "—"}</td>
                  <td className="p-2">{record.description || "—"}</td>
                </tr>
              ))}
              {preview.length === 0 && (
                <tr>
                  <td
                    className="p-4 text-center text-zinc-500 dark:text-zinc-400"
                    colSpan={4}
                  >
                    As linhas importadas aparecerão aqui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <Button
            disabled={loading || validRecords.length === 0}
            onClick={importAttendances}
            type="button"
          >
            {loading
              ? "Importando..."
              : `Importar ${validRecords.length} Atendimentos`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
