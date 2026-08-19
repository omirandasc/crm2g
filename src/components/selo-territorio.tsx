import { cn } from "@/lib/utils";
import type { StatusTerritorio } from "@/lib/dominio";

/* Etiquetas sólidas no estilo monday.com:
   Exclusiva = verde (fechado), Preferencial = laranja (em trabalho), Livre = cinza. */
const ESTILOS: Record<StatusTerritorio, { rotulo: string; classes: string }> = {
  livre: { rotulo: "Livre", classes: "bg-livre text-white" },
  preferencial: { rotulo: "Preferencial", classes: "bg-preferencial text-white" },
  exclusiva: { rotulo: "Exclusiva", classes: "bg-exclusiva text-white" },
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
        "inline-flex min-w-24 items-center justify-center rounded-[5px] px-2.5 py-0.5 text-xs font-medium",
        classes,
        className
      )}
    >
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
    neutro: "bg-livre-fundo text-tinta-suave",
    sucesso: "bg-sucesso-fundo text-sucesso",
    alerta: "bg-alerta-fundo text-alerta",
    erro: "bg-erro-fundo text-erro",
    info: "bg-marca-50 text-marca-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5px] px-2.5 py-0.5 text-xs font-medium",
        tons[tom]
      )}
    >
      {children}
    </span>
  );
}
