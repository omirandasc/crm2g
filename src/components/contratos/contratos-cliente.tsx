"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  STATUS_CONTRATO,
  TIPOS_COMPRA_PUBLICA,
  type TomPilula,
} from "@/lib/dominio";
import { salvarContrato } from "@/lib/acoes/contratos";
import { formatarMoeda, formatarData } from "@/lib/utils";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";

export const TOM_STATUS_CONTRATO: Record<string, TomPilula> = {
  em_elaboracao: "neutro",
  enviado_para_assinatura: "alerta",
  assinado: "sucesso",
  aguardando_implantacao: "info",
  em_implantacao: "info",
  ativo: "sucesso",
  em_renovacao: "alerta",
  renovado: "sucesso",
  suspenso: "erro",
  encerrado: "neutro",
  cancelado: "erro",
  inadimplente: "erro",
  substituido: "neutro",
};

export type ContratoLinha = {
  id: string;
  numero_contrato: string | null;
  oportunidade_id: string;
  tipo_compra_publica: string | null;
  data_assinatura: string | null;
  inicio_vigencia: string | null;
  fim_vigencia: string | null;
  prazo_meses: number | null;
  valor_mensal: number | null;
  valor_total: number | null;
  recorrente: boolean;
  status_contrato: string;
  observacoes: string | null;
  produtos: { nome_produto: string } | null;
  parceiros_rede: { razao_social: string; nome_fantasia: string | null } | null;
  municipios: { nome: string; uf: string } | null;
};

export function FormContrato({
  contrato,
  oportunidades,
}: {
  contrato?: ContratoLinha | null;
  oportunidades: Opcao[];
}) {
  return (
    <>
      <SecaoFormulario titulo="Origem" />
      {contrato ? (
        <input type="hidden" name="oportunidade_id" value={contrato.oportunidade_id} />
      ) : (
        <CampoSelecao
          rotulo="Oportunidade de origem"
          nome="oportunidade_id"
          obrigatorio
          opcoes={Object.fromEntries(oportunidades.map((o) => [o.id, o.rotulo]))}
        />
      )}
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Nº do contrato" nome="numero_contrato" valorInicial={contrato?.numero_contrato} placeholder="Ex.: 12/2026" />
        <CampoSelecao rotulo="Modalidade" nome="tipo_compra_publica" opcoes={TIPOS_COMPRA_PUBLICA} valorInicial={contrato?.tipo_compra_publica} permitirVazio />
      </div>
      <CampoSelecao rotulo="Status" nome="status_contrato" obrigatorio opcoes={STATUS_CONTRATO} valorInicial={contrato?.status_contrato ?? "em_elaboracao"} />
      <p className="rounded-lg bg-exclusiva-fundo px-3 py-2 text-xs text-exclusiva">
        Ao marcar como Assinado ou Ativo, a cidade vira automaticamente Área
        Exclusiva do parceiro e abre uma vaga na preferencial.
      </p>

      <SecaoFormulario titulo="Vigência e valores" />
      <div className="grid grid-cols-3 gap-3">
        <CampoTexto rotulo="Assinatura" nome="data_assinatura" tipo="date" valorInicial={contrato?.data_assinatura ?? undefined} />
        <CampoTexto rotulo="Início" nome="inicio_vigencia" tipo="date" valorInicial={contrato?.inicio_vigencia ?? undefined} />
        <CampoTexto rotulo="Fim" nome="fim_vigencia" tipo="date" valorInicial={contrato?.fim_vigencia ?? undefined} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <CampoTexto rotulo="Prazo (meses)" nome="prazo_meses" tipo="number" valorInicial={contrato?.prazo_meses?.toString()} />
        <CampoTexto rotulo="Valor mensal (R$)" nome="valor_mensal" tipo="number" valorInicial={contrato?.valor_mensal?.toString()} />
        <CampoTexto rotulo="Valor total (R$)" nome="valor_total" tipo="number" valorInicial={contrato?.valor_total?.toString()} />
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
        <Checkbox id="recorrente_contrato" name="recorrente" defaultChecked={contrato?.recorrente ?? true} />
        <Label htmlFor="recorrente_contrato" className="font-normal">
          Contrato recorrente (gera parcelas mensais)
        </Label>
      </div>
      <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={contrato?.observacoes} />
    </>
  );
}

export function ContratosCliente({
  contratos,
  oportunidades,
}: {
  contratos: ContratoLinha[];
  oportunidades: Opcao[];
}) {
  const [novoAberto, setNovoAberto] = React.useState(false);
  const router = useRouter();

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setNovoAberto(true)} disabled={oportunidades.length === 0}>
          <Plus className="size-4" />
          Novo contrato
        </Button>
      </div>

      {contratos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <FileSignature className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhum contrato ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Todo contrato nasce de uma oportunidade. Ao assinar, a cidade vira
            área exclusiva do parceiro que originou a venda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead className="hidden md:table-cell">Município</TableHead>
                <TableHead className="hidden lg:table-cell">Parceiro</TableHead>
                <TableHead className="text-right">Valor mensal</TableHead>
                <TableHead className="hidden sm:table-cell">Vigência</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratos.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/contratos/${c.id}`)}>
                  <TableCell>
                    <span className="font-medium">{c.numero_contrato || "Sem número"}</span>
                    <span className="block text-xs text-muted-foreground">
                      {c.produtos?.nome_produto}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c.municipios ? `${c.municipios.nome} · ${c.municipios.uf}` : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {c.parceiros_rede?.nome_fantasia || c.parceiros_rede?.razao_social || "DOISGE"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatarMoeda(c.valor_mensal)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {c.inicio_vigencia ? `${formatarData(c.inicio_vigencia)} → ${formatarData(c.fim_vigencia)}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Pilula tom={TOM_STATUS_CONTRATO[c.status_contrato] ?? "neutro"}>
                      {STATUS_CONTRATO[c.status_contrato] ?? c.status_contrato}
                    </Pilula>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PainelFormulario
        aberto={novoAberto}
        aoFechar={() => setNovoAberto(false)}
        titulo="Novo contrato"
        descricao="Produto, parceiro e município são herdados da oportunidade de origem."
        acao={salvarContrato}
      >
        <FormContrato oportunidades={oportunidades} />
      </PainelFormulario>
    </div>
  );
}
