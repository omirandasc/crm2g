"use client";

import * as React from "react";
import { Plus, Target, Pencil } from "lucide-react";
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
import { Pilula } from "@/components/selo-territorio";
import { PainelFormulario } from "@/components/cadastros/painel-formulario";
import {
  CampoTexto,
  CampoTextoLongo,
  CampoSelecao,
  SecaoFormulario,
} from "@/components/cadastros/campos";
import { CampoMunicipio } from "@/components/cadastros/campo-municipio";
import {
  ETAPAS_COMERCIAIS,
  ORIGENS_OPORTUNIDADE,
  GRUPOS_FUNIL,
  TOM_ETAPA,
} from "@/lib/dominio";
import { salvarOportunidade } from "@/lib/acoes/comercial";
import { formatarMoeda, formatarData } from "@/lib/utils";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";

export type OportunidadeLinha = {
  id: string;
  codigo: number;
  nome_oportunidade: string;
  produto_id: string;
  parceiro_rede_id: string | null;
  municipio_id: string;
  origem: string;
  etapa_comercial: string;
  status: string;
  valor_tabela: number | null;
  valor_venda: number | null;
  probabilidade: number | null;
  previsao_fechamento: string | null;
  dor_identificada: string | null;
  proximo_passo: string | null;
  data_proximo_passo: string | null;
  observacoes: string | null;
  produtos: { nome_produto: string } | null;
  parceiros_rede: { razao_social: string; nome_fantasia: string | null } | null;
  municipios: { id: string; nome: string; uf: string } | null;
};

function FormOportunidade({
  oportunidade,
  produtos,
  parceiros,
}: {
  oportunidade?: OportunidadeLinha | null;
  produtos: Opcao[];
  parceiros: Opcao[];
}) {
  return (
    <>
      <SecaoFormulario titulo="Negócio" />
      <CampoTexto
        rotulo="Nome da oportunidade"
        nome="nome_oportunidade"
        obrigatorio
        valorInicial={oportunidade?.nome_oportunidade}
        placeholder="Ex.: Sentinela — Prefeitura de Criciúma"
      />
      <CampoSelecao
        rotulo="Produto"
        nome="produto_id"
        obrigatorio
        opcoes={Object.fromEntries(produtos.map((p) => [p.id, p.rotulo]))}
        valorInicial={oportunidade?.produto_id}
      />
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao
          rotulo="Parceiro responsável"
          nome="parceiro_rede_id"
          opcoes={Object.fromEntries(parceiros.map((p) => [p.id, p.rotulo]))}
          valorInicial={oportunidade?.parceiro_rede_id}
          permitirVazio
          rotuloVazio="DOISGE (direto)"
        />
        <CampoSelecao
          rotulo="Origem"
          nome="origem"
          obrigatorio
          opcoes={ORIGENS_OPORTUNIDADE}
          valorInicial={oportunidade?.origem ?? "doisge"}
        />
      </div>
      <CampoMunicipio
        nome="municipio_id"
        obrigatorio
        valorInicial={oportunidade?.municipios ?? null}
      />

      <SecaoFormulario titulo="Funil" />
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao
          rotulo="Etapa comercial"
          nome="etapa_comercial"
          obrigatorio
          opcoes={ETAPAS_COMERCIAIS}
          valorInicial={oportunidade?.etapa_comercial ?? "lead_identificado"}
        />
        <CampoTexto
          rotulo="Probabilidade (%)"
          nome="probabilidade"
          tipo="number"
          valorInicial={oportunidade?.probabilidade?.toString()}
          placeholder="0 a 100"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto
          rotulo="Valor de tabela (R$)"
          nome="valor_tabela"
          tipo="number"
          valorInicial={oportunidade?.valor_tabela?.toString()}
          placeholder="0,00"
        />
        <CampoTexto
          rotulo="Valor de venda (R$)"
          nome="valor_venda"
          tipo="number"
          valorInicial={oportunidade?.valor_venda?.toString()}
          placeholder="0,00"
        />
      </div>
      <CampoTexto
        rotulo="Previsão de fechamento"
        nome="previsao_fechamento"
        tipo="date"
        valorInicial={oportunidade?.previsao_fechamento ?? undefined}
      />

      <SecaoFormulario titulo="Acompanhamento" />
      <CampoTextoLongo
        rotulo="Dor identificada"
        nome="dor_identificada"
        valorInicial={oportunidade?.dor_identificada}
        placeholder="Qual problema do município este negócio resolve?"
      />
      <div className="grid grid-cols-[1fr_150px] gap-3">
        <CampoTexto
          rotulo="Próximo passo"
          nome="proximo_passo"
          valorInicial={oportunidade?.proximo_passo}
          placeholder="Ex.: Agendar demonstração"
        />
        <CampoTexto
          rotulo="Quando"
          nome="data_proximo_passo"
          tipo="date"
          valorInicial={oportunidade?.data_proximo_passo ?? undefined}
        />
      </div>
      <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={oportunidade?.observacoes} />
    </>
  );
}

