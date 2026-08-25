"use client";

import * as React from "react";
import { Plus, ShieldCheck, Check, X, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Pilula } from "@/components/selo-territorio";
import { PainelFormulario } from "@/components/cadastros/painel-formulario";
import { CampoTextoLongo, CampoSelecao } from "@/components/cadastros/campos";
import { criarSolicitacao, decidirSolicitacao } from "@/lib/acoes/governanca";
import { formatarData } from "@/lib/utils";
import type { TomPilula } from "@/lib/dominio";

const TIPOS_SOLICITACAO: Record<string, string> = {
  aprovacao_produto: "Aprovação de produto",
  autorizacao_parceiro_produto: "Autorização parceiro × produto",
  area_preferencial: "Área preferencial",
  excecao_preco: "Exceção de preço",
  excecao_comissao: "Exceção de comissão",
  liberacao_material: "Liberação de material",
  criacao_oportunidade_fora_area: "Oportunidade fora da área",
  alteracao_parametro_contrato: "Alteração de contrato",
  cancelamento_area: "Cancelamento de área",
  liberacao_visibilidade_portfolio: "Visibilidade à GovTech",
  outro: "Outro",
};

const STATUS_SOLICITACAO: Record<string, string> = {
  solicitada: "Solicitada",
  em_analise: "Em análise",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  cancelada: "Cancelada",
  devolvida_para_ajuste: "Devolvida para ajuste",
};

const TOM_SOLICITACAO: Record<string, TomPilula> = {
  solicitada: "alerta",
  em_analise: "info",
  aprovada: "sucesso",
  rejeitada: "erro",
  cancelada: "neutro",
  devolvida_para_ajuste: "alerta",
};

export type SolicitacaoLinha = {
  id: string;
  tipo_solicitacao: string;
  descricao: string | null;
  status: string;
  data_solicitacao: string;
  data_decisao: string | null;
  motivo_decisao: string | null;
  profiles: { nome: string | null } | null;
};

export function AprovacoesCliente({ solicitacoes }: { solicitacoes: SolicitacaoLinha[] }) {
  const [novaAberta, setNovaAberta] = React.useState(false);
  const [detalhe, setDetalhe] = React.useState<SolicitacaoLinha | null>(null);
  const [motivo, setMotivo] = React.useState("");
  const [decidindo, startDecisao] = React.useTransition();

  const decidir = (decisao: "aprovada" | "rejeitada" | "devolvida_para_ajuste") => {
    if (!detalhe) return;
    startDecisao(async () => {
      const r = await decidirSolicitacao(detalhe.id, decisao, motivo || undefined);
      if (r.ok) {
        toast.success(`Solicitação ${STATUS_SOLICITACAO[decisao].toLowerCase()}.`);
        setDetalhe(null);
        setMotivo("");
      } else toast.error(r.erro ?? "Não foi possível decidir.");
    });
  };

  const pendentes = solicitacoes.filter((s) =>
    ["solicitada", "em_analise"].includes(s.status)
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {pendentes > 0
            ? `${pendentes} solicitação(ões) aguardando decisão da Governança.`
            : "Nenhuma solicitação pendente."}
        </p>
        <Button onClick={() => setNovaAberta(true)}>
          <Plus className="size-4" />
          Nova solicitação
        </Button>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <ShieldCheck className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhuma solicitação registrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Exceções de preço, liberações de material e outras decisões da
            Governança passam por aqui.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Solicitante</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitacoes.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setDetalhe(s)}>
                  <TableCell>
                    <span className="font-medium">
                      {TIPOS_SOLICITACAO[s.tipo_solicitacao] ?? s.tipo_solicitacao}
                    </span>
                    {s.descricao && (
                      <span className="block max-w-96 truncate text-xs text-muted-foreground">
                        {s.descricao}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {s.profiles?.nome ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {formatarData(s.data_solicitacao?.slice(0, 10))}
                  </TableCell>
                  <TableCell>
                    <Pilula tom={TOM_SOLICITACAO[s.status] ?? "neutro"}>
                      {STATUS_SOLICITACAO[s.status] ?? s.status}
                    </Pilula>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!detalhe} onOpenChange={(a) => !a && setDetalhe(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {detalhe && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {TIPOS_SOLICITACAO[detalhe.tipo_solicitacao] ?? detalhe.tipo_solicitacao}
                </SheetTitle>
                <SheetDescription>
                  Solicitada por {detalhe.profiles?.nome ?? "—"} em{" "}
                  {formatarData(detalhe.data_solicitacao?.slice(0, 10))}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4 pb-6">
                <Pilula tom={TOM_SOLICITACAO[detalhe.status] ?? "neutro"}>
                  {STATUS_SOLICITACAO[detalhe.status] ?? detalhe.status}
                </Pilula>

                {detalhe.descricao && <p className="text-sm">{detalhe.descricao}</p>}
                {detalhe.motivo_decisao && (
                  <p className="rounded-lg bg-muted px-3 py-2.5 text-sm">
                    <span className="font-medium">Decisão:</span> {detalhe.motivo_decisao}
                  </p>
                )}

                {["solicitada", "em_analise"].includes(detalhe.status) && (
                  <>
                    <Separator />
                    <div className="space-y-1.5">
                      <Label htmlFor="motivo-decisao">Motivo da decisão (opcional)</Label>
                      <Textarea
                        id="motivo-decisao"
                        rows={3}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Justificativa que ficará registrada…"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" disabled={decidindo} onClick={() => decidir("aprovada")}>
                        <Check className="size-4" />
                        Aprovar
                      </Button>
                      <Button variant="destructive" className="flex-1" disabled={decidindo} onClick={() => decidir("rejeitada")}>
                        <X className="size-4" />
                        Rejeitar
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full" disabled={decidindo} onClick={() => decidir("devolvida_para_ajuste")}>
                      <Undo2 className="size-4" />
                      Devolver para ajuste
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <PainelFormulario
        aberto={novaAberta}
        aoFechar={() => setNovaAberta(false)}
        titulo="Nova solicitação"
        descricao="Pedidos que dependem de decisão da DoisGe (Governança)."
        acao={criarSolicitacao}
      >
        <CampoSelecao rotulo="Tipo" nome="tipo_solicitacao" obrigatorio opcoes={TIPOS_SOLICITACAO} valorInicial="excecao_preco" />
        <CampoTextoLongo rotulo="Descrição" nome="descricao" placeholder="Explique o que está sendo solicitado e por quê…" />
      </PainelFormulario>
    </div>
  );
}
