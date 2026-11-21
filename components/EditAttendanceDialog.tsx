"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupportType, type SupportType } from "@/services/supportTypes";
import { updateAttendance } from "@/services/attendances";
import { sortSupportTypes } from "@/utils/supportTypes";

type AttendanceToEdit = {
  id: string;
  beneficiary_id: string;
  type: string;
  description?: string | null;
};

type BeneficiaryOption = { id: string; name: string };

export function EditAttendanceDialog({
  attendance,
  beneficiaries,
  supportTypes: initialSupportTypes,
}: {
  attendance: AttendanceToEdit;
  beneficiaries: BeneficiaryOption[];
  supportTypes: SupportType[];
}) {
  const [open, setOpen] = useState(false);
  const [beneficiaryId, setBeneficiaryId] = useState(attendance.beneficiary_id);
  const [type, setType] = useState<string | null>(attendance.type);
  const [description, setDescription] = useState(attendance.description ?? "");
  const [addedSupportTypes, setAddedSupportTypes] = useState<SupportType[]>([]);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [addingType, setAddingType] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const supportTypes = sortSupportTypes([
    ...initialSupportTypes,
    ...addedSupportTypes.filter(
      ({ id }) =>
        !initialSupportTypes.some((supportType) => supportType.id === id),
    ),
  ]);

  async function addNewType() {
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
      setAddedSupportTypes((current) => [...current, createdType]);
      setType(createdType.name);
      setNewTypeName("");
      setShowNewTypeForm(false);
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
    if (!beneficiaryId || !type) {
      toast.error("Selecione o assistido e o tipo de apoio.");
      return;
    }

    setSaving(true);
    try {
      const result = await updateAttendance(attendance.id, {
        beneficiary_id: beneficiaryId,
        type,
        description,
      });
      if (!result.success) {
        toast.error("Não foi possível atualizar o atendimento.", {
          description: result.error,
        });
        return;
      }

      toast.success("Atendimento atualizado com sucesso");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Não foi possível atualizar o atendimento.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setBeneficiaryId(attendance.beneficiary_id);
          setType(attendance.type);
          setDescription(attendance.description ?? "");
          setShowNewTypeForm(false);
          setNewTypeName("");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            size="icon"
            title="Editar atendimento"
            type="button"
            variant="ghost"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Atendimento</DialogTitle>
        </DialogHeader>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor={`attendance-beneficiary-${attendance.id}`}>
              Assistido
            </Label>
            <Select
              id={`attendance-beneficiary-${attendance.id}`}
              required
              value={beneficiaryId}
              onValueChange={(value) =>
                setBeneficiaryId(typeof value === "string" ? value : "")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {beneficiaries.map((beneficiary) => (
                  <SelectItem key={beneficiary.id} value={beneficiary.id}>
                    {beneficiary.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`attendance-type-${attendance.id}`}>
                Tipo de Apoio
              </Label>
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
                  onChange={(event) => setNewTypeName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void addNewType();
                    }
                  }}
                  placeholder="Nome do tipo"
                  value={newTypeName}
                />
                <Button
                  disabled={addingType}
                  onClick={() => void addNewType()}
                  type="button"
                  variant="outline"
                >
                  {addingType ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            )}
            <Select
              id={`attendance-type-${attendance.id}`}
              required
              value={type}
              onValueChange={(value) =>
                setType(typeof value === "string" ? value : null)
              }
            >
              <SelectTrigger className="w-full">
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
            <Label htmlFor={`attendance-description-${attendance.id}`}>
              Observações
            </Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800"
              id={`attendance-description-${attendance.id}`}
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button disabled={saving} type="submit">
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
