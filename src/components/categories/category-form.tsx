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

const EMOJI_OPTIONS = [
  "🍔", "🚗", "🏠", "🎬", "💊", "📚", "💡", "📦",
  "🛒", "✈️", "🎮", "👕", "🐾", "🎁", "💼", "🏋️",
];

const COLOR_OPTIONS = [
  "#EF4444", "#F59E0B", "#3B82F6", "#8B5CF6",
  "#10B981", "#6366F1", "#F97316", "#6B7280",
  "#EC4899", "#14B8A6", "#84CC16", "#F43F5E",
];

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
  const [selectedEmoji, setSelectedEmoji] = useState(category?.icon ?? "📦");
  const [selectedColor, setSelectedColor] = useState(category?.color ?? "#6B7280");
  const [customEmoji, setCustomEmoji] = useState("");

  const formRef = useRef<HTMLFormElement>(null);

  // Reset form and call onDone when the action succeeds
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setSelectedEmoji(category?.icon ?? "📦");
      setSelectedColor(category?.color ?? "#6B7280");
      setCustomEmoji("");
      onDone?.();
    }
  }, [state.success, onDone, category?.icon, category?.color]);

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

      {/* Emoji picker */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Ícono
        </label>
        <input type="hidden" name="icon" value={selectedEmoji} />

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label htmlFor="custom-emoji" className="mb-2 block text-xs font-medium text-gray-600">
            Emoji personalizado
          </label>
          <div className="flex items-center gap-2">
            <input
              id="custom-emoji"
              type="text"
              value={customEmoji}
              onChange={(event) => {
                const value = event.target.value;
                setCustomEmoji(value);
                if (value.trim()) {
                  setSelectedEmoji(value.trim().slice(0, 10));
                }
              }}
              placeholder="😎"
              maxLength={10}
              className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-center text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-gray-500">
              Escribe cualquier emoji o símbolo (ej: 🧠, 🐶, 🎧)
            </p>
          </div>
        </div>

        <p className="text-xs font-medium text-gray-600">O usa uno rápido:</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Seleccionar ícono">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rounded-lg border border-gray-200 p-2 text-xl transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 data-[selected=true]:border-blue-500 data-[selected=true]:bg-blue-50"
              data-selected={selectedEmoji === emoji ? "true" : undefined}
              onClick={() => {
                setSelectedEmoji(emoji);
                setCustomEmoji("");
              }}
            >
              {emoji}
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
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500/20 data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2 data-[selected=true]:ring-blue-500"
              style={{ backgroundColor: color }}
              data-selected={selectedColor === color ? "true" : undefined}
              onClick={() => setSelectedColor(color)}
              aria-label={`Color ${color}`}
            />
          ))}
        </div>
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
