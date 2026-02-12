import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="mt-4 text-lg text-gray-600">Página no encontrada</p>
      <Link href="/dashboard" className="mt-6">
        <Button variant="primary">Volver al Dashboard</Button>
      </Link>
    </div>
  );
}
