"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

/**
 * Mobile-only hamburger menu + slide-out navigation drawer.
 * Visible only on screens < lg breakpoint.
 */

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Insights", href: "/insights", icon: "✨" },
  { name: "Gastos", href: "/expenses", icon: "💸" },
  { name: "Importar CSV", href: "/expenses/import", icon: "📄" },
  { name: "Categorías", href: "/categories", icon: "🏷️" },
  { name: "Configuración", href: "/settings", icon: "⚙️" },
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
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
            />
          )}
        </svg>
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
          <span className="text-xl">💰</span>
          <span className="text-lg font-bold text-zinc-900">SmartExpense</span>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {navigation.map((item) => {
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
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
