"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Check,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { FullBackupButton } from "@/components/FullBackupButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrganizationSettings } from "@/services/settings";
import {
  createSupportType,
  deleteSupportType,
  updateSupportType,
} from "@/services/supportTypes";
import { createClient } from "@/utils/supabase/client";
import { sortSupportTypes } from "@/utils/supportTypes";

type SupportTypeOption = {
  id: string;
  name: string;
};

const compactTablesEvent = "compact-tables-preference-change";

function getCompactTablesPreference() {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem("gestao-solidaria-compact") === "true"
  );
}

function subscribeToCompactTablesPreference(onChange: () => void) {
  window.addEventListener(compactTablesEvent, onChange);
  return () => window.removeEventListener(compactTablesEvent, onChange);
}

function getServerCompactTablesPreference() {
  return false;
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

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
      "Adicione, renomeie ou remova tipos nesta página. “Outros” fica protegido contra exclusão.",
  },
  {
    title: "Exportação para Excel",
    description:
      "Exporte os registros exibidos com o nome, CNPJ e cidade da ONG no cabeçalho.",
  },
  {
    title: "Backup Geral",
    description:
      "Baixe todos os assistidos e atendimentos em um arquivo .xlsx com duas abas.",
  },
  {
    title: "Modo Compacto",
    description:
      "Ative a opção em Aparência para reduzir o espaçamento das tabelas neste navegador.",
  },
];

const supportContacts = [
  { label: "E-mail", value: "davisenepj888@gmail.com" },
  { label: "WhatsApp", value: "11 94102-8828" },
  
];

