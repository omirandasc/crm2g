"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { ResultadoAcao } from "@/lib/acoes/cadastros";

/** Painel lateral com formulário — padrão único de criação/edição dos cadastros. */
export function PainelFormulario({
  aberto,
  aoFechar,
  titulo,
  descricao,
  acao,
  idRegistro,
  children,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: string;
  acao: (prev: ResultadoAcao, formData: FormData) => Promise<ResultadoAcao>;
  idRegistro?: string | null;
  children: React.ReactNode;
}) {
  const [estado, enviar, pendente] = useActionState<ResultadoAcao, FormData>(acao, {});
  const ultimoMomento = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (estado.momento && estado.momento !== ultimoMomento.current) {
      ultimoMomento.current = estado.momento;
      if (estado.ok) {
        toast.success("Salvo com sucesso!");
        aoFechar();
      }
    }
  }, [estado, aoFechar]);

  return (
    <Sheet open={aberto} onOpenChange={(a) => !a && aoFechar()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <form action={enviar} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{titulo}</SheetTitle>
            {descricao && <SheetDescription>{descricao}</SheetDescription>}
          </SheetHeader>

          <div className="flex-1 space-y-4 px-4 pb-4">
            {idRegistro && <input type="hidden" name="id" value={idRegistro} />}
            {children}

            {estado.erro && (
              <p role="alert" className="rounded-lg bg-erro-fundo text-erro text-sm px-3 py-2.5">
                {estado.erro}
              </p>
            )}
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Salvando…" : "Salvar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
