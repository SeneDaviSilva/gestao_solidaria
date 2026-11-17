"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAttendance } from "@/app/attendances/actions";
import { createSupportType, type SupportType } from "@/services/supportTypes";
import { sortSupportTypes } from "@/utils/supportTypes";

type BeneficiaryOption = { id: string; name: string };

export function AddAttendanceDialog({
  beneficiaries,
  supportTypes: initialSupportTypes,
}: {
  beneficiaries: BeneficiaryOption[];
  supportTypes: SupportType[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [beneficiaryId, setBeneficiaryId] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [addedSupportTypes, setAddedSupportTypes] = useState<SupportType[]>([]);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [addingType, setAddingType] = useState(false);
  const router = useRouter();

  const supportTypes = sortSupportTypes([
    ...initialSupportTypes,
    ...addedSupportTypes.filter(
      ({ id }) => !initialSupportTypes.some((supportType) => supportType.id === id),
    ),
  ]);

  async function addSupportType() {
    setAddingType(true);

    try {
      const result = await createSupportType(newTypeName);
      if (!result.success || !result.data) {
        toast.error("Não foi possível adicionar o tipo de apoio.", {
          description: result.error,
        });
        return;
      }

      const createdType = result.data;
      setAddedSupportTypes((current) => [
        ...current.filter(({ id }) => id !== createdType.id),
        createdType,
      ]);
      setType(createdType.name);
      setNewTypeName("");
      setShowNewTypeForm(false);
      toast.success("Tipo de apoio adicionado.", {
        description: `${createdType.name} foi selecionado.`,
      });
      router.refresh();
    } catch (error) {
      toast.error("Não foi possível adicionar o tipo de apoio.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setAddingType(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const description = formData.get("description");

    if (!beneficiaryId || !type) {
      toast.error("Selecione o assistido e o tipo de apoio.");
      return;
    }

    setLoading(true);

    try {
      const result = await createAttendance({
        beneficiary_id: beneficiaryId,
        type,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
      });

      if (!result.success) {
        toast.error("Falha ao registrar o atendimento.", {
          description: result.error,
        });
        return;
      }

      toast.success("Atendimento registrado", {
        description: "Entrega salva com sucesso.",
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Falha ao registrar o atendimento.", {
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
        if (!nextOpen) {
          setBeneficiaryId(null);
          setType(null);
          setShowNewTypeForm(false);
          setNewTypeName("");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="bg-zinc-900 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
            <HeartHandshake className="mr-2 h-4 w-4" />
            Registrar Atendimento
          </Button>
        }
      />
      <DialogContent className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Atendimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="beneficiary_id">Assistido</Label>
            <Select
              id="beneficiary_id"
              name="beneficiary_id"
              required
              value={beneficiaryId}
              onValueChange={(value) =>
                setBeneficiaryId(typeof value === "string" ? value : null)
              }
            >
              <SelectTrigger className="w-full border-zinc-200 dark:border-zinc-700">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {beneficiaries.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="type">Tipo de Apoio</Label>
              <Button
                className="h-auto px-1 py-0 text-xs"
                onClick={() => setShowNewTypeForm((shown) => !shown)}
                type="button"
                variant="ghost"
              >
                + Novo tipo
              </Button>
            </div>
            {showNewTypeForm && (
              <div className="flex gap-2">
                <Input
                  aria-label="Nome do novo tipo de apoio"
                  autoFocus
                  className="border-zinc-200 dark:border-zinc-700"
                  onChange={(event) => setNewTypeName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void addSupportType();
                    }
                  }}
                  placeholder="Nome do tipo"
                  value={newTypeName}
                />
                <Button
                  disabled={addingType}
                  onClick={() => void addSupportType()}
                  type="button"
                  variant="outline"
                >
                  {addingType ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            )}
            <Select
              id="type"
              name="type"
              required
              value={type}
              onValueChange={(value) =>
                setType(typeof value === "string" ? value : null)
              }
            >
              <SelectTrigger className="w-full border-zinc-200 dark:border-zinc-700">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {supportTypes.map((supportType) => (
                  <SelectItem key={supportType.id} value={supportType.name}>
                    {supportType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Observações adicionais (Opcional)</Label>
            <Input
              className="border-zinc-200 dark:border-zinc-700"
              id="description"
              name="description"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              disabled={loading}
              type="submit"
            >
              {loading ? "Salvando..." : "Confirmar Entrega"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}