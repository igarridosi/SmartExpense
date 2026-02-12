import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import * as categoryService from "@/services/category.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";

export const metadata: Metadata = {
  title: "Categorías",
};

export default async function CategoriesPage() {
  const supabase = await createClient();
  const categories = await categoryService.getCategories(supabase);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>

      {/* Create new category form */}
      <Card>
        <CardHeader>
          <CardTitle>Nueva categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>

      {/* Category list */}
      <CategoryList categories={categories} />
    </div>
  );
}
