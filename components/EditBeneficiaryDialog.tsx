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
import { updateBeneficiary } from "@/services/beneficiaries";
import { sortSupportTypes } from "@/utils/supportTypes";

type BeneficiaryToEdit = {
  id: string;
  name: string;
  contact?: string | null;
  category: string;
};

export function EditBeneficiaryDialog({
  beneficiary,
  supportTypes: initialSupportTypes,
}: {
  beneficiary: BeneficiaryToEdit;
  supportTypes: SupportType[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(beneficiary.name);
  const [contact, setContact] = useState(beneficiary.contact ?? "");
  const [category, setCategory] = useState<string | null>(
    beneficiary.category || null,
  );
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
      setCategory(createdType.name);
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
    if (!name.trim() || !category) {
      toast.error("Preencha o nome e selecione uma categoria.");
      return;
    }

    setSaving(true);
    try {
      const result = await updateBeneficiary(beneficiary.id, {
        name,
        contact,
        category,
      });
      if (!result.success) {
        toast.error("Não foi possível atualizar o assistido.", {
          description: result.error,
        });
        return;
      }

      toast.success("Assistido atualizado com sucesso");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Não foi possível atualizar o assistido.", {
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
          setName(beneficiary.name);
          setContact(beneficiary.contact ?? "");
          setCategory(beneficiary.category || null);
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
            title="Editar assistido"
            type="button"
            variant="ghost"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Assistido</DialogTitle>
        </DialogHeader>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor={`beneficiary-name-${beneficiary.id}`}>Nome completo</Label>
            <Input
              id={`beneficiary-name-${beneficiary.id}`}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`beneficiary-contact-${beneficiary.id}`}>
              Contato (WhatsApp)
            </Label>
            <Input
              id={`beneficiary-contact-${beneficiary.id}`}
              inputMode="numeric"
              maxLength={11}
              onChange={(event) =>
                setContact(
                  event.target.value.replace(/\D/g, "").slice(0, 11),
                )
              }
              placeholder="Ex: 11999999999"
              type="tel"
              value={contact}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`beneficiary-category-${beneficiary.id}`}>
                Categoria de Apoio
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
              id={`beneficiary-category-${beneficiary.id}`}
              required
              value={category}
              onValueChange={(value) =>
                setCategory(typeof value === "string" ? value : null)
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
