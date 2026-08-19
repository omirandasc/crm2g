"use client";

import * as React from "react";
import { CalendarRange, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pilula } from "@/components/selo-territorio";
import { FormAcao } from "@/components/cadastros/form-acao";
import { PainelFormulario } from "@/components/cadastros/painel-formulario";
import { CampoTexto, CampoSelecao } from "@/components/cadastros/campos";
import {
  FormContrato,
  type ContratoLinha,
} from "@/components/contratos/contratos-cliente";
import { salvarContrato, gerarParcelas, atualizarParcela } from "@/lib/acoes/contratos";
import { formatarMoeda, formatarData } from "@/lib/utils";
import type { TomPilula } from "@/lib/dominio";

const STATUS_PARCELA: Record<string, string> = {
  prevista: "Prevista",
  faturada: "Faturada",
  recebida: "Recebida",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
  suspensa: "Suspensa",
};

const TOM_PARCELA: Record<string, TomPilula> = {
  prevista: "neutro",
  faturada: "info",
  recebida: "sucesso",
  atrasada: "erro",
  cancelada: "erro",
  suspensa: "alerta",
};

export type ParcelaLinha = {
  id: string;
  competencia: string;
  data_prevista_faturamento: string | null;
  data_faturamento: string | null;
  data_recebimento: string | null;
  valor_bruto: number | null;
  valor_liquido: number | null;
  status: string;
  nota_fiscal: string | null;
};

export function ContratoDetalheCliente({
  contrato,
  parcelas,
}: {
  contrato: ContratoLinha;
  parcelas: ParcelaLinha[];
}) {
  const [editandoParcela, setEditandoParcela] = React.useState<ParcelaLinha | null>(null);
  const [gerando, startGeracao] = React.useTransition();

  const recebidas = parcelas.filter((p) => p.status === "recebida").length;

  return (
    <Tabs defaultValue="dados">
      <TabsList>
        <TabsTrigger value="dados">Dados</TabsTrigger>
        <TabsTrigger value="parcelas">
          <CalendarRange className="size-3.5" />
          Parcelas
          {parcelas.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              {recebidas}/{parcelas.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="mt-4">
        <Card className="max-w-2xl">
          <CardContent>
            <FormAcao acao={salvarContrato}>
              <input type="hidden" name="id" value={contrato.id} />
              <div className="space-y-4">
                <FormContrato contrato={contrato} oportunidades={[]} />
              </div>
            </FormAcao>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="parcelas" className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Faturamento e recebimento por competência. Parcela recebida alimenta o cálculo de comissões.
          </p>
          <Button
            variant="secondary"
            disabled={gerando || !contrato.recorrente}
            onClick={() =>
              startGeracao(async () => {
                const r = await gerarParcelas(contrato.id);
                if (r.ok) toast.success("Parcelas geradas pela vigência do contrato.");
                else toast.error(r.erro ?? "Não foi possível gerar.");
              })
            }
          >
            <Receipt className="size-4" />
            {gerando ? "Gerando…" : "Gerar parcelas da vigência"}
          </Button>
        </div>

        {!contrato.recorrente && (
          <p className="rounded-lg bg-alerta-fundo px-3 py-2.5 text-sm text-alerta">
            Contrato não recorrente — cadastre o recebimento único como uma parcela manual, se necessário.
          </p>
        )}

        {parcelas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhuma parcela. Defina início e fim de vigência e clique em "Gerar parcelas".
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="hidden sm:table-cell">Faturada em</TableHead>
                  <TableHead className="hidden md:table-cell">Recebida em</TableHead>
                  <TableHead className="hidden lg:table-cell">NF</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcelas.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setEditandoParcela(p)}>
                    <TableCell className="font-mono font-medium">{p.competencia}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatarMoeda(p.valor_liquido ?? p.valor_bruto)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatarData(p.data_faturamento)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatarData(p.data_recebimento)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                      {p.nota_fiscal ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Pilula tom={TOM_PARCELA[p.status] ?? "neutro"}>
                        {STATUS_PARCELA[p.status] ?? p.status}
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
        key={editandoParcela?.id ?? "nenhuma"}
        aberto={!!editandoParcela}
        aoFechar={() => setEditandoParcela(null)}
        titulo={`Parcela ${editandoParcela?.competencia ?? ""}`}
        descricao="Atualize o faturamento e o recebimento desta competência."
        acao={atualizarParcela}
        idRegistro={editandoParcela?.id}
      >
        <input type="hidden" name="contrato_id" value={contrato.id} />
        <CampoSelecao rotulo="Status" nome="status" obrigatorio opcoes={STATUS_PARCELA} valorInicial={editandoParcela?.status} />
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto rotulo="Valor bruto (R$)" nome="valor_bruto" tipo="number" valorInicial={editandoParcela?.valor_bruto?.toString()} />
          <CampoTexto rotulo="Valor líquido (R$)" nome="valor_liquido" tipo="number" valorInicial={editandoParcela?.valor_liquido?.toString()} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto rotulo="Data de faturamento" nome="data_faturamento" tipo="date" valorInicial={editandoParcela?.data_faturamento ?? undefined} />
          <CampoTexto rotulo="Data de recebimento" nome="data_recebimento" tipo="date" valorInicial={editandoParcela?.data_recebimento ?? undefined} />
        </div>
        <CampoTexto rotulo="Nota fiscal" nome="nota_fiscal" valorInicial={editandoParcela?.nota_fiscal} />
      </PainelFormulario>
    </Tabs>
  );
}
