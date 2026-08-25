"use client";

import * as React from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatarMoeda } from "@/lib/utils";
import { GRUPOS_FUNIL, TIPOS_PRODUTO } from "@/lib/dominio";

export type OportunidadeRelatorio = {
  id: string;
  etapa_comercial: string;
  valor_venda: number | null;
  produtos: {
    nome_produto: string;
    tipo_produto: string;
    empresas_portfolio: { razao_social: string; nome_fantasia: string | null } | null;
  } | null;
  parceiros_rede: { razao_social: string; nome_fantasia: string | null } | null;
  municipios: { nome: string; uf: string; regiao: string | null } | null;
};

const DIMENSOES: Record<string, string> = {
  fase: "Fase do funil",
  produto: "Produto",
  tipo: "Tipo de produto",
  govtech: "GovTech",
  canal: "Canal",
  regiao: "Região do país",
  uf: "Estado (UF)",
};

function grupoDaEtapa(etapa: string) {
  return GRUPOS_FUNIL.find((g) => g.etapas.includes(etapa));
}

function chaveDimensao(o: OportunidadeRelatorio, dimensao: string): string {
  switch (dimensao) {
    case "fase":
      return grupoDaEtapa(o.etapa_comercial)?.rotulo ?? "Outra fase";
    case "produto":
      return o.produtos?.nome_produto ?? "Sem produto";
    case "tipo":
      return o.produtos
        ? TIPOS_PRODUTO[o.produtos.tipo_produto] ?? o.produtos.tipo_produto
        : "Sem produto";
    case "govtech":
      return o.produtos?.empresas_portfolio
        ? o.produtos.empresas_portfolio.nome_fantasia ||
            o.produtos.empresas_portfolio.razao_social
        : "Sem GovTech";
    case "canal":
      return o.parceiros_rede
        ? o.parceiros_rede.nome_fantasia || o.parceiros_rede.razao_social
        : "Venda direta DoisGe";
    case "regiao":
      return o.municipios?.regiao ?? "Sem região";
    case "uf":
      return o.municipios?.uf ?? "Sem UF";
    default:
      return "—";
  }
}

type Linha = {
  chave: string;
  total: number;
  emAberto: number;
  ganhas: number;
  valor: number;
  valorGanho: number;
};

export function RelatoriosCliente({
  oportunidades,
}: {
  oportunidades: OportunidadeRelatorio[];
}) {
  const [dimensao, setDimensao] = React.useState("fase");

  const linhas = React.useMemo(() => {
    const mapa = new Map<string, Linha>();
    for (const o of oportunidades) {
      const chave = chaveDimensao(o, dimensao);
      const linha =
        mapa.get(chave) ??
        ({ chave, total: 0, emAberto: 0, ganhas: 0, valor: 0, valorGanho: 0 } as Linha);
      const grupo = grupoDaEtapa(o.etapa_comercial)?.chave;
      linha.total += 1;
      linha.valor += o.valor_venda ?? 0;
      if (grupo === "ganhas") {
        linha.ganhas += 1;
        linha.valorGanho += o.valor_venda ?? 0;
      } else if (grupo !== "perdidas") {
        linha.emAberto += 1;
      }
      mapa.set(chave, linha);
    }
    const resultado = [...mapa.values()];
    if (dimensao === "fase") {
      const ordem = [...GRUPOS_FUNIL.map((g) => g.rotulo), "Outra fase"];
      resultado.sort((a, b) => ordem.indexOf(a.chave) - ordem.indexOf(b.chave));
    } else {
      resultado.sort((a, b) => b.valor - a.valor);
    }
    return resultado;
  }, [oportunidades, dimensao]);

  const totais = React.useMemo(() => {
    let ganhas = 0;
    let fechadas = 0;
    let valorAberto = 0;
    let valorGanho = 0;
    for (const o of oportunidades) {
      const grupo = grupoDaEtapa(o.etapa_comercial)?.chave;
      if (grupo === "ganhas") {
        ganhas += 1;
        fechadas += 1;
        valorGanho += o.valor_venda ?? 0;
      } else if (grupo === "perdidas") {
        fechadas += 1;
      } else {
        valorAberto += o.valor_venda ?? 0;
      }
    }
    return {
      total: oportunidades.length,
      ganhas,
      conversao: fechadas > 0 ? Math.round((ganhas / fechadas) * 100) : null,
      valorAberto,
      valorGanho,
    };
  }, [oportunidades]);

  const maiorValor = Math.max(...linhas.map((l) => l.valor), 1);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { rotulo: "Oportunidades", valor: String(totais.total) },
          { rotulo: "Valor em aberto", valor: formatarMoeda(totais.valorAberto) },
          { rotulo: "Vendas ganhas", valor: `${totais.ganhas} · ${formatarMoeda(totais.valorGanho)}` },
          {
            rotulo: "Conversão (fechadas)",
            valor: totais.conversao != null ? `${totais.conversao}%` : "—",
          },
        ].map((c) => (
          <Card key={c.rotulo}>
            <CardContent className="py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {c.rotulo}
              </p>
              <p className="mt-1 truncate text-xl font-semibold tabular-nums">{c.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Escolha a visão para cruzar o funil por diferentes ângulos.
        </p>
        <Select value={dimensao} onValueChange={(v) => setDimensao(v ?? "fase")} items={DIMENSOES}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DIMENSOES).map(([valor, rotulo]) => (
              <SelectItem key={valor} value={valor}>
                {rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {oportunidades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <BarChart3 className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Ainda não há dados para o relatório</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Assim que as primeiras oportunidades forem cadastradas, os números
            aparecem aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{DIMENSOES[dimensao]}</TableHead>
                <TableHead className="text-right">Oportunidades</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Em aberto</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Ganhas</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead className="hidden md:table-cell w-40">Proporção</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.chave}>
                  <TableCell className="font-medium">{l.chave}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.total}</TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums text-muted-foreground">
                    {l.emAberto}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums text-muted-foreground">
                    {l.ganhas}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatarMoeda(l.valor)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-marca-600"
                        style={{ width: `${Math.max((l.valor / maiorValor) * 100, 2)}%` }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Os números respeitam o seu perfil de acesso: cada um enxerga apenas as
        oportunidades que pode ver.
      </p>
    </div>
  );
}
