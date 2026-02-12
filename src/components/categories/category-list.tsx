"use client";

import { useState } from "react";
import type { Category } from "@/types/category";
import { getCategoryOwnership } from "@/types/category";
import { deleteCategoryAction } from "@/actions/category.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

function CategoryCard({
  category,
  isGlobal = false,
  isEditing = false,
  onEdit,
  onDone,
}: CategoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {category.icon}
        </div>
        <div>
          <p className="font-medium text-gray-900">{category.name}</p>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {isGlobal && (
              <span className="text-xs text-gray-400">Global</span>
            )}
          </div>
        </div>
      </div>

      {!isGlobal && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            🗑️
          </Button>
        </div>
      )}

      {deleteError && (
        <p className="mt-2 text-xs text-red-600">{deleteError}</p>
      )}
    </Card>
  );
}
