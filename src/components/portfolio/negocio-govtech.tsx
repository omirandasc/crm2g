"use client";

import * as React from "react";
import Link from "next/link";
import { Check, CircleDashed, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FormAcao } from "@/components/cadastros/form-acao";
import { CampoTexto, CampoSelecao } from "@/components/cadastros/campos";
import { cn } from "@/lib/utils";
import {
  FASES_GOVTECH,
  MODELOS_NEGOCIO_GOVTECH,
  STATUS_PROPOSTA_TRABALHO,
  STATUS_EMPRESA,
} from "@/lib/dominio";
import { salvarNegocioGovTech, atualizarFaseGovTech } from "@/lib/acoes/complementos";

export type ChecklistNegocio = {
  politicas: number;
  precos: number;
  playbook: number;
  termoReferencia: number;
};

export type NegocioGovTech = {
  status: string;
  modelo_negocio: string | null;
  modulos: string[] | null;
  proposta_trabalho: string | null;
  condicoes_financeiras: string | null;
  modelo_distribuicao: string | null;
  remuneracao_canal: string | null;
};

const MODULOS = ["M1", "M2", "M3", "M4", "M5"];

function SeletorModulos({ valorInicial }: { valorInicial: string[] }) {
  const [selecionados, setSelecionados] = React.useState<string[]>(valorInicial);
  const alternar = (m: string) =>
    setSelecionados((atual) =>
      atual.includes(m) ? atual.filter((x) => x !== m) : [...atual, m].sort()
    );
  return (
    <div className="space-y-1.5">
      <Label>Módulos do negócio</Label>
      <input type="hidden" name="modulos" value={selecionados.join(",")} />
      <div className="flex gap-1.5">
        {MODULOS.map((m) => {
          const ativo = selecionados.includes(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => alternar(m)}
              aria-pressed={ativo}
              className={
                ativo
                  ? "rounded-md bg-marca-600 px-3 py-1.5 font-mono text-sm font-semibold text-white"
                  : "rounded-md border border-border px-3 py-1.5 font-mono text-sm text-muted-foreground hover:border-marca-600/50 hover:text-foreground"
              }
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItemChecklist({
  rotulo,
  quantidade,
  href,
  dica,
}: {
  rotulo: string;
  quantidade: number;
  href: string;
  dica: string;
}) {
  const pronto = quantidade > 0;
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border p-3">
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full",
          pronto ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
        )}
      >
        {pronto ? <Check className="size-3.5" /> : <CircleDashed className="size-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{rotulo}</p>
        <p className="text-xs text-muted-foreground">
          {pronto ? `${quantidade} registro(s) no sistema.` : dica}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-medium text-marca-700 hover:underline dark:text-marca-300"
      >
        {pronto ? "Ver" : "Resolver"} <ExternalLink className="size-3" />
      </Link>
    </li>
  );
}

export function NegocioGovTechAba({
  empresaId,
  negocio,
  checklist,
}: {
  empresaId: string;
  negocio: NegocioGovTech;
  checklist: ChecklistNegocio;
}) {
  const [mudandoFase, startFase] = React.useTransition();

  const indiceAtual = FASES_GOVTECH.findIndex((f) => f.valor === negocio.status);
  const foraDoFunil = indiceAtual === -1; // suspensa / encerrada

  const mudarFase = (valor: string, rotulo: string) =>
    startFase(async () => {
      const r = await atualizarFaseGovTech(empresaId, valor);
      if (r.ok) toast.success(`Fase atualizada: ${rotulo}.`);
      else toast.error(r.erro ?? "Não foi possível atualizar a fase.");
    });

  return (
    <div className="space-y-4">
      {/* ── Linha do tempo da fase ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Fase do negócio</CardTitle>
          <CardDescription>
            Clique na etapa para atualizar. A cor avança junto com a negociação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {foraDoFunil ? (
            <p className="rounded-lg bg-muted px-3 py-2.5 text-sm">
              Esta GovTech está com status{" "}
              <strong>{STATUS_EMPRESA[negocio.status] ?? negocio.status}</strong>, fora
              do funil de negociação. Reative pela aba Dados para voltar ao funil.
            </p>
          ) : (
            <ol className="flex flex-col gap-2 sm:flex-row sm:gap-0">
              {FASES_GOVTECH.map((fase, i) => {
                const alcancada = i <= indiceAtual;
                const atual = i === indiceAtual;
                return (
                  <li key={fase.valor} className="flex flex-1 items-center">
                    <button
                      type="button"
                      disabled={mudandoFase}
                      onClick={() => mudarFase(fase.valor, fase.rotulo)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                        atual
                          ? "border-transparent text-white " + fase.cor
                          : alcancada
                            ? "border-border bg-muted/60"
                            : "border-dashed border-border text-muted-foreground hover:border-marca-600/50"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                          atual
                            ? "bg-white/25 text-white"
                            : alcancada
                              ? fase.cor + " text-white"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {alcancada && !atual ? <Check className="size-3.5" /> : i + 1}
                      </span>
                      <span className="text-sm font-medium">{fase.rotulo}</span>
                    </button>
                    {i < FASES_GOVTECH.length - 1 && (
                      <span className="hidden px-1 text-muted-foreground sm:block">→</span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        {/* ── Acordo ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Condições do acordo</CardTitle>
            <CardDescription>
              O que foi combinado entre a DoisGe e esta GovTech.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormAcao acao={salvarNegocioGovTech}>
              <input type="hidden" name="empresa_id" value={empresaId} />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <CampoSelecao
                    rotulo="Modelo de negócio"
                    nome="modelo_negocio"
                    opcoes={MODELOS_NEGOCIO_GOVTECH}
                    valorInicial={negocio.modelo_negocio}
                    permitirVazio
                    rotuloVazio="— Definir —"
                  />
                  <CampoSelecao
                    rotulo="Proposta de trabalho"
                    nome="proposta_trabalho"
                    opcoes={STATUS_PROPOSTA_TRABALHO}
                    valorInicial={negocio.proposta_trabalho}
                    permitirVazio
                    rotuloVazio="— Definir —"
                  />
                </div>
                <SeletorModulos valorInicial={negocio.modulos ?? []} />
                <CampoTexto
                  rotulo="Condições financeiras"
                  nome="condicoes_financeiras"
                  valorInicial={negocio.condicoes_financeiras}
                  placeholder="Ex.: 12x R$ 20.000 + 10%"
                />
                <div className="grid grid-cols-2 gap-3">
                  <CampoTexto
                    rotulo="Modelo de distribuição"
                    nome="modelo_distribuicao"
                    valorInicial={negocio.modelo_distribuicao}
                    placeholder="Ex.: Operações GovTech"
                  />
                  <CampoTexto
                    rotulo="Remuneração do Canal"
                    nome="remuneracao_canal"
                    valorInicial={negocio.remuneracao_canal}
                    placeholder="Ex.: 10% / 25%"
                  />
                </div>
              </div>
            </FormAcao>
          </CardContent>
        </Card>

        {/* ── Checklist de implantação (automático) ──────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Checklist de implantação</CardTitle>
            <CardDescription>
              O sistema verifica sozinho o que já está pronto — clique para
              resolver o que falta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <ItemChecklist
                rotulo="Política comercial"
                quantidade={checklist.politicas}
                href="/politicas"
                dica="Cadastre uma política com escopo desta GovTech."
              />
              <ItemChecklist
                rotulo="Tabela de preços"
                quantidade={checklist.precos}
                href="/produtos"
                dica="Cadastre os preços na aba Preços do produto."
              />
              <ItemChecklist
                rotulo="Playbook de produtos"
                quantidade={checklist.playbook}
                href="/produtos"
                dica="Suba a apresentação comercial ou manual na aba Materiais."
              />
              <ItemChecklist
                rotulo="Termo de referência"
                quantidade={checklist.termoReferencia}
                href="/produtos"
                dica="Suba o termo de referência na aba Materiais do produto."
              />
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
