"use client";

import * as React from "react";
import { Plus, Truck } from "lucide-react";
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
import { salvarEntrega } from "@/lib/acoes/governanca";
import { formatarData } from "@/lib/utils";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";
import type { TomPilula } from "@/lib/dominio";

const STATUS_ENTREGA: Record<string, string> = {
  nao_iniciada: "Não iniciada",
  aguardando_contrato_empenho: "Aguardando contrato/empenho",
  aguardando_dados_cliente: "Aguardando dados do cliente",
  em_preparacao: "Em preparação",
  em_implantacao: "Em implantação",
  treinamento_agendado: "Treinamento agendado",
  entregue: "Entregue",
  implantacao_concluida: "Implantação concluída",
  em_suporte: "Em suporte",
  pendente_cliente: "Pendente: cliente",
  pendente_portfolio: "Pendente: Portfólio",
  pendente_parceiro: "Pendente: parceiro",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

const TOM_ENTREGA: Record<string, TomPilula> = {
  nao_iniciada: "neutro",
  aguardando_contrato_empenho: "alerta",
  aguardando_dados_cliente: "alerta",
  em_preparacao: "info",
  em_implantacao: "info",
  treinamento_agendado: "info",
  entregue: "sucesso",
  implantacao_concluida: "sucesso",
  em_suporte: "info",
  pendente_cliente: "alerta",
  pendente_portfolio: "alerta",
  pendente_parceiro: "alerta",
  finalizada: "sucesso",
  cancelada: "erro",
};

const RESPONSAVEIS: Record<string, string> = {
  portfolio: "Empresa do Portfólio",
  parceiro_rede: "Parceiro da Rede",
  doisge: "DOISGE",
  compartilhado: "Compartilhado",
  terceiro: "Terceiro",
};

export type EntregaLinha = {
  id: string;
  contrato_id: string | null;
  tipo_responsavel: string;
  responsavel_entrega: string | null;
  status_entrega: string;
  data_inicio: string | null;
  data_prevista_conclusao: string | null;
  data_conclusao: string | null;
  pendencias: string | null;
  observacoes: string | null;
  produtos: { nome_produto: string } | null;
  municipios: { nome: string; uf: string } | null;
  contratos: { numero_contrato: string | null } | null;
};

export function EntregasCliente({
  entregas,
  contratos,
}: {
  entregas: EntregaLinha[];
  contratos: Opcao[];
}) {
  const [novaAberta, setNovaAberta] = React.useState(false);
  const [editando, setEditando] = React.useState<EntregaLinha | null>(null);

  const FormEntrega = ({ entrega }: { entrega?: EntregaLinha | null }) => (
    <>
      <SecaoFormulario titulo="Entrega" />
      {entrega ? (
        <input type="hidden" name="contrato_id" value={entrega.contrato_id ?? ""} />
      ) : (
        <CampoSelecao
          rotulo="Contrato"
          nome="contrato_id"
          obrigatorio
          opcoes={Object.fromEntries(contratos.map((c) => [c.id, c.rotulo]))}
        />
      )}
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao rotulo="Quem entrega" nome="tipo_responsavel" obrigatorio opcoes={RESPONSAVEIS} valorInicial={entrega?.tipo_responsavel ?? "portfolio"} />
        <CampoTexto rotulo="Responsável (nome)" nome="responsavel_entrega" valorInicial={entrega?.responsavel_entrega} />
      </div>
      <CampoSelecao rotulo="Status" nome="status_entrega" obrigatorio opcoes={STATUS_ENTREGA} valorInicial={entrega?.status_entrega ?? "nao_iniciada"} />
      <div className="grid grid-cols-3 gap-3">
        <CampoTexto rotulo="Início" nome="data_inicio" tipo="date" valorInicial={entrega?.data_inicio ?? undefined} />
        <CampoTexto rotulo="Previsão" nome="data_prevista_conclusao" tipo="date" valorInicial={entrega?.data_prevista_conclusao ?? undefined} />
        <CampoTexto rotulo="Conclusão" nome="data_conclusao" tipo="date" valorInicial={entrega?.data_conclusao ?? undefined} />
      </div>
      <CampoTextoLongo rotulo="Pendências" nome="pendencias" valorInicial={entrega?.pendencias} />
      <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={entrega?.observacoes} />
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setNovaAberta(true)} disabled={contratos.length === 0}>
          <Plus className="size-4" />
          Nova entrega
        </Button>
      </div>

      {entregas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Truck className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhuma entrega em andamento</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A entrega/implantação nasce de um contrato e pode ser do Portfólio,
            da Rede, da DOISGE ou compartilhada.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto / Município</TableHead>
                <TableHead className="hidden sm:table-cell">Contrato</TableHead>
                <TableHead className="hidden md:table-cell">Quem entrega</TableHead>
                <TableHead className="hidden lg:table-cell">Previsão</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entregas.map((e) => (
                <TableRow key={e.id} className="cursor-pointer" onClick={() => setEditando(e)}>
                  <TableCell>
                    <span className="font-medium">{e.produtos?.nome_produto ?? "—"}</span>
                    <span className="block text-xs text-muted-foreground">
                      {e.municipios ? `${e.municipios.nome} · ${e.municipios.uf}` : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {e.contratos?.numero_contrato || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {RESPONSAVEIS[e.tipo_responsavel] ?? e.tipo_responsavel}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatarData(e.data_prevista_conclusao)}
                  </TableCell>
                  <TableCell>
                    <Pilula tom={TOM_ENTREGA[e.status_entrega] ?? "neutro"}>
                      {STATUS_ENTREGA[e.status_entrega] ?? e.status_entrega}
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
        titulo="Nova entrega"
        descricao="Produto, parceiro e município são herdados do contrato."
        acao={salvarEntrega}
      >
        <FormEntrega />
      </PainelFormulario>

      <PainelFormulario
        key={editando?.id ?? "nenhuma"}
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        titulo="Editar entrega"
        acao={salvarEntrega}
        idRegistro={editando?.id}
      >
        <FormEntrega entrega={editando} />
      </PainelFormulario>
    </div>
  );
}
