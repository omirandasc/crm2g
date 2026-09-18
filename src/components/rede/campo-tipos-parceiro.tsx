"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TIPOS_PARCEIRO, DESCRICOES_TIPOS_PARCEIRO } from "@/lib/dominio";

/** Um parceiro pode acumular mais de um tipo; envia a lista em CSV. */
export function CampoTiposParceiro({ valorInicial }: { valorInicial?: string[] | null }) {
  const [selecionados, setSelecionados] = React.useState<string[]>(
    (valorInicial ?? []).filter((t) => t in TIPOS_PARCEIRO)
  );

  const alternar = (tipo: string) =>
    setSelecionados((atual) =>
      atual.includes(tipo) ? atual.filter((t) => t !== tipo) : [...atual, tipo]
    );

  return (
    <div className="space-y-1.5">
      <Label>
        Tipo de parceiro <span className="text-erro">*</span>
      </Label>
      <input type="hidden" name="tipos_parceiro" value={selecionados.join(",")} />
      <div className="grid gap-2">
        {Object.entries(TIPOS_PARCEIRO).map(([tipo, rotulo]) => {
          const ativo = selecionados.includes(tipo);
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => alternar(tipo)}
              aria-pressed={ativo}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                ativo
                  ? "border-marca-600 bg-marca-50 dark:bg-marca-950/40"
                  : "border-border hover:border-marca-600/50"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded border",
                  ativo ? "border-marca-600 bg-marca-600 text-white" : "border-input"
                )}
              >
                {ativo && <Check className="size-3" />}
              </span>
              <span>
                <span className="block text-sm font-medium">{rotulo}</span>
                <span className="block text-xs text-muted-foreground">
                  {DESCRICOES_TIPOS_PARCEIRO[tipo]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {selecionados.length === 0
          ? "Marque ao menos um tipo — o parceiro pode ter mais de um."
          : `${selecionados.length} tipo(s) marcado(s).`}
      </p>
    </div>
  );
}
