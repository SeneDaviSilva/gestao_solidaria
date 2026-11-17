"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { createBeneficiary } from "@/app/beneficiaries/actions";
import { createSupportType, type SupportType } from "@/services/supportTypes";
import { sortSupportTypes } from "@/utils/supportTypes";

export function AddBeneficiaryDialog({
  supportTypes: initialSupportTypes,
}: {
  supportTypes: SupportType[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [addedSupportTypes, setAddedSupportTypes] = useState<SupportType[]>([]);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [addingType, setAddingType] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
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
      setCategory(createdType.name);
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
    const name = formData.get("name");
    const contact = formData.get("contact");

    if (typeof name !== "string" || !name.trim() || !category) {
      toast.error("Preencha o nome e selecione uma categoria.");
      return;
    }

    setLoading(true);

    try {
      const result = await createBeneficiary({
        name: name.trim(),
        contact:
          typeof contact === "string" && contact.trim()
            ? contact.trim()
            : null,
        category,
      });

      if (!result.success) {
        toast.error("Não foi possível cadastrar o assistido.", {
          description: result.error,
        });
        return;
      }

      toast.success("Cadastro concluído", {
        description: "O assistido foi registrado com sucesso.",
      });
      formRef.current?.reset();
      setCategory(null);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Não foi possível cadastrar o assistido.", {
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
          formRef.current?.reset();
          setCategory(null);
          setShowNewTypeForm(false);
          setNewTypeName("");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="bg-zinc-900 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cadastro
          </Button>
        }
      />
      <DialogContent className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Assistido</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              className="border-zinc-200 dark:border-zinc-700"
              id="name"
              name="name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contato (WhatsApp)</Label>
            <Input
              className="border-zinc-200 dark:border-zinc-700"
              id="contact"
              inputMode="numeric"
              maxLength={11}
              name="contact"
              onChange={(event) => {
                event.currentTarget.value = event.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 11);
              }}
              onPaste={(event) => {
                event.preventDefault();
                const input = event.currentTarget;
                const start = input.selectionStart ?? input.value.length;
                const end = input.selectionEnd ?? input.value.length;
                const pastedText = event.clipboardData
                  .getData("text")
                  .replace(/\D/g, "");
                input.value = `${input.value.slice(0, start)}${pastedText}${input.value.slice(end)}`
                  .replace(/\D/g, "")
                  .slice(0, 11);
              }}
              placeholder="Ex: 11999999999"
              type="tel"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="category">Categoria de Apoio</Label>
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
              id="category"
              name="category"
              required
              value={category}
              onValueChange={(value) =>
                setCategory(typeof value === "string" ? value : null)
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
          <div className="flex justify-end pt-4">
            <Button
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              disabled={loading}
              type="submit"
            >
              {loading ? "Salvando..." : "Salvar Cadastro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
