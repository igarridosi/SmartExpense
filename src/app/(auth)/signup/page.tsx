"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const initialState: AuthActionState = {};

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <Card>
      <CardHeader>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">SmartExpense</h1>
          <p className="mt-1 text-sm text-gray-500">Crea tu cuenta</p>
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
            id="displayName"
            name="displayName"
            type="text"
            label="Nombre"
            placeholder="Tu nombre"
            required
            autoComplete="name"
            error={state.fieldErrors?.displayName?.[0]}
          />

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
            placeholder="Mínimo 6 caracteres"
            required
            autoComplete="new-password"
            error={state.fieldErrors?.password?.[0]}
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            required
            autoComplete="new-password"
            error={state.fieldErrors?.confirmPassword?.[0]}
          />

          <Button type="submit" className="w-full" isLoading={isPending}>
            Crear cuenta
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-700 hover:text-zinc-900"
          >
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
