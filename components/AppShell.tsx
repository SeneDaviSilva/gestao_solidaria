"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HeartHandshake,
  LayoutDashboard,
  Menu,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { LogoutButton } from "@/components/LogoutButton";
import { createClient } from "@/utils/supabase/client";

const navigation = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/beneficiaries", label: "Assistidos", Icon: Users },
  { href: "/attendances", label: "Atendimentos", Icon: HeartHandshake },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUserLabel, setCurrentUserLabel] = useState("");
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    function getUserLabel(user: {
      email?: string;
      user_metadata?: Record<string, unknown>;
    }) {
      const fullName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";
      return fullName || user.email || "Usuário não identificado";
    }

    async function loadCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      activeUserIdRef.current = user?.id ?? null;
      setCurrentUserLabel(user ? getUserLabel(user) : "");
    }

    void loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED"
      ) {
        return;
      }

      const user = session?.user ?? null;
      const previousUserId = activeUserIdRef.current;
      const nextUserId = user?.id ?? null;

      if (previousUserId && nextUserId && previousUserId !== nextUserId) {
        toast.info("Conta alterada em outra aba. Tela atualizada.");
      }

      activeUserIdRef.current = nextUserId;
      setCurrentUserLabel(user ? getUserLabel(user) : "");
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex">
        <div className="flex h-16 items-center border-b border-zinc-100 px-6 dark:border-zinc-800">
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Gestão Solidária
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map(({ href, label, Icon }) => (
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              href={href}
              key={href}
            >
              <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-zinc-100 p-4 dark:border-zinc-800">
          {currentUserLabel && (
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
              <UserCircle className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
              <span className="truncate">{currentUserLabel}</span>
            </div>
          )}
          <SettingsLink active={pathname === "/settings"} />
          <LogoutButton />
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
        <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Gestão Solidária
        </span>
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {menuOpen && (
        <>
          <button
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMenuOpen(false)}
            type="button"
          />
          <aside className="fixed inset-x-0 bottom-0 top-16 z-50 flex w-4/5 max-w-xs flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
            <nav className="flex-1 space-y-1 p-4">
              {navigation.map(({ href, label, Icon }) => (
                <Link
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  href={href}
                  key={href}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                  {label}
                </Link>
              ))}
            </nav>
            <div
              className="space-y-1 border-t border-zinc-100 p-4 dark:border-zinc-800"
              onClick={() => setMenuOpen(false)}
            >
              {currentUserLabel && (
                <div className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <UserCircle className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                  <span className="truncate">{currentUserLabel}</span>
                </div>
              )}
              <SettingsLink
                active={pathname === "/settings"}
                onClick={() => setMenuOpen(false)}
              />
              <LogoutButton />
            </div>
          </aside>
        </>
      )}

      <main className="w-full max-w-full overflow-x-hidden p-4 pt-20 text-zinc-900 dark:text-zinc-100 md:ml-64 md:w-[calc(100%-16rem)] md:p-8">
        {children}
      </main>
    </div>
  );
}

function SettingsLink({
  active,
  onClick,
}: {
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
      href="/settings"
      onClick={onClick}
    >
      <Settings className="h-4 w-4" />
      Configurações
    </Link>
  );
}
