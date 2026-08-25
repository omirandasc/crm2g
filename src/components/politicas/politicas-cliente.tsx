"use client";

import * as React from "react";
import { Plus, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pilula } from "@/components/selo-territorio";
import { PainelFormulario } from "@/components/cadastros/painel-formulario";
import {
  CampoTexto,
  CampoTextoLongo,
  CampoSelecao,
} from "@/components/cadastros/campos";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";
import { salvarPolitica } from "@/lib/acoes/complementos";
import { formatarData } from "@/lib/utils";
import {
  TIPOS_POLITICA,
  STATUS_POLITICA,
  TOM_STATUS_POLITICA,
} from "@/lib/dominio";

export type PoliticaLinha = {
  id: string;
  nome_politica: string;
  tipo_politica: string;
  produto_id: string | null;
  empresa_portfolio_id: string | null;
  parceiro_rede_id: string | null;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
  produtos: { nome_produto: string } | null;
  empresas_portfolio: { razao_social: string; nome_fantasia: string | null } | null;
  parceiros_rede: { razao_social: string; nome_fantasia: string | null } | null;
};

function escopoDaPolitica(p: PoliticaLinha) {
  const partes: string[] = [];
  if (p.produtos) partes.push(p.produtos.nome_produto);
  if (p.empresas_portfolio)
    partes.push(p.empresas_portfolio.nome_fantasia || p.empresas_portfolio.razao_social);
  if (p.parceiros_rede)
    partes.push(p.parceiros_rede.nome_fantasia || p.parceiros_rede.razao_social);
  return partes.length > 0 ? partes.join(" · ") : "Geral (todo o ecossistema)";
}

const FormPolitica = ({
  politica,
  produtos,
  empresas,
  parceiros,
}: {
  politica?: PoliticaLinha | null;
  produtos: Opcao[];
  empresas: Opcao[];
  parceiros: Opcao[];
}) => (
  <>
    {politica && <input type="hidden" name="id" value={politica.id} />}
    <CampoTexto
      rotulo="Nome da política"
      nome="nome_politica"
      obrigatorio
      valorInicial={politica?.nome_politica}
      placeholder="Ex.: Comissão padrão de venda SaaS"
    />
    <div className="grid grid-cols-2 gap-3">
      <CampoSelecao
        rotulo="Tipo"
        nome="tipo_politica"
        obrigatorio
        opcoes={TIPOS_POLITICA}
        valorInicial={politica?.tipo_politica ?? "comissao"}
      />
      <CampoSelecao
        rotulo="Status"
        nome="status"
        obrigatorio
        opcoes={STATUS_POLITICA}
        valorInicial={politica?.status ?? "ativa"}
      />
    </div>
    <CampoSelecao
      rotulo="Produto (opcional)"
      nome="produto_id"
      opcoes={Object.fromEntries(produtos.map((p) => [p.id, p.rotulo]))}
      valorInicial={politica?.produto_id}
      permitirVazio
      rotuloVazio="— Todos os produtos —"
    />
    <div className="grid grid-cols-2 gap-3">
      <CampoSelecao
        rotulo="GovTech (opcional)"
        nome="empresa_portfolio_id"
        opcoes={Object.fromEntries(empresas.map((e) => [e.id, e.rotulo]))}
        valorInicial={politica?.empresa_portfolio_id}
        permitirVazio
        rotuloVazio="— Todas —"
      />
      <CampoSelecao
        rotulo="Canal (opcional)"
        nome="parceiro_rede_id"
        opcoes={Object.fromEntries(parceiros.map((p) => [p.id, p.rotulo]))}
        valorInicial={politica?.parceiro_rede_id}
        permitirVazio
        rotuloVazio="— Todos —"
      />
    </div>
    <CampoTextoLongo
      rotulo="Descrição da regra"
      nome="descricao"
      valorInicial={politica?.descricao}
      placeholder="Descreva a regra em linguagem clara: percentuais, condições, exceções…"
    />
    <div className="grid grid-cols-2 gap-3">
      <CampoTexto
        rotulo="Início da vigência"
        nome="data_inicio"
        tipo="date"
        valorInicial={politica?.data_inicio ?? undefined}
      />
      <CampoTexto
        rotulo="Fim da vigência"
        nome="data_fim"
        tipo="date"
        valorInicial={politica?.data_fim ?? undefined}
      />
    </div>
  </>
);

export function PoliticasCliente({
  politicas,
  produtos,
  empresas,
  parceiros,
  podeEditar,
}: {
  politicas: PoliticaLinha[];
  produtos: Opcao[];
  empresas: Opcao[];
  parceiros: Opcao[];
  podeEditar: boolean;
}) {
  const [novaAberta, setNovaAberta] = React.useState(false);
  const [editando, setEditando] = React.useState<PoliticaLinha | null>(null);

  const ativas = politicas.filter((p) => p.status === "ativa").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {ativas > 0
            ? `${ativas} política(s) em vigor no ecossistema.`
            : "Nenhuma política em vigor ainda."}
        </p>
        {podeEditar && (
          <Button onClick={() => setNovaAberta(true)}>
            <Plus className="size-4" />
            Nova política
          </Button>
        )}
      </div>

      {politicas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <ScrollText className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhuma política registrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Regras de preço, comissão, território e proteção comercial ficam
            registradas aqui, valendo para todos.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Política</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Escopo</TableHead>
                <TableHead className="hidden lg:table-cell">Vigência</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {politicas.map((p) => (
                <TableRow
                  key={p.id}
                  className={podeEditar ? "cursor-pointer" : undefined}
                  onClick={podeEditar ? () => setEditando(p) : undefined}
                >
                  <TableCell>
                    <span className="font-medium">{p.nome_politica}</span>
                    {p.descricao && (
                      <span className="block max-w-96 truncate text-xs text-muted-foreground">
                        {p.descricao}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {TIPOS_POLITICA[p.tipo_politica] ?? p.tipo_politica}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {escopoDaPolitica(p)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {p.data_inicio || p.data_fim
                      ? `${p.data_inicio ? formatarData(p.data_inicio) : "…"} — ${
                          p.data_fim ? formatarData(p.data_fim) : "sem fim"
                        }`
                      : "Sem prazo"}
                  </TableCell>
                  <TableCell>
                    <Pilula tom={TOM_STATUS_POLITICA[p.status] ?? "neutro"}>
                      {STATUS_POLITICA[p.status] ?? p.status}
                    </Pilula>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PainelFormulario
        aberto={novaAberta}
        aoFechar={() => setNovaAberta(false)}
        titulo="Nova política comercial"
        descricao="A regra passa a valer para todos os perfis dentro do escopo escolhido."
        acao={salvarPolitica}
      >
        <FormPolitica produtos={produtos} empresas={empresas} parceiros={parceiros} />
      </PainelFormulario>

      <PainelFormulario
        key={editando?.id ?? "nenhuma"}
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        titulo="Editar política"
        acao={salvarPolitica}
      >
        <FormPolitica
          politica={editando}
          produtos={produtos}
          empresas={empresas}
          parceiros={parceiros}
        />
      </PainelFormulario>
    </div>
  );
}
