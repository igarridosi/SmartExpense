"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  BarChart3,
  ChartLine,
  CircleDollarSign,
  FileSpreadsheet,
  Tags,
  Settings,
  Wallet,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Insights", href: "/insights", icon: ChartLine },
  { name: "Gastos", href: "/expenses", icon: CircleDollarSign },
  { name: "Importar CSV", href: "/expenses/import", icon: FileSpreadsheet },
  { name: "Categorías", href: "/categories", icon: Tags },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6">
        <Wallet className="h-5 w-5 text-zinc-500" aria-hidden="true" />
        <span className="text-lg font-bold text-zinc-900">SmartExpense</span>
      </div>
      <nav className="mt-4 space-y-1 px-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-100 text-zinc-900 font-medium"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <Icon className="h-4.5 w-4.5 text-zinc-500" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
