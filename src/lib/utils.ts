import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarMoeda(valor: number | null | undefined) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarNumero(valor: number | null | undefined) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR");
}

export function formatarData(data: string | null | undefined) {
  if (!data) return "—";
  return new Date(data + (data.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR");
}
