"use client";

import * as React from "react";
import { Plus, Percent, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  salvarRegraComissao,
  calcularComissoesContrato,
  atualizarComissao,
} from "@/lib/acoes/governanca";
import { formatarMoeda } from "@/lib/utils";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";
import type { TomPilula } from "@/lib/dominio";

const TIPOS_COMISSAO: Record<string, string> = {
  comissao_doisge: "Comissão DOISGE",
  comissao_parceiro: "Comissão do parceiro",
  comissao_indicacao: "Comissão de indicação",
  comissao_implantacao: "Comissão de implantação",
  comissao_recorrente: "Comissão recorrente",
  comissao_primeiro_contrato: "Primeiro contrato",
  comissao_por_mensalidade: "Por mensalidade",
  comissao_parceiro_ativo: "Parceiro ativo",
  bonus_sucesso: "Bônus de sucesso",
  participacao_projeto: "Participação em projeto",
};

const BASES_CALCULO: Record<string, string> = {
  valor_bruto_contratado: "Valor bruto contratado",
  valor_liquido_contratado: "Valor líquido contratado",
  valor_faturado: "Valor faturado",
  valor_recebido: "Valor recebido",
  mensalidade: "Mensalidade",
  valor_implantacao: "Valor de implantação",
  valor_fixo: "Valor fixo",
  outro: "Outro",
};

const CONDICOES_PAGAMENTO: Record<string, string> = {
  na_assinatura: "Na assinatura",
  no_faturamento: "No faturamento",
  no_recebimento: "No recebimento",
  mensal: "Mensal",
  anual: "Anual",
  por_competencia: "Por competência",
  apos_implantacao: "Após implantação",
  primeiros_12_meses: "Primeiros 12 meses",
  enquanto_contrato_ativo: "Enquanto o contrato estiver ativo",
  conforme_aditivo: "Conforme aditivo",
};

const STATUS_REGRA: Record<string, string> = {
  em_aprovacao: "Em aprovação",
  ativa: "Ativa",
  suspensa: "Suspensa",
  encerrada: "Encerrada",
};

const STATUS_COMISSAO: Record<string, string> = {
  prevista: "Prevista",
  calculada: "Calculada",
  aprovada: "Aprovada",
  a_pagar: "A pagar",
  paga: "Paga",
  suspensa: "Suspensa",
  contestada: "Contestada",
  cancelada: "Cancelada",
};

const TOM_COMISSAO: Record<string, TomPilula> = {
  prevista: "neutro",
  calculada: "info",
  aprovada: "info",
  a_pagar: "alerta",
  paga: "sucesso",
  suspensa: "erro",
  contestada: "erro",
  cancelada: "erro",
};

export type RegraLinha = {
  id: string;
  produto_id: string | null;
  parceiro_rede_id: string | null;
  tipo_comissao: string;
  beneficiario: string;
  base_calculo: string;
  percentual: number | null;
  valor_fixo: number | null;
  condicao_pagamento: string | null;
  status: string;
  observacoes: string | null;
  produtos: { nome_produto: string } | null;
  parceiros_rede: { razao_social: string; nome_fantasia: string | null } | null;
};

export type ComissaoLinha = {
  id: string;
  beneficiario: string;
  valor_base: number | null;
  percentual: number | null;
  valor_comissao: number | null;
  status: string;
  visivel_parceiro: boolean;
  data_prevista_pagamento: string | null;
  data_pagamento: string | null;
  observacoes: string | null;
  contratos: { numero_contrato: string | null; municipios: { nome: string; uf: string } | null } | null;
  parceiros_rede: { razao_social: string; nome_fantasia: string | null } | null;
};

