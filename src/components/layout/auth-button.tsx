"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { signOut } from "@/actions/auth.actions";
import { LogOut, Settings, UserCircle2 } from "lucide-react";

export function AuthButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="focus-ring inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Abrir menú de usuario"
      >
        <UserCircle2 className="h-4 w-4 text-zinc-500" aria-hidden="true" />
        <span className="hidden sm:inline">Perfil</span>
      </button>

      {isOpen && (
        <div
          id={menuId}
          className="absolute right-0 z-30 mt-1 w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg"
          role="menu"
        >
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="focus-ring flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            role="menuitem"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Configuración
          </Link>

          <form action={signOut} role="none">
            <button
              type="submit"
              className="focus-ring flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
