"use client";

import * as React from "react";
import { Plus, Landmark, FileText, MessageSquare, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pilula } from "@/components/selo-territorio";
import { FormAcao } from "@/components/cadastros/form-acao";
import { PainelFormulario } from "@/components/cadastros/painel-formulario";
import { CampoArquivo, BotaoBaixar } from "@/components/cadastros/campo-arquivo";
import {
  CampoTexto,
  CampoTextoLongo,
  CampoSelecao,
  SecaoFormulario,
} from "@/components/cadastros/campos";
import {
  FormOportunidade,
  type OportunidadeLinha,
} from "@/components/oportunidades/funil-cliente";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";
import {
  TIPOS_ATIVIDADE,
  VISIBILIDADES_ATIVIDADE,
  STATUS_PROPOSTA,
  TOM_STATUS_PROPOSTA,
  STATUS_COMPRA_PUBLICA,
  TOM_STATUS_COMPRA,
  TIPOS_COMPRA_PUBLICA,
  TIPOS_DOCUMENTO_COMPRA,
  TIPOS_ORGAO,
  PERFIS_DECISAO,
} from "@/lib/dominio";
import { salvarOportunidade } from "@/lib/acoes/comercial";
import {
  registrarAtividade,
  salvarProposta,
  salvarProcessoCompra,
  registrarDocumentoCompra,
  criarOrgao,
  vincularOrgaos,
} from "@/lib/acoes/oportunidade-detalhe";
import { salvarContatoPublico } from "@/lib/acoes/complementos";
import { formatarMoeda, formatarData } from "@/lib/utils";

export type Atividade = {
  id: string;
  tipo_atividade: string;
  data_atividade: string;
  descricao: string | null;
  proximo_passo: string | null;
  data_proximo_passo: string | null;
  visibilidade: string;
};

export type Proposta = {
  id: string;
  numero_proposta: string | null;
  valor: number | null;
  validade: string | null;
  modelo_contratacao: string | null;
  status: string;
  data_envio: string | null;
  observacoes: string | null;
};

export type Processo = {
  id: string;
  tipo_compra_publica: string | null;
  status_compra: string;
  numero_processo_administrativo: string | null;
  numero_edital: string | null;
  portal_compra: string | null;
  data_publicacao: string | null;
  data_sessao: string | null;
  data_homologacao: string | null;
  responsavel_compras: string | null;
  valor_estimado: number | null;
  concorrentes_conhecidos: string | null;
  riscos_identificados: string | null;
  observacoes: string | null;
} | null;

export type Documento = {
  id: string;
  tipo_documento: string;
  nome_documento: string;
  arquivo_url: string | null;
  created_at: string;
};

export type Orgao = { id: string; nome_orgao: string; tipo_orgao: string };

export type ContatoPublico = {
  id: string;
  nome: string;
  cargo: string | null;
  perfil_decisao: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
};

