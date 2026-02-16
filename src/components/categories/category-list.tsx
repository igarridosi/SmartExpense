"use client";

import { useState, type CSSProperties } from "react";
import type { Category } from "@/types/category";
import { getCategoryOwnership } from "@/types/category";
import { deleteCategoryAction } from "@/actions/category.actions";
import { Card } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { OverflowMenu } from "@/components/ui/overflow-menu";
import { CategoryForm } from "./category-form";

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const globalCategories = categories.filter(
    (c) => getCategoryOwnership(c) === "global"
  );
  const userCategories = categories.filter(
    (c) => getCategoryOwnership(c) === "user"
  );

  return (
    <div className="space-y-8">
      {/* User categories */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Mis categorías
        </h2>
        {userCategories.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no tienes categorías personalizadas.
          </p>
        ) : (
          <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {userCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isEditing={editingId === category.id}
                onEdit={() => setEditingId(category.id)}
                onDone={() => setEditingId(null)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Global categories */}
      <section>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Categorías globales
        </h2>
        <p className="mb-3 text-xs text-gray-500">
          Disponibles para todos los usuarios. No se pueden editar ni eliminar.
        </p>
        <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {globalCategories.map((category) => (
            <CategoryCard key={category.id} category={category} isGlobal />
          ))}
        </div>
      </section>
    </div>
  );
}

interface CategoryCardProps {
  category: Category;
  isGlobal?: boolean;
  isEditing?: boolean;
  onEdit?: () => void;
  onDone?: () => void;
}

function toRgba(hexColor: string, alpha: number) {
  const normalized = hexColor.trim();
  const isHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(normalized);

  if (!isHex) return `rgba(113, 113, 122, ${alpha})`;

  const raw = normalized.slice(1);
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;

  const red = Number.parseInt(full.slice(0, 2), 16);
  const green = Number.parseInt(full.slice(2, 4), 16);
  const blue = Number.parseInt(full.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function CategoryCard({
  category,
  isGlobal = false,
  isEditing = false,
  onEdit,
  onDone,
}: CategoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const cardStyle: CSSProperties = {
    borderColor: toRgba(category.color, 0.9),
    backgroundColor: toRgba(category.color, 0.09),
  };
  const iconStyle: CSSProperties = {
    borderColor: toRgba(category.color, 0.45),
    backgroundColor: toRgba(category.color, 0.18),
    color: category.color,
  };

  if (isEditing) {
    return (
      <Card className="p-4">
        <CategoryForm category={category} onDone={onDone} />
      </Card>
    );
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;

    setIsDeleting(true);
    setDeleteError(null);

    const formData = new FormData();
    formData.set("id", category.id);
    const result = await deleteCategoryAction(formData);

    if (result.error) {
      setDeleteError(result.error);
      setIsDeleting(false);
    }
  }

  return (
    <Card className="flex items-center justify-between p-4" style={cardStyle}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg border"
          style={iconStyle}
        >
          <CategoryIcon icon={category.icon} className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{category.name}</p>
          {isGlobal && <span className="text-xs text-gray-400">Global</span>}
        </div>
      </div>

      {!isGlobal && (
        <OverflowMenu
          ariaLabel="Acciones de categoría"
          actions={[
            {
              label: "Editar",
              icon: Pencil,
              onClick: () => onEdit?.(),
              disabled: isDeleting,
            },
            {
              label: "Eliminar",
              icon: Trash2,
              onClick: handleDelete,
              disabled: isDeleting,
            },
          ]}
        />
      )}

      {deleteError && (
        <p className="mt-2 text-xs text-red-600">{deleteError}</p>
      )}
    </Card>
  );
}
