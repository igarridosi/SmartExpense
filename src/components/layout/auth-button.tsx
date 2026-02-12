"use client";

import { signOut } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm">
        Cerrar sesión
      </Button>
    </form>
  );
}