export function ComissoesCliente({
  regras,
  comissoes,
  produtos,
  parceiros,
  contratos,
}: {
  regras: RegraLinha[];
  comissoes: ComissaoLinha[];
  produtos: Opcao[];
  parceiros: Opcao[];
  contratos: Opcao[];
}) {
  const [regraAberta, setRegraAberta] = React.useState(false);
  const [editandoRegra, setEditandoRegra] = React.useState<RegraLinha | null>(null);
  const [editandoComissao, setEditandoComissao] = React.useState<ComissaoLinha | null>(null);
  const [contratoCalculo, setContratoCalculo] = React.useState<string>("");
  const [calculando, startCalculo] = React.useTransition();

  const FormRegra = ({ regra }: { regra?: RegraLinha | null }) => (
    <>
      <SecaoFormulario titulo="Escopo" />
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao rotulo="Produto" nome="produto_id" opcoes={Object.fromEntries(produtos.map((p) => [p.id, p.rotulo]))} valorInicial={regra?.produto_id} permitirVazio rotuloVazio="Todos os produtos" />
        <CampoSelecao rotulo="Parceiro" nome="parceiro_rede_id" opcoes={Object.fromEntries(parceiros.map((p) => [p.id, p.rotulo]))} valorInicial={regra?.parceiro_rede_id} permitirVazio rotuloVazio="Todos os parceiros" />
      </div>
      <p className="text-xs text-muted-foreground">
        Regra específica de parceiro prevalece sobre a regra geral.
      </p>

      <SecaoFormulario titulo="Cálculo" />
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao rotulo="Tipo" nome="tipo_comissao" obrigatorio opcoes={TIPOS_COMISSAO} valorInicial={regra?.tipo_comissao ?? "comissao_parceiro"} />
        <CampoTexto rotulo="Beneficiário" nome="beneficiario" obrigatorio valorInicial={regra?.beneficiario} placeholder="Ex.: DOISGE, Parceiro…" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <CampoSelecao rotulo="Base de cálculo" nome="base_calculo" obrigatorio opcoes={BASES_CALCULO} valorInicial={regra?.base_calculo ?? "valor_recebido"} />
        <CampoTexto rotulo="Percentual (%)" nome="percentual" tipo="number" valorInicial={regra?.percentual?.toString()} />
        <CampoTexto rotulo="Valor fixo (R$)" nome="valor_fixo" tipo="number" valorInicial={regra?.valor_fixo?.toString()} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao rotulo="Condição de pagamento" nome="condicao_pagamento" opcoes={CONDICOES_PAGAMENTO} valorInicial={regra?.condicao_pagamento} permitirVazio />
        <CampoSelecao rotulo="Status" nome="status" obrigatorio opcoes={STATUS_REGRA} valorInicial={regra?.status ?? "em_aprovacao"} />
      </div>
      <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={regra?.observacoes} />
    </>
  );

  return (
    <Tabs defaultValue="comissoes">
      <TabsList>
        <TabsTrigger value="comissoes">
          Comissões
          {comissoes.length > 0 && <span className="ml-1 text-xs text-muted-foreground">{comissoes.length}</span>}
        </TabsTrigger>
        <TabsTrigger value="regras">
          Regras
          {regras.length > 0 && <span className="ml-1 text-xs text-muted-foreground">{regras.length}</span>}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="comissoes" className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Nenhuma comissão existe sem regra aprovada — calcule a partir de um contrato.
          </p>
          <div className="flex items-center gap-2">
            <Select value={contratoCalculo} onValueChange={(v) => setContratoCalculo((v as string) ?? "")}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Escolher contrato…" />
              </SelectTrigger>
              <SelectContent>
                {contratos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.rotulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!contratoCalculo || calculando}
              onClick={() =>
                startCalculo(async () => {
                  const r = await calcularComissoesContrato(contratoCalculo);
                  if (r.ok) toast.success(`${r.geradas} comissão(ões) calculada(s).`);
                  else toast.error(r.erro ?? "Não foi possível calcular.");
                })
              }
            >
              <Calculator className="size-4" />
              {calculando ? "Calculando…" : "Calcular"}
            </Button>
          </div>
        </div>

        {comissoes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Percent className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
            <p className="mt-3 font-medium">Nenhuma comissão calculada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie as regras na aba ao lado e calcule a partir de um contrato.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Beneficiário</TableHead>
                  <TableHead className="hidden sm:table-cell">Contrato</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Base</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">%</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comissoes.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setEditandoComissao(c)}>
                    <TableCell className="font-medium">{c.beneficiario}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {c.contratos?.numero_contrato || "—"}
                      {c.contratos?.municipios && ` · ${c.contratos.municipios.nome}`}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right font-mono tabular-nums">
                      {formatarMoeda(c.valor_base)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right">
                      {c.percentual != null ? `${c.percentual}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {formatarMoeda(c.valor_comissao)}
                    </TableCell>
                    <TableCell>
                      <Pilula tom={TOM_COMISSAO[c.status] ?? "neutro"}>
                        {STATUS_COMISSAO[c.status] ?? c.status}
                      </Pilula>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="regras" className="mt-4 space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setRegraAberta(true)}>
            <Plus className="size-4" />
            Nova regra
          </Button>
        </div>

        {regras.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Nenhuma regra de comissão. A regra define quem recebe, sobre qual base e quanto.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Escopo</TableHead>
                  <TableHead>Beneficiário</TableHead>
                  <TableHead className="hidden md:table-cell">Base</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regras.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setEditandoRegra(r)}>
                    <TableCell className="font-medium">{TIPOS_COMISSAO[r.tipo_comissao] ?? r.tipo_comissao}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {r.produtos?.nome_produto ?? "Todos"} · {r.parceiros_rede?.nome_fantasia || r.parceiros_rede?.razao_social || "Todos"}
                    </TableCell>
                    <TableCell>{r.beneficiario}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {BASES_CALCULO[r.base_calculo] ?? r.base_calculo}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {r.percentual != null ? `${r.percentual}%` : formatarMoeda(r.valor_fixo)}
                    </TableCell>
                    <TableCell>
                      <Pilula tom={r.status === "ativa" ? "sucesso" : r.status === "em_aprovacao" ? "alerta" : "neutro"}>
                        {STATUS_REGRA[r.status] ?? r.status}
                      </Pilula>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <PainelFormulario
        aberto={regraAberta}
        aoFechar={() => setRegraAberta(false)}
        titulo="Nova regra de comissão"
        acao={salvarRegraComissao}
      >
        <FormRegra />
      </PainelFormulario>

      <PainelFormulario
        key={editandoRegra?.id ?? "nenhuma"}
        aberto={!!editandoRegra}
        aoFechar={() => setEditandoRegra(null)}
        titulo="Editar regra de comissão"
        acao={salvarRegraComissao}
        idRegistro={editandoRegra?.id}
      >
        <FormRegra regra={editandoRegra} />
      </PainelFormulario>

      <PainelFormulario
        key={editandoComissao?.id ?? "nenhuma-comissao"}
        aberto={!!editandoComissao}
        aoFechar={() => setEditandoComissao(null)}
        titulo={`Comissão · ${editandoComissao?.beneficiario ?? ""}`}
        descricao={`Valor: ${formatarMoeda(editandoComissao?.valor_comissao ?? null)}`}
        acao={atualizarComissao}
        idRegistro={editandoComissao?.id}
      >
        <CampoSelecao rotulo="Status" nome="status" obrigatorio opcoes={STATUS_COMISSAO} valorInicial={editandoComissao?.status} />
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto rotulo="Previsão de pagamento" nome="data_prevista_pagamento" tipo="date" valorInicial={editandoComissao?.data_prevista_pagamento ?? undefined} />
          <CampoTexto rotulo="Pago em" nome="data_pagamento" tipo="date" valorInicial={editandoComissao?.data_pagamento ?? undefined} />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
          <Checkbox id="visivel_parceiro" name="visivel_parceiro" defaultChecked={editandoComissao?.visivel_parceiro ?? false} />
          <Label htmlFor="visivel_parceiro" className="font-normal">
            Visível para o parceiro no CRM
          </Label>
        </div>
        <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={editandoComissao?.observacoes} />
      </PainelFormulario>
    </Tabs>
  );
}
