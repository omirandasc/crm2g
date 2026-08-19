import type { Metadata } from "next";
import { Archivo, Public_Sans, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["500", "600", "700"],
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-spline-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "CRM DOISGE", template: "%s · CRM DOISGE" },
  description: "Governança comercial B2G — Portfólio, Rede e Territórios",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${archivo.variable} ${publicSans.variable} ${splineMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
