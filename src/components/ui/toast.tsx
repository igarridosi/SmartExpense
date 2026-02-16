"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

/**
 * Toast notification system.
 * Provider wraps the app, useToast() hook triggers notifications.
 */

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  addToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-zinc-300 bg-zinc-100 text-zinc-800",
    info: "border-zinc-300 bg-zinc-100 text-zinc-800",
  };

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
  };
  const Icon = icons[toast.type];

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg animate-in slide-in-from-right ${styles[toast.type]}`}
      role="alert"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{toast.message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 opacity-60 hover:opacity-100"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
