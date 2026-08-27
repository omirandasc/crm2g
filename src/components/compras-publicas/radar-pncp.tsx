"use client";

import * as React from "react";
import { Plus, X, Radar, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pilula } from "@/components/selo-territorio";
import { PainelFormulario } from "@/components/cadastros/painel-formulario";
import { CampoTexto, CampoUF } from "@/components/cadastros/campos";
import {
  salvarPalavraChave,
  removerPalavraChave,
} from "@/lib/acoes/complementos";
import { formatarData } from "@/lib/utils";
import type { LicitacaoPNCP } from "@/lib/pncp";

export type PalavraChave = { id: string; termo: string; uf: string | null };

function prazoCurto(iso: string | null) {
  if (!iso) return null;
  const restante = new Date(iso).getTime() - Date.now();
  if (restante <= 0) return { texto: "Encerrando", tom: "erro" as const };
  const dias = Math.ceil(restante / 86400000);
  if (dias <= 3) return { texto: `${dias} dia(s)`, tom: "alerta" as const };
  return { texto: `${dias} dias`, tom: "sucesso" as const };
}

export function RadarPNCP({
  palavras,
  resultados,
  podeEditar,
}: {
  palavras: PalavraChave[];
  resultados: Record<string, LicitacaoPNCP[]>;
  podeEditar: boolean;
}) {
  const [novaAberta, setNovaAberta] = React.useState(false);
  const [removendo, startRemocao] = React.useTransition();

  const remover = (p: PalavraChave) =>
    startRemocao(async () => {
      const r = await removerPalavraChave(p.id);
      if (r.ok) toast.success(`"${p.termo}" removida do radar.`);
      else toast.error(r.erro ?? "Não foi possível remover.");
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {palavras.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-marca-600/40 bg-marca-50 px-3 py-1 text-sm font-medium text-marca-700 dark:bg-marca-950/60 dark:text-marca-300"
          >
            {p.termo}
            {p.uf && <span className="text-xs opacity-70">· {p.uf}</span>}
            {podeEditar && (
              <button
                type="button"
                title={`Remover "${p.termo}"`}
                disabled={removendo}
                onClick={() => remover(p)}
                className="ml-0.5 opacity-60 hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            )}
          </span>
        ))}
        {podeEditar && (
          <Button variant="outline" size="sm" onClick={() => setNovaAberta(true)}>
            <Plus className="size-3.5" />
            Nova palavra-chave
          </Button>
        )}
      </div>

      {palavras.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Radar className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhuma palavra-chave no radar</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione termos como “defesa civil” ou “software” para monitorar as
            licitações abertas no Brasil inteiro.
          </p>
        </div>
      ) : (
        palavras.map((p) => {
          const itens = resultados[p.id] ?? [];
          return (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radar className="size-4 text-marca-600" />
                  {p.termo}
                  {p.uf && <Pilula tom="neutro">{p.uf}</Pilula>}
                </CardTitle>
                <CardDescription>
                  {itens.length > 0
                    ? `${itens.length} licitações recebendo propostas agora (mais recentes primeiro).`
                    : "Nenhuma licitação aberta encontrada agora — ou o PNCP está instável; tente recarregar."}
                </CardDescription>
              </CardHeader>
              {itens.length > 0 && (
                <CardContent className="space-y-2.5">
                  {itens.map((l) => {
                    const prazo = prazoCurto(l.prazoPropostas);
                    return (
                      <a
                        key={l.id}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-border p-3 transition-colors hover:border-marca-600/50 hover:bg-marca-50/40 dark:hover:bg-marca-950/30"
                      >
                        <p className="line-clamp-2 text-sm font-medium">
                          {l.objeto || "Objeto não informado"}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">{l.orgao}</span>
                          {l.municipio && (
                            <span>
                              {l.municipio}
                              {l.uf ? `/${l.uf}` : ""}
                            </span>
                          )}
                          {l.modalidade && <Pilula tom="info">{l.modalidade}</Pilula>}
                          {prazo && (
                            <Pilula tom={prazo.tom}>
                              Propostas: {prazo.texto}
                              {l.prazoPropostas && ` (até ${formatarData(l.prazoPropostas.slice(0, 10))})`}
                            </Pilula>
                          )}
                          <span className="ml-auto inline-flex items-center gap-1 text-marca-700 dark:text-marca-300">
                            Ver no PNCP <ExternalLink className="size-3" />
                          </span>
                        </p>
                      </a>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })
      )}

      <p className="text-xs text-muted-foreground">
        Fonte: API pública do PNCP (Portal Nacional de Contratações Públicas).
        Resultados atualizados a cada 30 minutos, apenas licitações com
        recebimento de propostas em aberto.
      </p>

      <PainelFormulario
        aberto={novaAberta}
        aoFechar={() => setNovaAberta(false)}
        titulo="Nova palavra-chave"
        descricao="O radar busca o termo nos editais publicados no PNCP, no Brasil inteiro ou numa UF específica."
        acao={salvarPalavraChave}
      >
        <CampoTexto rotulo="Termo" nome="termo" obrigatorio placeholder="Ex.: produtos hospitalares" />
        <CampoUF rotulo="UF (opcional — vazio = Brasil inteiro)" nome="uf" />
      </PainelFormulario>
    </div>
  );
}
