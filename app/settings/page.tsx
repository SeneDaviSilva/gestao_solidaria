"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

const themeChoices = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Escuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
] as const;

const helpItems = [
  {
    title: "Dashboard",
    description: "Acompanhe os totais de assistidos e atendimentos recentes.",
    href: "/",
  },
  {
    title: "Assistidos",
    description:
      "Cadastre pessoas, consulte seus contatos e acompanhe a categoria de apoio.",
    href: "/beneficiaries",
  },
  {
    title: "Atendimentos",
    description:
      "Registre entregas e serviços, filtre o histórico e consulte os detalhes.",
    href: "/attendances",
  },
  {
    title: "Tipos de Apoio",
    description:
      "Adicione categorias pelo botão “+ Novo tipo” nos formulários de assistidos e atendimentos.",
  },
  {
    title: "Exportação para Excel",
    description:
      "Use “Extrair para Planilha” para baixar em .xlsx os registros exibidos, respeitando os filtros aplicados.",
  },
];

const supportContacts = [
  { label: "Nome ou contato", value: "[SEU_NOME_OU_CONTATO]" },
  { label: "WhatsApp", value: "[SEU_WHATSAPP]" },
  { label: "E-mail", value: "[SEU_EMAIL]" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [supabase] = useState(() => createClient());
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingField, setSavingField] = useState<
    "name" | "email" | "password" | null
  >(null);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }
        if (!user) {
          setAccountError("Não foi possível encontrar uma sessão ativa.");
          return;
        }

        setFullName(
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : "",
        );
        setCurrentEmail(user.email ?? "");
        setNewEmail(user.email ?? "");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dados da conta.";
        setAccountError(message);
      } finally {
        if (active) {
          setAccountLoading(false);
        }
      }
    }

    void loadAccount();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function saveFullName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast.error("Informe seu nome completo.");
      return;
    }

    setSavingField("name");
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });
      if (error) {
        toast.error("Não foi possível atualizar o nome.", {
          description: error.message,
        });
        return;
      }

      setFullName(trimmedName);
      toast.success("Nome atualizado com sucesso.");
    } catch (error) {
      toast.error("Não foi possível atualizar o nome.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSavingField(null);
    }
  }

  async function saveEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      toast.error("Informe o novo e-mail.");
      return;
    }

    setSavingField("email");
    try {
      const { error } = await supabase.auth.updateUser({
        email: trimmedEmail,
      });
      if (error) {
        toast.error("Não foi possível solicitar a alteração do e-mail.", {
          description: error.message,
        });
        return;
      }

      toast.success("Solicitação de alteração de e-mail enviada.", {
        description:
          "Verifique sua caixa de entrada e confirme o novo endereço, se solicitado.",
      });
    } catch (error) {
      toast.error("Não foi possível solicitar a alteração do e-mail.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSavingField(null);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("A confirmação da senha não corresponde.");
      return;
    }

    setSavingField("password");
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        toast.error("Não foi possível atualizar a senha.", {
          description: error.message,
        });
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      toast.success("Senha atualizada com sucesso.");
    } catch (error) {
      toast.error("Não foi possível atualizar a senha.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSavingField(null);
    }
  }

  async function copyContact(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch (error) {
      toast.error("Não foi possível copiar o contato.", {
        description:
          error instanceof Error ? error.message : "Verifique a permissão do navegador.",
      });
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Gerencie a aparência, os dados da conta e encontre ajuda para usar o sistema.
        </p>
      </div>

      <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {themeChoices.map(({ value, label, Icon }) => {
              const selected = theme === value;
              return (
                <Button
                  aria-pressed={selected}
                  className={`h-auto min-h-20 flex-col gap-2 whitespace-normal ${
                    selected
                      ? "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                      : "border-zinc-200 dark:border-zinc-700"
                  }`}
                  key={value}
                  onClick={() => setTheme(value)}
                  type="button"
                  variant={selected ? "default" : "outline"}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle>Dados da Conta</CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {accountLoading
              ? "Carregando os dados da conta..."
              : currentEmail
                ? `E-mail atual: ${currentEmail}`
                : "Atualize seus dados de acesso."}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {accountError && (
            <p className="text-sm text-red-600" role="alert">
              {accountError}
            </p>
          )}

          <form className="space-y-3" onSubmit={saveFullName}>
            <div className="space-y-2">
              <Label htmlFor="full-name">Nome completo</Label>
              <Input
                autoComplete="name"
                className="border-zinc-200 dark:border-zinc-700"
                disabled={accountLoading || savingField !== null}
                id="full-name"
                onChange={(event) => setFullName(event.target.value)}
                required
                value={fullName}
              />
            </div>
            <Button disabled={accountLoading || savingField !== null} type="submit">
              {savingField === "name" ? "Salvando..." : "Salvar nome"}
            </Button>
          </form>

          <form className="space-y-3 border-t border-zinc-200 pt-5 dark:border-zinc-800" onSubmit={saveEmail}>
            <div className="space-y-2">
              <Label htmlFor="new-email">Novo e-mail</Label>
              <Input
                autoComplete="email"
                className="border-zinc-200 dark:border-zinc-700"
                disabled={accountLoading || savingField !== null}
                id="new-email"
                onChange={(event) => setNewEmail(event.target.value)}
                required
                type="email"
                value={newEmail}
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              A alteração pode exigir confirmação do novo endereço por e-mail.
            </p>
            <Button disabled={accountLoading || savingField !== null} type="submit">
              {savingField === "email" ? "Enviando..." : "Atualizar e-mail"}
            </Button>
          </form>

          <form className="space-y-3 border-t border-zinc-200 pt-5 dark:border-zinc-800" onSubmit={savePassword}>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                autoComplete="new-password"
                className="border-zinc-200 dark:border-zinc-700"
                disabled={accountLoading || savingField !== null}
                id="new-password"
                minLength={6}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                type="password"
                value={newPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                autoComplete="new-password"
                className="border-zinc-200 dark:border-zinc-700"
                disabled={accountLoading || savingField !== null}
                id="confirm-password"
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </div>
            <Button disabled={accountLoading || savingField !== null} type="submit">
              {savingField === "password" ? "Salvando..." : "Atualizar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle>Ajuda e Suporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-4">
            {helpItems.map(({ title, description, href }) => (
              <li key={title}>
                <h3 className="text-sm font-medium">{title}</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {description}
                  {href && (
                    <>
                      {" "}
                      <Link
                        className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                        href={href}
                      >
                        Abrir módulo
                      </Link>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>

          <div className="space-y-4 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <div>
              <h3 className="font-medium">Contato para Dúvidas / Suporte Técnico</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Substitua os campos entre colchetes pelos seus dados de contato.
              </p>
            </div>
            <div className="space-y-2">
              {supportContacts.map(({ label, value }) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                  key={label}
                >
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {label}
                    </p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                  <Button
                    onClick={() => void copyContact(label, value)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Copiar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
