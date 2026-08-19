"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ResultadoAcao } from "@/lib/acoes/cadastros";

/** Formulário inline (fora de painel) com submissão que preserva os campos. */
export function FormAcao({
  acao,
  rotuloEnviar = "Salvar",
  aoSalvar,
  limparAposSalvar,
  children,
  className,
}: {
  acao: (prev: ResultadoAcao, formData: FormData) => Promise<ResultadoAcao>;
  rotuloEnviar?: string;
  aoSalvar?: () => void;
  limparAposSalvar?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [estado, enviar, pendente] = useActionState<ResultadoAcao, FormData>(acao, {});
  const ultimoMomento = React.useRef<number | undefined>(undefined);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (estado.momento && estado.momento !== ultimoMomento.current) {
      ultimoMomento.current = estado.momento;
      if (estado.ok) {
        toast.success("Salvo com sucesso!");
        if (limparAposSalvar) formRef.current?.reset();
        aoSalvar?.();
      }
    }
  }, [estado, aoSalvar, limparAposSalvar]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        React.startTransition(() => enviar(dados));
      }}
      className={className}
    >
      {children}

      {estado.erro && (
        <p role="alert" className="mt-3 rounded-lg bg-erro-fundo text-erro text-sm px-3 py-2.5">
          {estado.erro}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : rotuloEnviar}
        </Button>
      </div>
    </form>
  );
}
