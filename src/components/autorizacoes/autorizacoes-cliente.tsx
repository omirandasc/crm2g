"use client";

import * as React from "react";
import { Plus, KeyRound, Pencil } from "lucide-react";
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
  SecaoFormulario,
} from "@/components/cadastros/campos";
import {
  STATUS_AUTORIZACAO,
  TOM_STATUS_AUTORIZACAO,
} from "@/lib/dominio";
import { salvarAutorizacao } from "@/lib/acoes/comercial";
import { formatarMoeda } from "@/lib/utils";

export type AutorizacaoLinha = {
  id: string;
  parceiro_rede_id: string;
  produto_id: string;
  status: string;
  preco_compra_autorizado: number | null;
  preco_venda_sugerido: number | null;
  preco_minimo_permitido: number | null;
  comissao_doisge: number | null;
  comissao_parceiro: number | null;
  qtd_max_municipios_preferenciais: number;
  prazo_protecao_oportunidade_dias: number | null;
  observacoes: string | null;
  parceiros_rede: { razao_social: string; nome_fantasia: string | null } | null;
  produtos: { nome_produto: string } | null;
};

export type Opcao = { id: string; rotulo: string };

function FormAutorizacao({
  autorizacao,
  parceiros,
  produtos,
}: {
  autorizacao?: AutorizacaoLinha | null;
  parceiros: Opcao[];
  produtos: Opcao[];
}) {
  return (
    <>
      <SecaoFormulario titulo="Quem vende o quê" />
      <CampoSelecao
        rotulo="Canal"
        nome="parceiro_rede_id"
        obrigatorio
        opcoes={Object.fromEntries(parceiros.map((p) => [p.id, p.rotulo]))}
        valorInicial={autorizacao?.parceiro_rede_id}
      />
      <CampoSelecao
        rotulo="Produto"
        nome="produto_id"
        obrigatorio
        opcoes={Object.fromEntries(produtos.map((p) => [p.id, p.rotulo]))}
        valorInicial={autorizacao?.produto_id}
      />
      <CampoSelecao
        rotulo="Status"
        nome="status"
        obrigatorio
        opcoes={STATUS_AUTORIZACAO}
        valorInicial={autorizacao?.status ?? "solicitada"}
      />

      <SecaoFormulario titulo="Regras comerciais (R$)" />
      <div className="grid grid-cols-3 gap-3">
        <CampoTexto rotulo="Preço de compra" nome="preco_compra_autorizado" tipo="number" valorInicial={autorizacao?.preco_compra_autorizado?.toString()} placeholder="0,00" />
        <CampoTexto rotulo="Venda sugerida" nome="preco_venda_sugerido" tipo="number" valorInicial={autorizacao?.preco_venda_sugerido?.toString()} placeholder="0,00" />
        <CampoTexto rotulo="Mínimo permitido" nome="preco_minimo_permitido" tipo="number" valorInicial={autorizacao?.preco_minimo_permitido?.toString()} placeholder="0,00" />
      </div>

      <SecaoFormulario titulo="Comissões (%)" />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Comissão DOISGE" nome="comissao_doisge" tipo="number" valorInicial={autorizacao?.comissao_doisge?.toString()} placeholder="Ex.: 10" />
        <CampoTexto rotulo="Comissão do parceiro" nome="comissao_parceiro" tipo="number" valorInicial={autorizacao?.comissao_parceiro?.toString()} placeholder="Ex.: 20" />
      </div>

      <SecaoFormulario titulo="Território e proteção" />
      <p className="text-xs text-muted-foreground">
        O limite da carteira de cidades (padrão 30, todos os produtos somados)
        fica no cadastro do Canal, no menu Canais.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto
          rotulo="Proteção da oportunidade (dias)"
          nome="prazo_protecao_oportunidade_dias"
          tipo="number"
          valorInicial={autorizacao?.prazo_protecao_oportunidade_dias?.toString()}
          placeholder="Ex.: 90"
        />
      </div>

      <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={autorizacao?.observacoes} />
    </>
  );
}

export function AutorizacoesCliente({
  autorizacoes,
  parceiros,
  produtos,
}: {
  autorizacoes: AutorizacaoLinha[];
  parceiros: Opcao[];
  produtos: Opcao[];
}) {
  const [novaAberta, setNovaAberta] = React.useState(false);
  const [editando, setEditando] = React.useState<AutorizacaoLinha | null>(null);

  const semBase = parceiros.length === 0 || produtos.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setNovaAberta(true)} disabled={semBase}>
          <Plus className="size-4" />
          Nova autorização
        </Button>
      </div>

      {semBase && (
        <p className="rounded-lg bg-alerta-fundo text-alerta text-sm px-3 py-2.5">
          Para autorizar, é preciso ter ao menos um <a href="/rede" className="font-medium underline">parceiro</a> e
          um <a href="/produtos" className="font-medium underline">produto</a> cadastrados.
        </p>
      )}

      {autorizacoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <KeyRound className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhuma autorização ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A autorização é a liberação formal para um parceiro vender um produto —
            com preços, comissões e limite de cidades preferenciais.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parceiro</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden md:table-cell text-right">Venda sugerida</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Comissões (2G/Parc.)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {autorizacoes.map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => setEditando(a)}>
                  <TableCell className="font-medium">
                    {a.parceiros_rede?.nome_fantasia || a.parceiros_rede?.razao_social || "—"}
                  </TableCell>
                  <TableCell>{a.produtos?.nome_produto ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-right font-mono tabular-nums">
                    {formatarMoeda(a.preco_venda_sugerido)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right font-mono tabular-nums">
                    {a.comissao_doisge ?? "—"}% / {a.comissao_parceiro ?? "—"}%
                  </TableCell>
                  <TableCell>
                    <Pilula tom={TOM_STATUS_AUTORIZACAO[a.status] ?? "neutro"}>
                      {STATUS_AUTORIZACAO[a.status] ?? a.status}
                    </Pilula>
                  </TableCell>
                  <TableCell>
                    <Pencil className="size-3.5 text-muted-foreground" />
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
        titulo="Nova autorização"
        descricao="Liberação formal: qual parceiro pode vender qual produto, e com quais regras."
        acao={salvarAutorizacao}
      >
        <FormAutorizacao parceiros={parceiros} produtos={produtos} />
      </PainelFormulario>

      <PainelFormulario
        key={editando?.id ?? "nenhuma"}
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        titulo="Editar autorização"
        descricao="Ao mudar o status para Ativa, o parceiro passa a poder criar oportunidades deste produto."
        acao={salvarAutorizacao}
        idRegistro={editando?.id}
      >
        <FormAutorizacao autorizacao={editando} parceiros={parceiros} produtos={produtos} />
      </PainelFormulario>
    </div>
  );
}
