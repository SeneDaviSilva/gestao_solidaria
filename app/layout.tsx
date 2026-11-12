import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { LayoutDashboard, Users, HeartHandshake } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { LogoutButton } from "@/components/LogoutButton";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestão Solidária",
  description: "Sistema de gerenciamento para ONG comunitária",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#fafafa] text-zinc-900 antialiased flex min-h-screen`}>
        <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-zinc-100">
            <span className="font-semibold tracking-tight text-lg">Gestão Solidária</span>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <Link className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-zinc-100 transition-colors" href="/">
              <LayoutDashboard className="w-4 h-4 text-zinc-500"/>
              Dashboard
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-zinc-100 transition-colors" href="/beneficiaries">
              <Users className="w-4 h-4 text-zinc-500"/>
              Assistidos
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-zinc-100 transition-colors" href="/attendances">
              <HeartHandshake className="w-4 h-4 text-zinc-500"/>
              Atendimentos
            </Link>
          </nav>
          <div className="p-4 border-t border-zinc-100">
            <LogoutButton/>
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-8">
            {children}
          </div>
        </main>
        
        <Toaster/>
      </body>
    </html>
  );
}