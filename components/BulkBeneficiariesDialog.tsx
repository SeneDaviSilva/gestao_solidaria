"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { createBeneficiariesBulk } from "@/services/beneficiaries";
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
  contact: string | null;
  category: string | null;
};

type ParsedBeneficiary = {
  lineNumber: number;
  name: string;
  contact: string;
  category: string;
  valid: boolean;
  warning?: string;
};

type DialogTab = "import" | "export";

const exampleText = [
  "Maria da Silva | 11988887777 | Cesta Básica",
  "João Pereira | 11977776666 | Saúde e Medicamentos",
  "Ana Costa | | Cobertores e Agasalhos",
].join("\n");

function normalizeCategory(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function BulkBeneficiariesDialog({
  beneficiaries,
  supportTypes,
}: {
  beneficiaries: BeneficiaryOption[];
  supportTypes: SupportType[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<DialogTab>("import");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const preview = useMemo<ParsedBeneficiary[]>(() => {
    const typeByName = new Map(
      supportTypes.map((supportType) => [
        normalizeCategory(supportType.name),
        supportType.name,
      ]),
    );
    const fallbackCategory =
      typeByName.get("geral") ?? typeByName.get("outros") ?? "";

    return text.split(/\r?\n/).flatMap((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) {
        return [];
      }

      const [rawName = "", rawContact = "", ...categoryParts] =
        line.split("|");
      const name = rawName.trim();
      const contact = rawContact.replace(/\D/g, "").slice(0, 11);
      const requestedCategory = categoryParts.join("|").trim();
      const matchedCategory = typeByName.get(
        normalizeCategory(requestedCategory),
      );
      const category = matchedCategory ?? fallbackCategory;

      return [
        {
          lineNumber: index + 1,
          name,
          contact,
          category,
          valid: Boolean(name && category),
          warning: matchedCategory
            ? undefined
            : fallbackCategory
              ? `Categoria ajustada para ${fallbackCategory}.`
              : "Categoria não encontrada e não há Geral ou Outros cadastrados.",
        },
      ];
    });
  }, [supportTypes, text]);

  const validRecords = preview.filter((record) => record.valid);
  const exportText = useMemo(
    () =>
      beneficiaries
        .map(
          (person) =>
            `${person.name} | ${person.contact ?? ""} | ${person.category ?? ""}`,
        )
        .join("\n"),
    [beneficiaries],
  );

  async function importBeneficiaries() {
    if (validRecords.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const result = await createBeneficiariesBulk(
        validRecords.map(({ name, contact, category }) => ({
          name,
          contact,
          category,
        })),
      );

      if (!result.success) {
        toast.error("Não foi possível importar os assistidos.", {
          description: result.error,
        });
        return;
      }

      toast.success(`${result.count} assistidos importados com sucesso.`);
      setOpen(false);
      setText("");
      router.refresh();
    } catch (error) {
      toast.error("Não foi possível importar os assistidos.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function copyExportText() {
    try {
      await navigator.clipboard.writeText(exportText);
      toast.success("Lista de assistidos copiada.");
    } catch (error) {
      toast.error("Não foi possível copiar a lista.", {
        description:
          error instanceof Error ? error.message : "Verifique a permissão do navegador.",
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setTab("import");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="border-zinc-200 dark:border-zinc-700" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Importar em Massa
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar / Exportar Assistidos</DialogTitle>
          <DialogDescription>
            Use uma linha por pessoa no formato Nome | WhatsApp | Categoria.
          </DialogDescription>
        </DialogHeader>

        <div
          aria-label="Importar ou exportar texto"
          className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
          role="tablist"
        >
          <button
            aria-selected={tab === "import"}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab === "import"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
            onClick={() => setTab("import")}
            role="tab"
            type="button"
          >
            Importar Texto
          </button>
          <button
            aria-selected={tab === "export"}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab === "export"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
            onClick={() => setTab("export")}
            role="tab"
            type="button"
          >
            Exportar Texto
          </button>
        </div>

        {tab === "import" ? (
          <div className="space-y-4" role="tabpanel">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Lista para importar</p>
              <Button
                onClick={() => setText(exampleText)}
                size="sm"
                type="button"
                variant="outline"
              >
                Colar Exemplo
              </Button>
            </div>
            <textarea
              aria-label="Assistidos para importar"
              className="min-h-36 w-full resize-y rounded-md border border-zinc-200 bg-background p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-700"
              onChange={(event) => setText(event.target.value)}
              placeholder={"Nome | WhatsApp | Categoria\nEx: Maria da Silva | 11999999999 | Cesta Básica"}
              value={text}
            />
            <div>
              <h3 className="text-sm font-medium">Pré-visualização</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {validRecords.length} registros válidos de {preview.length} linhas.
              </p>
              {preview.some((record) => record.warning) && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Categorias não reconhecidas serão substituídas por Geral ou
                  Outros, conforme disponível.
                </p>
              )}
            </div>
            <div className="max-h-56 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="p-2">Status</th>
                    <th className="p-2">Nome</th>
                    <th className="p-2">WhatsApp</th>
                    <th className="p-2">Categoria</th>
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
                        {record.valid ? "Válido" : "Inválido"}
                        {record.warning && (
                          <span className="block font-normal">
                            {record.warning}
                          </span>
                        )}
                      </td>
                      <td className="p-2">{record.name || "—"}</td>
                      <td className="p-2">{record.contact || "—"}</td>
                      <td className="p-2">{record.category || "—"}</td>
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
                onClick={importBeneficiaries}
                type="button"
              >
                {loading
                  ? "Importando..."
                  : `Importar ${validRecords.length} Assistidos`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3" role="tabpanel">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Lista atual de assistidos no formato Nome | Contato | Categoria.
            </p>
            <textarea
              aria-label="Lista de assistidos para exportar"
              className="min-h-64 w-full resize-y rounded-md border border-zinc-200 bg-background p-3 font-mono text-sm outline-none dark:border-zinc-700"
              readOnly
              value={exportText}
            />
            <div className="flex justify-end">
              <Button onClick={copyExportText} type="button" variant="outline">
                Copiar Lista
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
