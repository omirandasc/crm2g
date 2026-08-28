"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { excluirEmpresa } from "@/lib/acoes/cadastros";

export function ExcluirGovTech({ empresaId, nome }: { empresaId: string; nome: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = React.useState(false);
  const [excluindo, startExclusao] = React.useTransition();

  const excluir = () =>
    startExclusao(async () => {
      const r = await excluirEmpresa(empresaId);
      if (r.ok) {
        toast.success(`GovTech "${nome}" excluída.`);
        router.push("/portfolio");
      } else {
        toast.error(r.erro ?? "Não foi possível excluir.");
        setConfirmando(false);
      }
    });

  if (!confirmando) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-erro hover:bg-erro/10 hover:text-erro"
        onClick={() => setConfirmando(true)}
      >
        <Trash2 className="size-3.5" />
        Excluir
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-erro/40 bg-erro/5 px-2.5 py-1.5">
      <span className="text-xs font-medium text-erro">
        Excluir "{nome}" de vez? Não dá para desfazer.
      </span>
      <Button variant="destructive" size="sm" disabled={excluindo} onClick={excluir}>
        {excluindo ? "Excluindo…" : "Sim, excluir"}
      </Button>
      <Button variant="ghost" size="icon-sm" disabled={excluindo} onClick={() => setConfirmando(false)}>
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