export function SettingsClient({
  initialSupportTypes,
  initialOrgSettings,
}: {
  initialSupportTypes: SupportTypeOption[];
  initialOrgSettings: {
    org_name: string;
    cnpj: string;
    city: string;
  };
}) {
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
  const [orgName, setOrgName] = useState(initialOrgSettings.org_name);
  const [orgCnpj, setOrgCnpj] = useState(
    formatCnpj(initialOrgSettings.cnpj),
  );
  const [orgCity, setOrgCity] = useState(initialOrgSettings.city);
  const [organizationSaving, setOrganizationSaving] = useState(false);
  const [supportTypes, setSupportTypes] =
    useState<SupportTypeOption[]>(initialSupportTypes);
  const [newSupportType, setNewSupportType] = useState("");
  const [editingSupportId, setEditingSupportId] = useState<string | null>(null);
  const [editingSupportName, setEditingSupportName] = useState("");
  const [savingSupportId, setSavingSupportId] = useState<string | null>(null);
  const compactTables = useSyncExternalStore(
    subscribeToCompactTablesPreference,
    getCompactTablesPreference,
    getServerCompactTablesPreference,
  );

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

  function setCompactTablesPreference(enabled: boolean) {
    window.localStorage.setItem("gestao-solidaria-compact", String(enabled));
    document.documentElement.classList.toggle("compact-tables", enabled);
    window.dispatchEvent(new Event(compactTablesEvent));
  }

  async function saveOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrganizationSaving(true);
    try {
      const result = await updateOrganizationSettings({
        org_name: orgName,
        cnpj: orgCnpj,
        city: orgCity,
      });
      if (!result.success) {
        toast.error("Não foi possível salvar a identidade da ONG.");
        return;
      }
      toast.success("Identidade da ONG salva com sucesso.");
    } catch (error) {
      toast.error("Não foi possível salvar a identidade da ONG.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setOrganizationSaving(false);
    }
  }

  async function addSupportType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newSupportType.trim();
    if (!name) {
      toast.error("Informe o nome do tipo de apoio.");
      return;
    }

    setSavingSupportId("new");
    try {
      const result = await createSupportType(name);
      if (!result.success || !result.data) {
        toast.error("Não foi possível adicionar o tipo de apoio.", {
          description: result.error,
        });
        return;
      }

      const createdType = result.data;
      setSupportTypes((current) =>
        sortSupportTypes([...current, createdType]),
      );
      setNewSupportType("");
      toast.success("Tipo de apoio adicionado.");
    } catch (error) {
      toast.error("Não foi possível adicionar o tipo de apoio.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSavingSupportId(null);
    }
  }

  async function saveSupportType(id: string) {
    setSavingSupportId(id);
    try {
      const result = await updateSupportType(id, editingSupportName);
      if (!result.success) {
        toast.error("Não foi possível atualizar o tipo de apoio.", {
          description: result.error,
        });
        return;
      }

      setSupportTypes((current) =>
        sortSupportTypes(
          current.map((type) =>
            type.id === id ? { ...type, name: editingSupportName.trim() } : type,
          ),
        ),
      );
      setEditingSupportId(null);
      setEditingSupportName("");
      toast.success("Tipo de apoio atualizado.");
    } catch (error) {
      toast.error("Não foi possível atualizar o tipo de apoio.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSavingSupportId(null);
    }
  }

  async function removeSupportType(type: SupportTypeOption) {
    if (!window.confirm(`Excluir o tipo de apoio "${type.name}"?`)) {
      return;
    }

    setSavingSupportId(type.id);
    try {
      const result = await deleteSupportType(type.id);
      if (!result.success) {
        toast.error("Não foi possível excluir o tipo de apoio.", {
          description: result.error,
        });
        return;
      }

      setSupportTypes((current) => current.filter((item) => item.id !== type.id));
      toast.success("Tipo de apoio excluído.");
    } catch (error) {
      toast.error("Não foi possível excluir o tipo de apoio.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSavingSupportId(null);
    }
  }

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
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <div>
              <Label className="font-medium" htmlFor="compact-tables">
                Modo Compacto nas Tabelas
              </Label>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Reduz o espaçamento e o tamanho do texto para exibir mais linhas.
              </p>
            </div>
            <input
              aria-label="Ativar modo compacto nas tabelas"
              checked={compactTables}
              className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
              id="compact-tables"
              onChange={(event) =>
                setCompactTablesPreference(event.target.checked)
              }
              type="checkbox"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle>Identidade da ONG nos Relatórios</CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Esses dados aparecem no cabeçalho das planilhas exportadas.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveOrganization}>
            <div className="space-y-2">
              <Label htmlFor="organization-name">Nome da Instituição</Label>
              <Input
                className="border-zinc-200 dark:border-zinc-700"
                disabled={organizationSaving}
                id="organization-name"
                onChange={(event) => setOrgName(event.target.value)}
                placeholder="Ex: Associação Comunitária"
                value={orgName}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organization-cnpj">CNPJ</Label>
                <Input
                  className="border-zinc-200 dark:border-zinc-700"
                  disabled={organizationSaving}
                  id="organization-cnpj"
                  inputMode="numeric"
                  maxLength={18}
                  onChange={(event) => setOrgCnpj(formatCnpj(event.target.value))}
                  placeholder="00.000.000/0000-00"
                  value={orgCnpj}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization-city">Cidade / UF</Label>
                <Input
                  className="border-zinc-200 dark:border-zinc-700"
                  disabled={organizationSaving}
                  id="organization-city"
                  onChange={(event) => setOrgCity(event.target.value)}
                  placeholder="Ex: São Paulo - SP"
                  value={orgCity}
                />
              </div>
            </div>
            <Button
              disabled={organizationSaving}
              type="submit"
            >
              {organizationSaving ? "Salvando..." : "Salvar identidade"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle>Gerenciar Tipos de Apoio</CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Adicione, renomeie ou remova opções usadas nos cadastros.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={addSupportType}
          >
            <Input
              aria-label="Novo tipo de apoio"
              className="border-zinc-200 dark:border-zinc-700"
              disabled={savingSupportId !== null}
              onChange={(event) => setNewSupportType(event.target.value)}
              placeholder="Nome do novo tipo"
              value={newSupportType}
            />
            <Button
              disabled={savingSupportId !== null || !newSupportType.trim()}
              type="submit"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </form>
          {supportTypes.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Nenhum tipo de apoio cadastrado.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {supportTypes.map((type) => {
                const isOther =
                  type.name.trim().toLocaleLowerCase("pt-BR") === "outros";
                const isEditing = editingSupportId === type.id;
                return (
                  <li
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                    key={type.id}
                  >
                    {isEditing && !isOther ? (
                      <Input
                        aria-label={`Renomear ${type.name}`}
                        autoFocus
                        className="min-w-40 flex-1 border-zinc-200 dark:border-zinc-700"
                        disabled={savingSupportId === type.id}
                        onChange={(event) =>
                          setEditingSupportName(event.target.value)
                        }
                        value={editingSupportName}
                      />
                    ) : (
                      <span className="text-sm font-medium">{type.name}</span>
                    )}
                    <div className="flex items-center gap-1">
                      {isOther ? (
                        <>
                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            Padrão
                          </span>
                          <Button
                            aria-label="Editar tipo padrão"
                            disabled
                            size="icon"
                            title="Este tipo padrão não pode ser editado."
                            type="button"
                            variant="ghost"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            aria-label="Excluir tipo padrão"
                            disabled
                            size="icon"
                            title="Este tipo padrão não pode ser excluído."
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : isEditing ? (
                        <>
                          <Button
                            aria-label="Salvar tipo de apoio"
                            disabled={
                              savingSupportId === type.id ||
                              !editingSupportName.trim()
                            }
                            onClick={() => void saveSupportType(type.id)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            aria-label="Cancelar edição"
                            onClick={() => {
                              setEditingSupportId(null);
                              setEditingSupportName("");
                            }}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            aria-label={`Editar ${type.name}`}
                            onClick={() => {
                              setEditingSupportId(type.id);
                              setEditingSupportName(type.name);
                            }}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            aria-label={`Excluir ${type.name}`}
                            className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                            disabled={savingSupportId === type.id}
                            onClick={() => void removeSupportType(type)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            A opção “Outros” não pode ser excluída.
          </p>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle>Backup Completo dos Dados</CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Baixe todos os assistidos e atendimentos em uma planilha com duas abas.
          </p>
        </CardHeader>
        <CardContent>
          <FullBackupButton />
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
