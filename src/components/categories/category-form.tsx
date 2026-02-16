"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryActionState,
} from "@/actions/category.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/category";
import { CategoryIcon } from "@/components/ui/category-icon";

const ICON_OPTIONS = [
  "utensils", "car", "home", "movie", "health", "education", "utilities", "package",
  "shopping", "travel", "gaming", "clothing", "pets", "gifts", "work", "fitness",
];

const COLOR_OPTIONS = [
  { value: "#EF4444", swatchClass: "bg-red-500" },
  { value: "#F59E0B", swatchClass: "bg-amber-500" },
  { value: "#3B82F6", swatchClass: "bg-blue-500" },
  { value: "#8B5CF6", swatchClass: "bg-violet-500" },
  { value: "#10B981", swatchClass: "bg-emerald-500" },
  { value: "#6366F1", swatchClass: "bg-indigo-500" },
  { value: "#F97316", swatchClass: "bg-orange-500" },
  { value: "#6B7280", swatchClass: "bg-zinc-500" },
  { value: "#EC4899", swatchClass: "bg-pink-500" },
  { value: "#14B8A6", swatchClass: "bg-teal-500" },
  { value: "#84CC16", swatchClass: "bg-lime-500" },
  { value: "#F43F5E", swatchClass: "bg-rose-500" },
];

function normalizeHexColor(value: string): string {
  return value.trim().toUpperCase();
}

interface CategoryFormProps {
  /** If provided, we're editing; otherwise creating */
  category?: Category;
  /** Called after a successful save to close the form */
  onDone?: () => void;
}

const initialState: CategoryActionState = {};

export function CategoryForm({ category, onDone }: CategoryFormProps) {
  const isEditing = !!category;
  const action = isEditing ? updateCategoryAction : createCategoryAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [selectedIcon, setSelectedIcon] = useState(category?.icon ?? "package");
  const [selectedColor, setSelectedColor] = useState(
    normalizeHexColor(category?.color ?? "#6B7280")
  );
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  // Reset form and call onDone when the action succeeds
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone?.();
    }
  }, [state.success, onDone]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {/* Hidden ID for edit mode */}
      {isEditing && <input type="hidden" name="id" value={category.id} />}

      {state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <Input
        id="name"
        name="name"
        label="Nombre"
        placeholder="Ej: Gimnasio"
        defaultValue={category?.name ?? ""}
        required
        error={state.fieldErrors?.name?.[0]}
      />

      {/* Icon picker */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Ícono
        </label>
        <input type="hidden" name="icon" value={selectedIcon} />

        <p className="text-xs font-medium text-gray-600">Selecciona un icono:</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Seleccionar ícono">
          {ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              type="button"
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-zinc-600 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 data-[selected=true]:border-zinc-500 data-[selected=true]:bg-zinc-100"
              data-selected={selectedIcon === icon ? "true" : undefined}
              onClick={() => setSelectedIcon(icon)}
              aria-label={`Icono ${icon}`}
            >
              <CategoryIcon icon={icon} className="h-5 w-5" />
            </button>
          ))}
        </div>
        {state.fieldErrors?.icon && (
          <p className="text-xs text-red-600">{state.fieldErrors.icon[0]}</p>
        )}
      </div>

      {/* Color picker */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Color
        </label>
        <input type="hidden" name="color" value={selectedColor} />
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Seleccionar color">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2 data-[selected=true]:ring-zinc-500 ${option.swatchClass}`}
              data-selected={selectedColor === normalizeHexColor(option.value) ? "true" : undefined}
              onClick={() => setSelectedColor(normalizeHexColor(option.value))}
              aria-label={`Color ${option.value}`}
            />
          ))}
          <div>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 font-bold text-xs"
              onClick={() => setShowCustomColorPicker((prev) => !prev)}
              aria-expanded={showCustomColorPicker ? "true" : "false"}
              aria-controls="custom-color-picker"
            >
              {showCustomColorPicker ? "Ocultar selector personalizado" : "Elegir color personalizado"}
            </Button>
          </div>
        </div>

        {showCustomColorPicker && (
          <div id="custom-color-picker" className="flex items-center gap-3 rounded-lg border mt-4 border-zinc-200 bg-zinc-50 px-3 py-2">
            <label htmlFor="custom-color-input" className="text-xs font-medium text-zinc-700">
              Color personalizado
            </label>
            <input
              id="custom-color-input"
              type="color"
              value={selectedColor}
              onChange={(event) =>
                setSelectedColor(normalizeHexColor(event.target.value))
              }
              className="h-8 w-10 cursor-pointer rounded border border-zinc-300 bg-white"
              aria-label="Selector de color personalizado"
            />
            <span className="text-xs font-medium text-zinc-600">{selectedColor}</span>
          </div>
        )}

        {state.fieldErrors?.color && (
          <p className="text-xs text-red-600">{state.fieldErrors.color[0]}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" isLoading={isPending}>
          {isEditing ? "Guardar cambios" : "Crear categoría"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