export function FunilCliente({
  oportunidades,
  produtos,
  parceiros,
}: {
  oportunidades: OportunidadeLinha[];
  produtos: Opcao[];
  parceiros: Opcao[];
}) {
  const [novaAberta, setNovaAberta] = React.useState(false);
  const [editando, setEditando] = React.useState<OportunidadeLinha | null>(null);

  const porGrupo = (etapas: string[]) =>
    oportunidades.filter((o) => etapas.includes(o.etapa_comercial));

  const TabelaFunil = ({ linhas }: { linhas: OportunidadeLinha[] }) =>
    linhas.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Nenhuma oportunidade nesta fase.
      </div>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Nº</TableHead>
              <TableHead>Oportunidade</TableHead>
              <TableHead className="hidden md:table-cell">Município</TableHead>
              <TableHead className="hidden lg:table-cell">Parceiro</TableHead>
              <TableHead className="text-right">Valor venda</TableHead>
              <TableHead className="hidden sm:table-cell">Previsão</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((o) => (
              <TableRow key={o.id} className="cursor-pointer" onClick={() => setEditando(o)}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{o.codigo}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{o.nome_oportunidade}</span>
                  <span className="block text-xs text-muted-foreground">
                    {o.produtos?.nome_produto}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {o.municipios ? `${o.municipios.nome} · ${o.municipios.uf}` : "—"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {o.parceiros_rede?.nome_fantasia || o.parceiros_rede?.razao_social || "DOISGE"}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatarMoeda(o.valor_venda)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {formatarData(o.previsao_fechamento)}
                </TableCell>
                <TableCell>
                  <Pilula tom={TOM_ETAPA[o.etapa_comercial] ?? "neutro"}>
                    {ETAPAS_COMERCIAIS[o.etapa_comercial] ?? o.etapa_comercial}
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
    );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setNovaAberta(true)} disabled={produtos.length === 0}>
          <Plus className="size-4" />
          Nova oportunidade
        </Button>
      </div>

      {oportunidades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Target className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">O funil está vazio</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre a primeira oportunidade — cada negócio em andamento com um
            município vive aqui, organizado por fase.
          </p>
          {produtos.length > 0 && (
            <Button className="mt-4" onClick={() => setNovaAberta(true)}>
              <Plus className="size-4" />
              Registrar primeira oportunidade
            </Button>
          )}
        </div>
      ) : (
        <Tabs defaultValue="todas">
          <TabsList className="flex-wrap">
            <TabsTrigger value="todas">
              Todas
              <span className="ml-1.5 text-xs text-muted-foreground">{oportunidades.length}</span>
            </TabsTrigger>
            {GRUPOS_FUNIL.map((g) => {
              const qtd = porGrupo(g.etapas).length;
              return (
                <TabsTrigger key={g.chave} value={g.chave}>
                  {g.rotulo}
                  {qtd > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">{qtd}</span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="todas" className="mt-4">
            <TabelaFunil linhas={oportunidades} />
          </TabsContent>
          {GRUPOS_FUNIL.map((g) => (
            <TabsContent key={g.chave} value={g.chave} className="mt-4">
              <TabelaFunil linhas={porGrupo(g.etapas)} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <PainelFormulario
        aberto={novaAberta}
        aoFechar={() => setNovaAberta(false)}
        titulo="Nova oportunidade"
        descricao="Um negócio em andamento com um município. Sem registro aqui, não há proteção comercial."
        acao={salvarOportunidade}
      >
        <FormOportunidade produtos={produtos} parceiros={parceiros} />
      </PainelFormulario>

      <PainelFormulario
        key={editando?.id ?? "nenhuma"}
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        titulo={editando ? `#${editando.codigo} · ${editando.nome_oportunidade}` : "Editar"}
        descricao="Atualize a etapa e os dados do negócio."
        acao={salvarOportunidade}
        idRegistro={editando?.id}
      >
        <FormOportunidade oportunidade={editando} produtos={produtos} parceiros={parceiros} />
      </PainelFormulario>
    </div>
  );
}
