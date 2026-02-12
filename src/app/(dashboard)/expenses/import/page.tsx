import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CsvImportForm } from "@/components/expenses/csv-import-form";

export const metadata: Metadata = {
  title: "Importar CSV",
};

export default async function ImportPage() {
  const supabase = await createClient();

  // Get user's base currency for default assignment
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("base_currency")
    .eq("id", user!.id)
    .single();

  const baseCurrency = profile?.base_currency ?? "USD";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar CSV</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sube un archivo CSV con tus gastos. Los datos inválidos serán
          corregidos automáticamente.
        </p>
      </div>

      <CsvImportForm baseCurrency={baseCurrency} />
    </div>
  );
}
