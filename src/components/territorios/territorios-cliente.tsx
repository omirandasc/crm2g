"use client";

import * as React from "react";
import { Plus, Map, Check, X, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Pilula, SeloTerritorio } from "@/components/selo-territorio";
import { PainelFormulario } from "@/components/cadastros/painel-formulario";
import { CampoSelecao, CampoTextoLongo, SecaoFormulario } from "@/components/cadastros/campos";
import { CampoMunicipio } from "@/components/cadastros/campo-municipio";
import {
  STATUS_AREA_PREFERENCIAL,
  TOM_STATUS_AREA,
} from "@/lib/dominio";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  solicitarAreaPreferencial,
  decidirAreaPreferencial,
  encerrarExclusividade,
} from "@/lib/acoes/comercial";
import { formatarData } from "@/lib/utils";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";

export type AreaPreferencialLinha = {
  id: string;
  status: string;
  data_solicitacao: string;
  data_aprovacao: string | null;
  justificativa: string | null;
  ultima_movimentacao_comercial: string | null;
  parceiros_rede: { razao_social: string; nome_fantasia: string | null } | null;
  produtos: { nome_produto: string } | null;
  municipios: { nome: string; uf: string; populacao: number | null } | null;
};

export type AreaExclusivaLinha = {
  id: string;
  status: string;
  data_inicio: string;
  parceiros_rede: { razao_social: string; nome_fantasia: string | null } | null;
  produtos: { nome_produto: string } | null;
  municipios: { nome: string; uf: string } | null;
};

function nomeParceiro(p: { razao_social: string; nome_fantasia: string | null } | null) {
  return p?.nome_fantasia || p?.razao_social || "—";
}

