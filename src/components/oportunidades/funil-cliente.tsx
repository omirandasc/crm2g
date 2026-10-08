"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, Pencil, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CampoMunicipio } from "@/components/cadastros/campo-municipio";
import {
  ETAPAS_COMERCIAIS,
  ORIGENS_OPORTUNIDADE,
  GRUPOS_FUNIL,
  TOM_ETAPA,
} from "@/lib/dominio";
import { salvarOportunidade } from "@/lib/acoes/comercial";
import { calcularTabela, usaQuantidade, type PrecoVigente } from "@/lib/precos";
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
  quantidade: number | null;
  preco_aprovacao_status: string | null;
  probabilidade: number | null;
  previsao_fechamento: string | null;
  dor_identificada: string | null;
  proximo_passo: string | null;
  data_proximo_passo: string | null;
  observacoes: string | null;
  produtos: {
    nome_produto: string;
    empresa_portfolio_id?: string | null;
    empresas_portfolio?: { razao_social: string; nome_fantasia: string | null } | null;
  } | null;
  parceiros_rede: { razao_social: string; nome_fantasia: string | null } | null;
  municipios: { id: string; nome: string; uf: string; populacao?: number | null } | null;
};

const ROTULO_PRECO: Record<string, { texto: string; tom: "alerta" | "sucesso" | "erro" }> = {
  pendente: { texto: "Aguardando aprovação de preço", tom: "alerta" },
  aprovado: { texto: "Preço abaixo da tabela aprovado", tom: "sucesso" },
  recusado: { texto: "Preço recusado — ajuste o valor", tom: "erro" },
};

