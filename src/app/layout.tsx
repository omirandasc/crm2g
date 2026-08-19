import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProvedorTema } from "@/components/provedor-tema";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: { default: "CRM DOISGE", template: "%s · CRM DOISGE" },
  description: "Governança comercial B2G — Portfólio, Rede e Territórios",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${poppins.variable} ${geistMono.variable} font-sans`}>
        <ProvedorTema>{children}</ProvedorTema>
      </body>
    </html>
  );
}
