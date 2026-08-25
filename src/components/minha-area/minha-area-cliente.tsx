"use client";

import * as React from "react";
import { Plus, Map } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pilula, SeloTerritorio } from "@/components/selo-territorio";
import { PainelFormulario } from "@/components/cadastros/painel-formulario";
import { CampoSelecao, CampoTextoLongo } from "@/components/cadastros/campos";
import { CampoMunicipio } from "@/components/cadastros/campo-municipio";
import { solicitarAreaPreferencial } from "@/lib/acoes/comercial";
import { STATUS_AREA_PREFERENCIAL, TOM_STATUS_AREA } from "@/lib/dominio";
import { formatarData } from "@/lib/utils";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";

export type MinhaAreaPreferencial = {
  id: string;
  status: string;
  data_solicitacao: string;
  produtos: { nome_produto: string } | null;
  municipios: { nome: string; uf: string } | null;
};

export type MinhaAreaExclusiva = {
  id: string;
  status: string;
  data_inicio: string;
  produtos: { nome_produto: string } | null;
  municipios: { nome: string; uf: string } | null;
};

export function MinhaAreaCliente({
  parceiroId,
  limite,
  preferenciais,
  exclusivas,
  produtosAutorizados,
}: {
  parceiroId: string;
  limite: number;
  preferenciais: MinhaAreaPreferencial[];
  exclusivas: MinhaAreaExclusiva[];
  produtosAutorizados: Opcao[];
}) {
  const [solicitarAberto, setSolicitarAberto] = React.useState(false);

  const ativas = preferenciais.filter((a) => ["aprovada", "ativa"].includes(a.status)).length;
  const vagas = Math.max(0, limite - ativas);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Cidades preferenciais ativas</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {ativas}
              <span className="text-base font-normal text-muted-foreground"> / {limite}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Vagas disponíveis</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{vagas}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Cidades exclusivas (contratos)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{exclusivas.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => setSolicitarAberto(true)}
          disabled={produtosAutorizados.length === 0 || vagas === 0}
        >
          <Plus className="size-4" />
          Solicitar nova cidade
        </Button>
      </div>

      {produtosAutorizados.length === 0 && (
        <p className="rounded-lg bg-alerta-fundo px-3 py-2.5 text-sm text-alerta">
          Você ainda não tem produtos autorizados. Fale com a DoisGe (Governança).
        </p>
      )}

      <Tabs defaultValue="preferenciais">
        <TabsList>
          <TabsTrigger value="preferenciais">Preferenciais</TabsTrigger>
          <TabsTrigger value="exclusivas">Exclusivas</TabsTrigger>
        </TabsList>

        <TabsContent value="preferenciais" className="mt-4">
          {preferenciais.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <Map className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
              <p className="mt-3 font-medium">Escolha suas cidades</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Você tem direito a {limite} cidades preferenciais para prospecção.
                Quando fechar contrato numa delas, ela vira exclusiva e abre uma vaga.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Município</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="hidden sm:table-cell">Solicitada em</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preferenciais.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.municipios ? `${a.municipios.nome} · ${a.municipios.uf}` : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.produtos?.nome_produto ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatarData(a.data_solicitacao?.slice(0, 10))}
                      </TableCell>
                      <TableCell>
                        <Pilula tom={TOM_STATUS_AREA[a.status] ?? "neutro"}>
                          {STATUS_AREA_PREFERENCIAL[a.status] ?? a.status}
                        </Pilula>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="exclusivas" className="mt-4">
          {exclusivas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <SeloTerritorio status="exclusiva" className="mx-auto" />
              <p className="mt-3 font-medium">Nenhuma cidade exclusiva ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ao assinar contrato numa cidade preferencial, ela vira sua — sem limite de quantidade.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Município</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="hidden sm:table-cell">Desde</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exclusivas.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.municipios ? `${a.municipios.nome} · ${a.municipios.uf}` : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.produtos?.nome_produto ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatarData(a.data_inicio)}
                      </TableCell>
                      <TableCell>
                        <SeloTerritorio status="exclusiva" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PainelFormulario
        aberto={solicitarAberto}
        aoFechar={() => setSolicitarAberto(false)}
        titulo="Solicitar cidade preferencial"
        descricao="A solicitação vai para aprovação da DoisGe (Governança)."
        acao={solicitarAreaPreferencial}
      >
        <input type="hidden" name="parceiro_rede_id" value={parceiroId} />
        <CampoSelecao
          rotulo="Produto"
          nome="produto_id"
          obrigatorio
          opcoes={Object.fromEntries(produtosAutorizados.map((p) => [p.id, p.rotulo]))}
        />
        <CampoMunicipio nome="municipio_id" obrigatorio />
        <CampoTextoLongo
          rotulo="Justificativa"
          nome="justificativa"
          placeholder="Por que esta cidade? (relacionamento, demanda identificada…)"
        />
      </PainelFormulario>
    </div>
  );
}