export function FormOportunidade({
  oportunidade,
  produtos,
  parceiros,
  precos,
}: {
  oportunidade?: OportunidadeLinha | null;
  produtos: Opcao[];
  parceiros: Opcao[];
  precos: PrecoVigente[];
}) {
  // Produto → tabela de preços; cidade → população → faixa; kits → quantidade.
  const [produtoId, setProdutoId] = React.useState(oportunidade?.produto_id ?? "");
  const [populacao, setPopulacao] = React.useState<number | null>(
    oportunidade?.municipios?.populacao ?? null
  );
  const [quantidade, setQuantidade] = React.useState(oportunidade?.quantidade?.toString() ?? "");
  const [tabelaManual, setTabelaManual] = React.useState(oportunidade?.valor_tabela?.toString() ?? "");
  const [venda, setVenda] = React.useState(oportunidade?.valor_venda?.toString() ?? "");
  // Enquanto o usuário não digitar um valor de venda, ele acompanha a tabela.
  const [vendaManual, setVendaManual] = React.useState(oportunidade?.valor_venda != null);

  const tabela = calcularTabela(precos, produtoId, populacao, Number(quantidade) || null);
  const pedeQuantidade = usaQuantidade(precos, produtoId);
  const valorTabela =
    tabela.modo === "sem_tabela" ? Number(tabelaManual.replace(",", ".")) || null : tabela.valor;

  React.useEffect(() => {
    if (!vendaManual) setVenda(valorTabela != null ? String(valorTabela) : "");
  }, [valorTabela, vendaManual]);

  const vendaNumero = Number(venda.replace(",", ".")) || null;
  const abaixoDaTabela = vendaNumero != null && valorTabela != null && vendaNumero < valorTabela;
  const situacaoPreco = oportunidade?.preco_aprovacao_status
    ? ROTULO_PRECO[oportunidade.preco_aprovacao_status]
    : null;

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
        aoMudar={setProdutoId}
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
        aoEscolher={(m) => setPopulacao(m.populacao)}
      />

      <SecaoFormulario titulo="Valores" />
      {pedeQuantidade && (
        <CampoTexto
          rotulo="Quantidade"
          nome="quantidade"
          tipo="number"
          valor={quantidade}
          aoMudar={setQuantidade}
          placeholder="Ex.: 100 kits"
          obrigatorio
        />
      )}

      {tabela.modo === "sem_tabela" ? (
        <CampoTexto
          rotulo="Valor de tabela (R$)"
          nome="valor_tabela"
          tipo="number"
          valor={tabelaManual}
          aoMudar={setTabelaManual}
          placeholder="0,00"
        />
      ) : (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <input type="hidden" name="valor_tabela" value={valorTabela ?? ""} />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Valor de tabela{tabela.modo === "faixa" ? " (mensal)" : ""}
          </p>
          <p className="font-mono text-lg font-semibold tabular-nums">
            {valorTabela != null ? formatarMoeda(valorTabela) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">{tabela.descricao}</p>
        </div>
      )}

      <CampoTexto
        rotulo="Valor de venda (R$)"
        nome="valor_venda"
        tipo="number"
        valor={venda}
        aoMudar={(v) => {
          setVenda(v);
          setVendaManual(v.trim() !== "");
        }}
        placeholder="0,00"
      />
      {abaixoDaTabela && (
        <p className="rounded-lg bg-alerta-fundo px-3 py-2.5 text-sm text-alerta">
          Valor abaixo da tabela ({formatarMoeda(valorTabela)}). Ao salvar, a oportunidade fica
          travada e a DoisGe e a GovTech recebem o pedido de aprovação do preço.
        </p>
      )}
      {situacaoPreco && !abaixoDaTabela && (
        <Pilula tom={situacaoPreco.tom}>{situacaoPreco.texto}</Pilula>
      )}

      <SecaoFormulario titulo="Funil" />
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao
          rotulo="Etapa comercial"
          nome="etapa_comercial"
          obrigatorio
          opcoes={ETAPAS_COMERCIAIS}
          valorInicial={oportunidade?.etapa_comercial ?? "qualificacao_inicial"}
        />
        <CampoTexto
          rotulo="Probabilidade (%)"
          nome="probabilidade"
          tipo="number"
          valorInicial={oportunidade?.probabilidade?.toString()}
          placeholder="0 a 100"
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
  precos,
}: {
  oportunidades: OportunidadeLinha[];
  produtos: Opcao[];
  parceiros: Opcao[];
  precos: PrecoVigente[];
}) {
  const [novaAberta, setNovaAberta] = React.useState(false);
  const [govtech, setGovtech] = React.useState("");
  const router = useRouter();

  // Filtro por GovTech: a DoisGe enxerga o volume por fabricante.
  const govtechs = React.useMemo(() => {
    const mapa = new Map<string, string>();
    for (const o of oportunidades) {
      const id = o.produtos?.empresa_portfolio_id;
      const emp = o.produtos?.empresas_portfolio;
      if (id && emp) mapa.set(id, emp.nome_fantasia || emp.razao_social);
    }
    return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [oportunidades]);

  const visiveis = govtech
    ? oportunidades.filter((o) => o.produtos?.empresa_portfolio_id === govtech)
    : oportunidades;

  const porGrupo = (etapas: string[]) =>
    visiveis.filter((o) => etapas.includes(o.etapa_comercial));

  const TabelaFunil = ({ linhas }: { linhas: OportunidadeLinha[] }) => {
    const soma = linhas.reduce((acc, o) => acc + (o.valor_venda ?? 0), 0);
    return (
    linhas.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Nenhuma oportunidade nesta fase.
      </div>
    ) : (
      <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{linhas.length}</span> oportunidade(s) ·{" "}
        <span className="font-mono font-semibold text-marca-700 tabular-nums">{formatarMoeda(soma)}</span>
      </p>
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
              <TableRow key={o.id} className="cursor-pointer" onClick={() => router.push(`/oportunidades/${o.id}`)}>
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
                  <span className="flex flex-wrap items-center gap-1">
                    <Pilula tom={TOM_ETAPA[o.etapa_comercial] ?? "neutro"}>
                      {ETAPAS_COMERCIAIS[o.etapa_comercial] ?? o.etapa_comercial}
                    </Pilula>
                    {o.preco_aprovacao_status === "pendente" && (
                      <Pilula tom="alerta">Preço em aprovação</Pilula>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <Pencil className="size-3.5 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
            {/* Linha de total (pedido do cliente, 08/10) */}
            <TableRow className="bg-muted/40 font-semibold hover:bg-muted/40">
              <TableCell />
              <TableCell>Total</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {linhas.length} oportunidade(s)
              </TableCell>
              <TableCell className="hidden lg:table-cell" />
              <TableCell className="text-right font-mono tabular-nums text-marca-700">
                {formatarMoeda(soma)}
              </TableCell>
              <TableCell className="hidden sm:table-cell" />
              <TableCell />
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
      </div>
    )
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {govtechs.length > 0 && (
          <Select
            items={{ "": "Todas as GovTechs", ...Object.fromEntries(govtechs) }}
            value={govtech}
            onValueChange={(v) => setGovtech(String(v ?? ""))}
          >
            <SelectTrigger className="w-60" aria-label="Filtrar por GovTech">
              <Building2 className="size-4 text-muted-foreground" />
              <SelectValue placeholder="Todas as GovTechs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as GovTechs</SelectItem>
              {govtechs.map(([id, nome]) => (
                <SelectItem key={id} value={id}>
                  {nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
              <span className="ml-1.5 text-xs text-muted-foreground">{visiveis.length}</span>
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
            <TabelaFunil linhas={visiveis} />
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
        descricao="Escolha o produto e a cidade: o valor de tabela é calculado na hora."
        acao={salvarOportunidade}
      >
        <FormOportunidade produtos={produtos} parceiros={parceiros} precos={precos} />
      </PainelFormulario>

    </div>
  );
}
