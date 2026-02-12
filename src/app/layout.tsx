import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SmartExpense - Finanzas Personales",
    template: "%s | SmartExpense",
  },
  description:
    "Gestiona tus gastos personales de forma inteligente. Registra gastos, importa CSV, visualiza estadísticas y controla múltiples monedas.",
  keywords: ["finanzas personales", "gastos", "presupuesto", "expense tracker"],
  authors: [{ name: "SmartExpense" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
