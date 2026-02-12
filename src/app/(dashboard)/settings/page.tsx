import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsForms } from "@/components/settings/settings-forms";

export const metadata: Metadata = {
  title: "Configuración",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, base_currency")
    .eq("id", user!.id)
    .single();

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    "";
  const baseCurrency = profile?.base_currency || "USD";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
      <div className="max-w-lg">
        <SettingsForms
          displayName={displayName}
          baseCurrency={baseCurrency}
        />
      </div>
    </div>
  );
}
