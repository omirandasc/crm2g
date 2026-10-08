"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pilula } from "@/components/selo-territorio";
import { decidirPrecoOportunidade } from "@/lib/acoes/comercial";
import { formatarMoeda, formatarData } from "@/lib/utils";

/**
 * Cartão da oportunidade travada por preço abaixo da tabela: mostra quem já
 * aprovou (DoisGe e GovTech) e deixa quem tem alçada decidir aqui mesmo.
 */
export function AprovacaoPreco({
  oportunidadeId,
  status,
  valorTabela,
  valorVenda,
  doisgeEm,
  govtechEm,
  motivoRecusa,
  podeDoisge,
  podeGovtech,
}: {
  oportunidadeId: string;
  status: string;
  valorTabela: number | null;
  valorVenda: number | null;
  doisgeEm: string | null;
  govtechEm: string | null;
  motivoRecusa: string | null;
  podeDoisge: boolean;
  podeGovtech: boolean;
}) {
  const router = useRouter();
  const [motivo, setMotivo] = React.useState("");
  const [decidindo, startDecisao] = React.useTransition();

  const decidir = (lado: "doisge" | "govtech", aprovar: boolean) =>
    startDecisao(async () => {
      const r = await decidirPrecoOportunidade(oportunidadeId, lado, aprovar, motivo || undefined);
      if (!r.ok) {
        toast.error(r.erro ?? "Não foi possível registrar a decisão.");
        return;
      }
      toast.success(
        r.resultado === "aprovado"
          ? "Preço aprovado pelos dois lados — a oportunidade foi destravada."
          : r.resultado === "recusado"
            ? "Preço recusado. O parceiro precisa ajustar o valor de venda."
            : "Aprovação registrada. Falta o outro lado para destravar."
      );
      setMotivo("");
      router.refresh();
    });

  const desconto =
    valorTabela && valorVenda ? Math.round((1 - valorVenda / valorTabela) * 1000) / 10 : null;

  const Lado = ({ nome, em, lado }: { nome: string; em: string | null; lado: "doisge" | "govtech" }) => {
    const pode = lado === "doisge" ? podeDoisge : podeGovtech;
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          {em ? (
            <Check className="size-4 text-sucesso" />
          ) : (
            <Clock className="size-4 text-muted-foreground" />
          )}
          <span className="font-medium">{nome}</span>
          <span className="text-xs text-muted-foreground">
            {em ? `aprovou em ${formatarData(em.slice(0, 10))}` : "aguardando"}
          </span>
        </div>
        {status === "pendente" && !em && pode && (
          <Button size="sm" disabled={decidindo} onClick={() => decidir(lado, true)}>
            <Check className="size-3.5" />
            Aprovar
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className={status === "pendente" ? "border-alerta/50" : status === "recusado" ? "border-erro/50" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-alerta" />
          Aprovação de preço
        </CardTitle>
        <CardDescription>
          Venda de {formatarMoeda(valorVenda)} com tabela de {formatarMoeda(valorTabela)}
          {desconto != null && desconto > 0 && ` (${desconto.toLocaleString("pt-BR")}% abaixo)`}.
          {status === "pendente" &&
            " A oportunidade não avança de etapa até a DoisGe e a GovTech aprovarem."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "aprovado" && <Pilula tom="sucesso">Aprovado pelos dois lados</Pilula>}
        {status === "recusado" && (
          <div className="space-y-1">
            <Pilula tom="erro">Recusado</Pilula>
            {motivoRecusa && <p className="text-sm text-muted-foreground">Motivo: {motivoRecusa}</p>}
            <p className="text-xs text-muted-foreground">
              Ajuste o valor de venda para a tabela (ou acima) e salve para destravar; um novo
              valor abaixo da tabela abre outro pedido de aprovação.
            </p>
          </div>
        )}

        <Lado nome="DoisGe" em={doisgeEm} lado="doisge" />
        <Lado nome="GovTech (dona do produto)" em={govtechEm} lado="govtech" />

        {status === "pendente" && (podeDoisge || podeGovtech) && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="motivo-preco">Motivo (opcional, fica registrado)</Label>
              <Textarea
                id="motivo-preco"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex.: desconto autorizado para primeiro contrato na região"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-erro hover:bg-erro/10 hover:text-erro"
              disabled={decidindo}
              onClick={() => decidir(podeDoisge ? "doisge" : "govtech", false)}
            >
              <X className="size-3.5" />
              Recusar o preço
            </Button>
          </>
        )}
        {status === "pendente" && !podeDoisge && !podeGovtech && (
          <p className="text-xs text-muted-foreground">
            A decisão é da DoisGe e da GovTech; você será avisado pela etapa da oportunidade.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
