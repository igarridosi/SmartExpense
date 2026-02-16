"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Error page for expenses section.
 */

export default function ExpensesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500" aria-hidden="true" />
      <h2 className="text-xl font-bold text-gray-900">
        Error al cargar los gastos
      </h2>
      <p className="text-sm text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Reintentar
      </button>
    </div>
  );
}
