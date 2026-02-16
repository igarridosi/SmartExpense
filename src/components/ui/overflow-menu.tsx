"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MoreVertical, type LucideIcon } from "lucide-react";

interface OverflowAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface OverflowMenuProps {
  ariaLabel: string;
  actions: OverflowAction[];
}

export function OverflowMenu({ ariaLabel, actions }: OverflowMenuProps) {
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
        className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id={menuId}
          className="absolute right-0 z-30 mt-1 w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg"
          role="menu"
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
                className={`focus-ring flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
                  action.destructive
                    ? "text-zinc-700 hover:bg-zinc-100"
                    : "text-zinc-700 hover:bg-zinc-100"
                } disabled:cursor-not-allowed disabled:opacity-50`}
                role="menuitem"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
