"use client";

import { useRouter } from "next/navigation";
import { RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  TrashAttendance,
  TrashBeneficiary,
  TrashItems,
  TrashSupportType,
} from "@/services/trash";
import {
  emptyTrash,
  permanentDeleteTrashItem,
  restoreTrashItem,
} from "@/services/trash";

function formatDeletedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : date.toLocaleString("pt-BR");
}

export function TrashClient({ initialTrash }: { initialTrash: TrashItems }) {
  const router = useRouter();
  const total =
    initialTrash.beneficiaries.length +
    initialTrash.attendances.length +
    initialTrash.supportTypes.length;

  async function restore(
    type: "beneficiary" | "attendance" | "support_type",
    id: string,
  ) {
    const result = await restoreTrashItem(type, id);
    if (!result.success) {
      toast.error("Não foi possível restaurar o item.", {
        description: result.error,
      });
      return;
    }
    toast.success("Item restaurado.");
    router.refresh();
  }

  async function permanentDelete(
    type: "beneficiary" | "attendance" | "support_type",
    id: string,
  ) {
    if (!window.confirm("Excluir este item definitivamente? Esta ação não pode ser desfeita.")) {
      return;
    }
    const result = await permanentDeleteTrashItem(type, id);
    if (!result.success) {
      toast.error("Não foi possível excluir o item.", {
        description: result.error,
      });
      return;
    }
    toast.success("Item excluído definitivamente.");
    router.refresh();
  }

  async function clearTrash() {
    if (
      !window.confirm(
        "Esvaziar toda a lixeira? Todos os itens serão apagados definitivamente.",
      )
    ) {
      return;
    }
    const result = await emptyTrash();
    if (!result.success) {
      toast.error("Não foi possível esvaziar a lixeira.", {
        description: result.error,
      });
      return;
    }
    toast.success("Lixeira esvaziada.");
    router.refresh();
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lixeira</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {total} {total === 1 ? "item" : "itens"} na lixeira
          </p>
        </div>
        <Button
          className="bg-red-600 text-white hover:bg-red-700"
          disabled={total === 0}
          onClick={() => void clearTrash()}
          type="button"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Esvaziar Lixeira
        </Button>
      </div>

      <TrashSection
        items={initialTrash.beneficiaries}
        title="Assistidos"
        renderItem={(item: TrashBeneficiary) => (
          <TrashItemCard
            actions={
              <>
                <Button
                  onClick={() => void restore("beneficiary", item.id)}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Restaurar
                </Button>
                <Button
                  className="text-red-600"
                  onClick={() =>
                    void permanentDelete("beneficiary", item.id)
                  }
                  size="sm"
                  variant="ghost"
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Excluir de vez
                </Button>
              </>
            }
            deletedAt={item.deleted_at}
            key={item.id}
            subtitle={item.category || "Sem categoria"}
            title={item.name}
          />
        )}
      />

      <TrashSection
        items={initialTrash.attendances}
        title="Atendimentos"
        renderItem={(item: TrashAttendance) => {
          const beneficiary = Array.isArray(item.beneficiaries)
            ? item.beneficiaries[0]
            : item.beneficiaries;
          return (
            <TrashItemCard
              actions={
                <>
                  <Button
                    onClick={() => void restore("attendance", item.id)}
                    size="sm"
                    variant="outline"
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Restaurar
                  </Button>
                  <Button
                    className="text-red-600"
                    onClick={() => void permanentDelete("attendance", item.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Excluir de vez
                  </Button>
                </>
              }
              deletedAt={item.deleted_at}
              key={item.id}
              subtitle={`${beneficiary?.name || "Não identificado"} · ${item.type}`}
              title={new Date(item.date).toLocaleDateString("pt-BR")}
            />
          );
        }}
      />

      <TrashSection
        items={initialTrash.supportTypes}
        title="Tipos de Apoio"
        renderItem={(item: TrashSupportType) => (
          <TrashItemCard
            actions={
              <>
                <Button
                  onClick={() => void restore("support_type", item.id)}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Restaurar
                </Button>
                <Button
                  className="text-red-600"
                  onClick={() => void permanentDelete("support_type", item.id)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Excluir de vez
                </Button>
              </>
            }
            deletedAt={item.deleted_at}
            key={item.id}
            subtitle="Tipo de apoio"
            title={item.name}
          />
        )}
      />
    </div>
  );
}

function TrashSection<T>({
  title,
  items,
  renderItem,
}: {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nenhum item nesta seção.
          </p>
        ) : (
          items.map(renderItem)
        )}
      </CardContent>
    </Card>
  );
}

function TrashItemCard({
  title,
  subtitle,
  deletedAt,
  actions,
}: {
  title: string;
  subtitle: string;
  deletedAt: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Excluído em {formatDeletedAt(deletedAt)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}
