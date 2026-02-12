"use client";

import { useActionState, useEffect } from "react";
import {
  updateProfileAction,
  updateBaseCurrencyAction,
  type SettingsActionState,
} from "@/actions/settings.actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/constants";

interface SettingsFormsProps {
  displayName: string;
  baseCurrency: string;
}

const initialState: SettingsActionState = {};

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              Perfil actualizado correctamente
            </div>
          )}

          <Input
            id="display_name"
            name="display_name"
            label="Nombre"
            defaultValue={displayName}
            required
            error={state.fieldErrors?.display_name?.[0]}
          />

          <Button type="submit" isLoading={isPending}>
            Guardar nombre
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CurrencyForm({ baseCurrency }: { baseCurrency: string }) {
  const [state, formAction, isPending] = useActionState(
    updateBaseCurrencyAction,
    initialState
  );

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.symbol} ${c.code} — ${c.name}`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moneda base</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              Moneda base actualizada correctamente
            </div>
          )}

          <p className="text-sm text-gray-500">
            Los totales del dashboard y las conversiones se mostrarán en esta
            moneda. Los gastos existentes no se reconvertirán automáticamente.
          </p>

          <Select
            id="base_currency"
            name="base_currency"
            label="Moneda base"
            options={currencyOptions}
            defaultValue={baseCurrency}
            error={state.fieldErrors?.base_currency?.[0]}
          />

          <Button type="submit" isLoading={isPending}>
            Guardar moneda
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SettingsForms({
  displayName,
  baseCurrency,
}: SettingsFormsProps) {
  return (
    <div className="space-y-6">
      <ProfileForm displayName={displayName} />
      <CurrencyForm baseCurrency={baseCurrency} />
    </div>
  );
}