export function DetalheOportunidade({
  oportunidade,
  atividades,
  propostas,
  processo,
  documentos,
  orgaos,
  contatos,
  produtos,
  parceiros,
}: {
  oportunidade: OportunidadeLinha & {
    orgao_publico_id: string | null;
    orgao_faturado_id: string | null;
  };
  atividades: Atividade[];
  propostas: Proposta[];
  processo: Processo;
  documentos: Documento[];
  orgaos: Orgao[];
  contatos: ContatoPublico[];
  produtos: Opcao[];
  parceiros: Opcao[];
}) {
  const [novoOrgaoAberto, setNovoOrgaoAberto] = React.useState(false);
  const [propostaAberta, setPropostaAberta] = React.useState(false);
  const [editandoProposta, setEditandoProposta] = React.useState<Proposta | null>(null);
  const [docAberto, setDocAberto] = React.useState(false);
  const [contatoAberto, setContatoAberto] = React.useState(false);

  const opcoesOrgaos = Object.fromEntries(
    orgaos.map((o) => [o.id, `${o.nome_orgao} (${TIPOS_ORGAO[o.tipo_orgao] ?? o.tipo_orgao})`])
  );

  const FormProposta = ({ proposta }: { proposta?: Proposta | null }) => (
    <>
      <input type="hidden" name="oportunidade_id" value={oportunidade.id} />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Número" nome="numero_proposta" valorInicial={proposta?.numero_proposta} placeholder="Ex.: 2026-001" />
        <CampoTexto rotulo="Valor (R$)" nome="valor" tipo="number" valorInicial={proposta?.valor?.toString()} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao rotulo="Status" nome="status" obrigatorio opcoes={STATUS_PROPOSTA} valorInicial={proposta?.status ?? "em_elaboracao"} />
        <CampoSelecao rotulo="Modelo de contratação" nome="modelo_contratacao" opcoes={TIPOS_COMPRA_PUBLICA} valorInicial={proposta?.modelo_contratacao} permitirVazio />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Data de envio" nome="data_envio" tipo="date" valorInicial={proposta?.data_envio?.slice(0, 10)} />
        <CampoTexto rotulo="Validade" nome="validade" tipo="date" valorInicial={proposta?.validade ?? undefined} />
      </div>
      <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={proposta?.observacoes} />
    </>
  );

  return (
    <Tabs defaultValue="resumo">
      <TabsList>
        <TabsTrigger value="resumo">Resumo</TabsTrigger>
        <TabsTrigger value="atividades">
          <MessageSquare className="size-3.5" />
          Atividades
          {atividades.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">{atividades.length}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="proposta">
          <FileText className="size-3.5" />
          Propostas
          {propostas.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">{propostas.length}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="compra">
          <Landmark className="size-3.5" />
          Compra pública
        </TabsTrigger>
      </TabsList>

      {/* ── Resumo ─────────────────────────────────────────────── */}
      <TabsContent value="resumo" className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px] items-start">
        <Card>
          <CardHeader>
            <CardTitle>Dados do negócio</CardTitle>
          </CardHeader>
          <CardContent>
            <FormAcao acao={salvarOportunidade}>
              <input type="hidden" name="id" value={oportunidade.id} />
              <div className="space-y-4">
                <FormOportunidade
                  oportunidade={oportunidade}
                  produtos={produtos}
                  parceiros={parceiros}
                />
              </div>
            </FormAcao>
          </CardContent>
        </Card>

        <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Órgão e faturamento</CardTitle>
            <CardDescription>
              Quem compra e contra quem será faturado — em vendas públicas, nem sempre é o mesmo órgão.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormAcao acao={vincularOrgaos} rotuloEnviar="Salvar vínculos">
              <input type="hidden" name="oportunidade_id" value={oportunidade.id} />
              <div className="space-y-4">
                <CampoSelecao
                  rotulo="Órgão comprador"
                  nome="orgao_publico_id"
                  opcoes={opcoesOrgaos}
                  valorInicial={oportunidade.orgao_publico_id}
                  permitirVazio
                  rotuloVazio="— Não definido —"
                />
                <CampoSelecao
                  rotulo="Faturado contra"
                  nome="orgao_faturado_id"
                  opcoes={opcoesOrgaos}
                  valorInicial={oportunidade.orgao_faturado_id}
                  permitirVazio
                  rotuloVazio="— Mesmo órgão comprador —"
                />
              </div>
            </FormAcao>
            <Button variant="outline" size="sm" onClick={() => setNovoOrgaoAberto(true)}>
              <Plus className="size-3.5" />
              Cadastrar órgão deste município
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contatos do órgão</CardTitle>
            <CardDescription>
              Quem decide, influencia e opera dentro do órgão comprador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!oportunidade.orgao_publico_id ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Vincule um órgão comprador para registrar contatos.
              </p>
            ) : contatos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Nenhum contato registrado neste órgão ainda.
              </p>
            ) : (
              <ul className="space-y-2">
                {contatos.map((c) => (
                  <li key={c.id} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
                    <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-marca-50 text-marca-700">
                      <UserRound className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{c.nome}</span>
                        {c.perfil_decisao && (
                          <Pilula tom={c.perfil_decisao === "decisor" ? "sucesso" : "neutro"}>
                            {PERFIS_DECISAO[c.perfil_decisao] ?? c.perfil_decisao}
                          </Pilula>
                        )}
                      </p>
                      {c.cargo && <p className="text-xs text-muted-foreground">{c.cargo}</p>}
                      {(c.email || c.telefone || c.whatsapp) && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {[c.email, c.telefone, c.whatsapp && `WhatsApp ${c.whatsapp}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {oportunidade.orgao_publico_id && (
              <Button variant="outline" size="sm" onClick={() => setContatoAberto(true)}>
                <Plus className="size-3.5" />
                Adicionar contato
              </Button>
            )}
          </CardContent>
        </Card>
        </div>
      </TabsContent>

      {/* ── Atividades ─────────────────────────────────────────── */}
      <TabsContent value="atividades" className="mt-4 grid gap-4 lg:grid-cols-[380px_1fr] items-start">
        <Card>
          <CardHeader>
            <CardTitle>Registrar atividade</CardTitle>
            <CardDescription>
              Só o que está registrado gera proteção comercial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormAcao acao={registrarAtividade} rotuloEnviar="Registrar" limparAposSalvar>
              <input type="hidden" name="oportunidade_id" value={oportunidade.id} />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <CampoSelecao rotulo="Tipo" nome="tipo_atividade" obrigatorio opcoes={TIPOS_ATIVIDADE} valorInicial="reuniao" />
                  <CampoTexto rotulo="Data" nome="data_atividade" tipo="date" />
                </div>
                <CampoTextoLongo rotulo="O que aconteceu" nome="descricao" placeholder="Resumo da interação…" />
                <div className="grid grid-cols-[1fr_130px] gap-3">
                  <CampoTexto rotulo="Próximo passo" nome="proximo_passo" />
                  <CampoTexto rotulo="Quando" nome="data_proximo_passo" tipo="date" />
                </div>
                <CampoSelecao rotulo="Visibilidade" nome="visibilidade" obrigatorio opcoes={VISIBILIDADES_ATIVIDADE} valorInicial="interna_doisge" />
              </div>
            </FormAcao>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {atividades.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhuma atividade registrada ainda.
            </div>
          )}
          {atividades.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start gap-3">
                <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-marca-50 text-marca-700">
                  <MessageSquare className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{TIPOS_ATIVIDADE[a.tipo_atividade] ?? a.tipo_atividade}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatarData(a.data_atividade?.slice(0, 10))}
                    </span>
                    <Pilula tom="neutro">{VISIBILIDADES_ATIVIDADE[a.visibilidade] ?? a.visibilidade}</Pilula>
                  </p>
                  {a.descricao && <p className="mt-1 text-sm text-tinta-suave">{a.descricao}</p>}
                  {a.proximo_passo && (
                    <p className="mt-1 text-xs text-marca-700">
                      Próximo passo: {a.proximo_passo}
                      {a.data_proximo_passo && ` (${formatarData(a.data_proximo_passo)})`}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* ── Propostas ──────────────────────────────────────────── */}
      <TabsContent value="proposta" className="mt-4 space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setPropostaAberta(true)}>
            <Plus className="size-4" />
            Nova proposta
          </Button>
        </div>
        {propostas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhuma proposta ainda. A proposta aprovada pode virar contrato.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {propostas.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer transition-colors hover:border-marca-200"
                onClick={() => setEditandoProposta(p)}
              >
                <CardContent className="space-y-1.5">
                  <p className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      Proposta {p.numero_proposta || "sem número"}
                    </span>
                    <Pilula tom={TOM_STATUS_PROPOSTA[p.status] ?? "neutro"}>
                      {STATUS_PROPOSTA[p.status] ?? p.status}
                    </Pilula>
                  </p>
                  <p className="font-mono text-lg font-semibold tabular-nums">
                    {formatarMoeda(p.valor)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.data_envio ? `Enviada em ${formatarData(p.data_envio.slice(0, 10))}` : "Não enviada"}
                    {p.validade && ` · válida até ${formatarData(p.validade)}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* ── Compra pública ─────────────────────────────────────── */}
      <TabsContent value="compra" className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px] items-start">
        <Card>
          <CardHeader>
            <CardTitle>Processo de contratação</CardTitle>
            <CardDescription>
              Acompanhamento formal da compra pública desta oportunidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormAcao acao={salvarProcessoCompra}>
              <input type="hidden" name="oportunidade_id" value={oportunidade.id} />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <CampoSelecao rotulo="Situação" nome="status_compra" obrigatorio opcoes={STATUS_COMPRA_PUBLICA} valorInicial={processo?.status_compra ?? "sem_processo_formal"} />
                  <CampoSelecao rotulo="Modalidade" nome="tipo_compra_publica" opcoes={TIPOS_COMPRA_PUBLICA} valorInicial={processo?.tipo_compra_publica} permitirVazio />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CampoTexto rotulo="Nº processo administrativo" nome="numero_processo_administrativo" valorInicial={processo?.numero_processo_administrativo} />
                  <CampoTexto rotulo="Nº edital" nome="numero_edital" valorInicial={processo?.numero_edital} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <CampoTexto rotulo="Publicação" nome="data_publicacao" tipo="date" valorInicial={processo?.data_publicacao ?? undefined} />
                  <CampoTexto rotulo="Sessão" nome="data_sessao" tipo="date" valorInicial={processo?.data_sessao ?? undefined} />
                  <CampoTexto rotulo="Homologação" nome="data_homologacao" tipo="date" valorInicial={processo?.data_homologacao ?? undefined} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CampoTexto rotulo="Portal de compras" nome="portal_compra" valorInicial={processo?.portal_compra} placeholder="Ex.: Portal de Compras Públicas" />
                  <CampoTexto rotulo="Valor estimado (R$)" nome="valor_estimado" tipo="number" valorInicial={processo?.valor_estimado?.toString()} />
                </div>
                <CampoTexto rotulo="Responsável de compras no órgão" nome="responsavel_compras" valorInicial={processo?.responsavel_compras} />
                <CampoTextoLongo rotulo="Concorrentes conhecidos" nome="concorrentes_conhecidos" valorInicial={processo?.concorrentes_conhecidos} />
                <CampoTextoLongo rotulo="Riscos identificados" nome="riscos_identificados" valorInicial={processo?.riscos_identificados} />
              </div>
            </FormAcao>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
            <CardDescription>
              Termo de referência, edital, atas, empenho…
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!processo && (
              <p className="rounded-lg bg-alerta-fundo px-3 py-2.5 text-sm text-alerta">
                Salve o processo primeiro para anexar documentos.
              </p>
            )}
            {processo && (
              <Button variant="outline" size="sm" onClick={() => setDocAberto(true)}>
                <Plus className="size-3.5" />
                Anexar documento
              </Button>
            )}
            {documentos.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.nome_documento}</p>
                  <p className="text-xs text-muted-foreground">
                    {TIPOS_DOCUMENTO_COMPRA[d.tipo_documento] ?? d.tipo_documento}
                  </p>
                </div>
                {d.arquivo_url && <BotaoBaixar caminho={d.arquivo_url} />}
              </div>
            ))}
            {processo && documentos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Painéis auxiliares ─────────────────────────────────── */}
      <PainelFormulario
        aberto={novoOrgaoAberto}
        aoFechar={() => setNovoOrgaoAberto(false)}
        titulo="Novo órgão público"
        descricao={`Órgão de ${oportunidade.municipios?.nome ?? "—"} · ${oportunidade.municipios?.uf ?? ""}`}
        acao={criarOrgao}
      >
        <input type="hidden" name="municipio_id" value={oportunidade.municipio_id} />
        <input type="hidden" name="oportunidade_id" value={oportunidade.id} />
        <CampoTexto rotulo="Nome do órgão" nome="nome_orgao" obrigatorio placeholder="Ex.: Secretaria de Saúde" />
        <CampoSelecao rotulo="Tipo" nome="tipo_orgao" obrigatorio opcoes={TIPOS_ORGAO} valorInicial="prefeitura" />
        <CampoTexto rotulo="Secretaria" nome="secretaria" />
        <CampoTexto rotulo="Responsável" nome="responsavel" />
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto rotulo="E-mail" nome="email" tipo="email" />
          <CampoTexto rotulo="Telefone" nome="telefone" />
        </div>
      </PainelFormulario>

      <PainelFormulario
        aberto={contatoAberto}
        aoFechar={() => setContatoAberto(false)}
        titulo="Novo contato do órgão"
        descricao="O contato fica vinculado ao órgão comprador desta oportunidade."
        acao={salvarContatoPublico}
      >
        <input type="hidden" name="orgao_publico_id" value={oportunidade.orgao_publico_id ?? ""} />
        <input type="hidden" name="oportunidade_id" value={oportunidade.id} />
        <CampoTexto rotulo="Nome" nome="nome" obrigatorio placeholder="Ex.: Maria da Silva" />
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto rotulo="Cargo" nome="cargo" placeholder="Ex.: Secretária de Saúde" />
          <CampoSelecao
            rotulo="Perfil de decisão"
            nome="perfil_decisao"
            opcoes={PERFIS_DECISAO}
            permitirVazio
            rotuloVazio="— Não definido —"
          />
        </div>
        <CampoTexto rotulo="E-mail" nome="email" tipo="email" />
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto rotulo="Telefone" nome="telefone" />
          <CampoTexto rotulo="WhatsApp" nome="whatsapp" />
        </div>
      </PainelFormulario>

      <PainelFormulario
        aberto={propostaAberta}
        aoFechar={() => setPropostaAberta(false)}
        titulo="Nova proposta"
        acao={salvarProposta}
      >
        <FormProposta />
      </PainelFormulario>

      <PainelFormulario
        key={editandoProposta?.id ?? "nenhuma"}
        aberto={!!editandoProposta}
        aoFechar={() => setEditandoProposta(null)}
        titulo={`Proposta ${editandoProposta?.numero_proposta || ""}`}
        acao={salvarProposta}
        idRegistro={editandoProposta?.id}
      >
        <FormProposta proposta={editandoProposta} />
      </PainelFormulario>

      {processo && (
        <PainelFormulario
          aberto={docAberto}
          aoFechar={() => setDocAberto(false)}
          titulo="Anexar documento"
          descricao="O arquivo fica guardado no cofre de documentos do processo."
          acao={registrarDocumentoCompra}
        >
          <input type="hidden" name="processo_compra_id" value={processo.id} />
          <input type="hidden" name="oportunidade_id" value={oportunidade.id} />
          <CampoTexto rotulo="Nome do documento" nome="nome_documento" obrigatorio placeholder="Ex.: Edital 45/2026" />
          <CampoSelecao rotulo="Tipo" nome="tipo_documento" obrigatorio opcoes={TIPOS_DOCUMENTO_COMPRA} valorInicial="edital" />
          <CampoArquivo nome="arquivo_url" balde="documentos" pasta={oportunidade.id} obrigatorio />
        </PainelFormulario>
      )}
    </Tabs>
  );
}
