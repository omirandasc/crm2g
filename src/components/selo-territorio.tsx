import { cn } from "@/lib/utils";
import type { StatusTerritorio } from "@/lib/dominio";

const ESTILOS: Record<StatusTerritorio, { rotulo: string; classes: string }> = {
  livre: { rotulo: "Livre", classes: "bg-livre-fundo text-livre" },
  preferencial: { rotulo: "Preferencial", classes: "bg-preferencial-fundo text-preferencial" },
  exclusiva: { rotulo: "Exclusiva", classes: "bg-exclusiva-fundo text-exclusiva" },
};

/** Selo de status territorial — a linguagem visual central do CRM. */
export function SeloTerritorio({
  status,
  className,
}: {
  status: StatusTerritorio;
  className?: string;
}) {
  const { rotulo, classes } = ESTILOS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        classes,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {rotulo}
    </span>
  );
}

/** Pílula de status genérica para os demais vocabulários do sistema. */
export function Pilula({
  tom = "neutro",
  children,
}: {
  tom?: "neutro" | "sucesso" | "alerta" | "erro" | "info";
  children: React.ReactNode;
}) {
  const tons = {
    neutro: "bg-livre-fundo text-livre",
    sucesso: "bg-sucesso-fundo text-sucesso",
    alerta: "bg-alerta-fundo text-alerta",
    erro: "bg-erro-fundo text-erro",
    info: "bg-exclusiva-fundo text-exclusiva",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tons[tom]
      )}
    >
      {children}
    </span>
  );
}
