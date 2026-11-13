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

export function AddBeneficiaryDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

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
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="bg-zinc-900 text-white transition-colors hover:bg-zinc-800">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cadastro
          </Button>
        }
      />
      <DialogContent className="border-zinc-200 bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Assistido</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              className="border-zinc-200"
              id="name"
              name="name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contato (WhatsApp)</Label>
            <Input
              className="border-zinc-200"
              id="contact"
              name="contact"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria de Apoio</Label>
            <Select
              id="category"
              name="category"
              required
              value={category}
              onValueChange={(value) =>
                setCategory(typeof value === "string" ? value : null)
              }
            >
              <SelectTrigger className="w-full border-zinc-200">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cesta Básica">Cesta Básica</SelectItem>
                <SelectItem value="Apoio Educacional">
                  Apoio Educacional
                </SelectItem>
                <SelectItem value="Saúde">Saúde</SelectItem>
                <SelectItem value="Geral">Geral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              className="bg-zinc-900 text-white hover:bg-zinc-800"
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
