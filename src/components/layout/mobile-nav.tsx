"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  BarChart3,
  ChartLine,
  CircleDollarSign,
  FileSpreadsheet,
  Menu,
  Settings,
  Tags,
  Wallet,
  X,
} from "lucide-react";

/**
 * Mobile-only hamburger menu + slide-out navigation drawer.
 * Visible only on screens < lg breakpoint.
 */

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Insights", href: "/insights", icon: ChartLine },
  { name: "Gastos", href: "/expenses", icon: CircleDollarSign },
  { name: "Importar CSV", href: "/expenses/import", icon: FileSpreadsheet },
  { name: "Categorías", href: "/categories", icon: Tags },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={toggle}
        className="focus-ring flex items-center justify-center rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
        aria-label="Abrir menú"
      >
        {isOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={close}
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-200 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
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
                onClick={close}
                className={cn(
                  "focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
      </div>
    </>
  );
}