export function TerritoriosCliente({
  preferenciais,
  exclusivas,
  parceiros,
  produtos,
}: {
  preferenciais: AreaPreferencialLinha[];
  exclusivas: AreaExclusivaLinha[];
  parceiros: Opcao[];
  produtos: Opcao[];
}) {
  const [novaAberta, setNovaAberta] = React.useState(false);
  const [detalhe, setDetalhe] = React.useState<AreaPreferencialLinha | null>(null);
  const [encerrando, setEncerrando] = React.useState<AreaExclusivaLinha | null>(null);
  const [motivoEncerramento, setMotivoEncerramento] = React.useState("");
  const [decidindo, startDecisao] = React.useTransition();

  const concluirEncerramento = (decisao: "encerrada" | "mantida_por_direito_economico") => {
    if (!encerrando) return;
    startDecisao(async () => {
      const r = await encerrarExclusividade(encerrando.id, decisao, motivoEncerramento);
      if (r.ok) {
        toast.success(
          decisao === "encerrada"
            ? "Exclusividade encerrada — a cidade voltou a ficar Livre."
            : "Direito econômico mantido — a cidade segue travada até o fim do contrato."
        );
        setEncerrando(null);
        setMotivoEncerramento("");
      } else {
        toast.error(r.erro ?? "Não foi possível concluir.");
      }
    });
  };

  const decidir = (
    id: string,
    decisao: "ativa" | "rejeitada" | "liberada",
    rotulo: string
  ) => {
    startDecisao(async () => {
      const r = await decidirAreaPreferencial(id, decisao);
      if (r.ok) {
        toast.success(`Área ${rotulo} com sucesso.`);
        setDetalhe(null);
      } else {
        toast.error(r.erro ?? "Não foi possível concluir.");
      }
    });
  };

  const pendentes = preferenciais.filter((a) =>
    ["solicitada", "em_analise"].includes(a.status)
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setNovaAberta(true)} disabled={parceiros.length === 0 || produtos.length === 0}>
          <Plus className="size-4" />
          Nova área preferencial
        </Button>
      </div>

      <Tabs defaultValue="preferenciais">
        <TabsList>
          <TabsTrigger value="preferenciais">
            Preferenciais
            {pendentes > 0 && (
              <span className="ml-1.5 rounded-full bg-alerta-fundo px-1.5 text-xs font-semibold text-alerta">
                {pendentes}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="exclusivas">Exclusivas</TabsTrigger>
        </TabsList>

        <TabsContent value="preferenciais" className="mt-4">
          {preferenciais.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <Map className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
              <p className="mt-3 font-medium">Nenhuma área preferencial ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">
                A carteira de cada Canal comporta 30 cidades sem contrato
                fechado (todos os produtos somados; ajustável no cadastro do
                Canal). As escolhas e solicitações aparecem aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Município</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead className="hidden sm:table-cell">Produto</TableHead>
                    <TableHead className="hidden md:table-cell">Solicitada em</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preferenciais.map((a) => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => setDetalhe(a)}>
                      <TableCell className="font-medium">
                        {a.municipios ? `${a.municipios.nome} · ${a.municipios.uf}` : "—"}
                      </TableCell>
                      <TableCell>{nomeParceiro(a.parceiros_rede)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {a.produtos?.nome_produto ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
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
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <SeloTerritorio status="exclusiva" className="mx-auto" />
              <p className="mt-3 font-medium">Nenhuma área exclusiva ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Quando um contrato é assinado, a cidade vira automaticamente
                exclusiva da revenda que originou a venda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Município</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead className="hidden sm:table-cell">Produto</TableHead>
                    <TableHead className="hidden md:table-cell">Desde</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exclusivas.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.municipios ? `${a.municipios.nome} · ${a.municipios.uf}` : "—"}
                      </TableCell>
                      <TableCell>{nomeParceiro(a.parceiros_rede)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {a.produtos?.nome_produto ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatarData(a.data_inicio)}
                      </TableCell>
                      <TableCell>
                        {a.status === "mantida_por_direito_economico" ? (
                          <Pilula tom="info">Direito econômico</Pilula>
                        ) : ["encerrada", "cancelada"].includes(a.status) ? (
                          <Pilula tom="neutro">Encerrada</Pilula>
                        ) : (
                          <SeloTerritorio status="exclusiva" />
                        )}
                      </TableCell>
                      <TableCell>
                        {!["encerrada", "cancelada"].includes(a.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEncerrando(a)}
                          >
                            Encerrar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Encerrar exclusividade (só Governança) */}
      <Sheet
        open={!!encerrando}
        onOpenChange={(a) => {
          if (!a) {
            setEncerrando(null);
            setMotivoEncerramento("");
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-md">
          {encerrando && (
            <>
              <SheetHeader>
                <SheetTitle>
                  Encerrar exclusividade —{" "}
                  {encerrando.municipios
                    ? `${encerrando.municipios.nome} · ${encerrando.municipios.uf}`
                    : ""}
                </SheetTitle>
                <SheetDescription>
                  {nomeParceiro(encerrando.parceiros_rede)} —{" "}
                  {encerrando.produtos?.nome_produto}. Esta decisão fica
                  registrada na auditoria.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4 pb-6">
                <div className="space-y-1.5">
                  <Label htmlFor="motivo-exclusiva">
                    Motivo <span className="text-erro">*</span>
                  </Label>
                  <Textarea
                    id="motivo-exclusiva"
                    rows={3}
                    value={motivoEncerramento}
                    onChange={(e) => setMotivoEncerramento(e.target.value)}
                    placeholder="Ex.: distrato do contrato nº 01/2026; renegociação; erro de cadastro…"
                  />
                </div>

                <Separator />

                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={decidindo || !motivoEncerramento.trim()}
                  onClick={() => concluirEncerramento("encerrada")}
                >
                  Encerrar exclusividade — a cidade fica Livre
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={decidindo || !motivoEncerramento.trim()}
                  onClick={() => concluirEncerramento("mantida_por_direito_economico")}
                >
                  Manter direito econômico — travada até o fim do contrato
                </Button>
                <p className="text-xs text-muted-foreground">
                  No direito econômico, o Canal descredenciado continua recebendo
                  as comissões deste cliente e a cidade permanece indisponível
                  para outros Canais até o contrato com o ente público terminar.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Detalhe + decisão da Governança */}
      <Sheet open={!!detalhe} onOpenChange={(a) => !a && setDetalhe(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {detalhe && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {detalhe.municipios
                    ? `${detalhe.municipios.nome} · ${detalhe.municipios.uf}`
                    : "Área preferencial"}
                </SheetTitle>
                <SheetDescription>
                  {nomeParceiro(detalhe.parceiros_rede)} — {detalhe.produtos?.nome_produto}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4 pb-6">
                <Pilula tom={TOM_STATUS_AREA[detalhe.status] ?? "neutro"}>
                  {STATUS_AREA_PREFERENCIAL[detalhe.status] ?? detalhe.status}
                </Pilula>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Solicitada em</dt>
                    <dd className="font-medium">{formatarData(detalhe.data_solicitacao?.slice(0, 10))}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Aprovada em</dt>
                    <dd className="font-medium">
                      {detalhe.data_aprovacao ? formatarData(detalhe.data_aprovacao.slice(0, 10)) : "—"}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Última movimentação comercial</dt>
                    <dd className="font-medium">
                      {detalhe.ultima_movimentacao_comercial
                        ? formatarData(detalhe.ultima_movimentacao_comercial.slice(0, 10))
                        : "Sem movimentação registrada"}
                    </dd>
                  </div>
                  {detalhe.justificativa && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Justificativa</dt>
                      <dd>{detalhe.justificativa}</dd>
                    </div>
                  )}
                </dl>

                <Separator />

                {["solicitada", "em_analise"].includes(detalhe.status) && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={decidindo}
                      onClick={() => decidir(detalhe.id, "ativa", "aprovada")}
                    >
                      <Check className="size-4" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={decidindo}
                      onClick={() => decidir(detalhe.id, "rejeitada", "rejeitada")}
                    >
                      <X className="size-4" />
                      Rejeitar
                    </Button>
                  </div>
                )}

                {["aprovada", "ativa"].includes(detalhe.status) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={decidindo}
                    onClick={() => decidir(detalhe.id, "liberada", "liberada")}
                  >
                    <Unlock className="size-4" />
                    Liberar cidade (sem movimentação)
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Nova solicitação */}
      <PainelFormulario
        aberto={novaAberta}
        aoFechar={() => setNovaAberta(false)}
        titulo="Nova área preferencial"
        descricao="Reserva de prioridade comercial: produto + parceiro + município. A carteira de cada Canal comporta 30 cidades sem contrato fechado (ajustável no cadastro do Canal)."
        acao={solicitarAreaPreferencial}
      >
        <SecaoFormulario titulo="Solicitação" />
        <CampoSelecao
          rotulo="Canal"
          nome="parceiro_rede_id"
          obrigatorio
          opcoes={Object.fromEntries(parceiros.map((p) => [p.id, p.rotulo]))}
        />
        <CampoSelecao
          rotulo="Produto"
          nome="produto_id"
          obrigatorio
          opcoes={Object.fromEntries(produtos.map((p) => [p.id, p.rotulo]))}
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
