"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <Card>
      <CardHeader>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">SmartExpense</h1>
          <p className="mt-1 text-sm text-gray-500">
            Inicia sesión en tu cuenta
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {state.error}
            </div>
          )}

          <Input
            id="email"
            name="email"
            type="email"
            label="Correo electrónico"
            placeholder="tu@correo.com"
            required
            autoComplete="email"
            error={state.fieldErrors?.email?.[0]}
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Contraseña"
            placeholder="••••••"
            required
            autoComplete="current-password"
            error={state.fieldErrors?.password?.[0]}
          />

          <Button type="submit" className="w-full" isLoading={isPending}>
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          ¿No tienes cuenta?{" "}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Regístrate
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
