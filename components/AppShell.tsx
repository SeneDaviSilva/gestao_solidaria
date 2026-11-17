"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartHandshake,
  LayoutDashboard,
  Menu,
  Users,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

const navigation = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/beneficiaries", label: "Assistidos", Icon: Users },
  { href: "/attendances", label: "Atendimentos", Icon: HeartHandshake },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-zinc-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-zinc-100 px-6">
          <span className="text-lg font-semibold tracking-tight">
            Gestão Solidária
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map(({ href, label, Icon }) => (
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100"
              href={href}
              key={href}
            >
              <Icon className="h-4 w-4 text-zinc-500" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-100 p-4">
          <LogoutButton />
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
        <span className="text-lg font-semibold tracking-tight">
          Gestão Solidária
        </span>
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-zinc-100"
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
          <aside className="fixed inset-x-0 bottom-0 top-16 z-50 flex w-4/5 max-w-xs flex-col border-r border-zinc-200 bg-white md:hidden">
            <nav className="flex-1 space-y-1 p-4">
              {navigation.map(({ href, label, Icon }) => (
                <Link
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100"
                  href={href}
                  key={href}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="h-4 w-4 text-zinc-500" />
                  {label}
                </Link>
              ))}
            </nav>
            <div
              className="border-t border-zinc-100 p-4"
              onClick={() => setMenuOpen(false)}
            >
              <LogoutButton />
            </div>
          </aside>
        </>
      )}

      <main className="w-full max-w-full overflow-x-hidden p-4 pt-20 md:ml-64 md:w-[calc(100%-16rem)] md:p-8">
        {children}
      </main>
    </div>
  );
}
