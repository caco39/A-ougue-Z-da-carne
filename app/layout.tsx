import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Distribuidora Dona Budega - PDV & Gestão",
  description: "Sistema integrado de Ponto de Venda (PDV), controle de estoque, clientes e contas a pagar para a Distribuidora Dona Budega.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="font-sans antialiased bg-stone-950 text-stone-100 h-full selection:bg-rose-900 selection:text-rose-100">
        {children}
      </body>
    </html>
  );
}
