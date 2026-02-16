"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Error Boundary — catches rendering errors in child components.
 * Provides a fallback UI with retry capability.
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              Algo salió mal
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              {this.state.error?.message || "Error inesperado"}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
