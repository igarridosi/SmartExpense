import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "./auth-button";
import { MobileNav } from "./mobile-nav";

export async function Topbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.display_name || user?.email || "Usuario";

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      {/* Mobile: hamburger + logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <MobileNav />
        <span className="text-xl">💰</span>
        <span className="text-lg font-bold text-gray-900">SmartExpense</span>
      </div>

      {/* Spacer for desktop (sidebar handles logo) */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-gray-600 sm:inline">
          Hola, <span className="font-medium text-gray-900">{displayName}</span>
        </span>
        <AuthButton />
      </div>
    </header>
  );
}
