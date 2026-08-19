-- 001: Extensões, enums e funções utilitárias
create extension if not exists "pgcrypto";

-- ── Perfis de acesso ─────────────────────────────────────────────
create type perfil_acesso as enum (
  'administrador_geral','governanca_doisge','gestor_comercial_doisge',
  'gestor_financeiro_doisge','gestor_contratos_doisge',
  'usuario_portfolio','administrador_portfolio',
  'usuario_rede','administrador_rede','usuario_consulta'
);

create type status_usuario as enum ('ativo','inativo','suspenso');

-- ── Portfólio / Produto ──────────────────────────────────────────
create type status_empresa_portfolio as enum (
  'prospectada','em_negociacao','contrato_em_elaboracao','ativa','suspensa','encerrada'
);

create type status_produto as enum (
  'rascunho','enviado_para_aprovacao','aprovado','ativo','suspenso','encerrado'
);

create type tipo_produto as enum ('saas','fisico','servico','hibrido');

create type tipo_preco as enum (
  'mensalidade','anual','por_usuario','por_habitante','por_kit','por_servico',
  'por_implantacao','valor_unico','tabela_faixa','a_consultar'
);

create type tipo_material as enum (
  'apresentacao_comercial','proposta_modelo','contrato_modelo','termo_referencia',
  'estudo_tecnico_preliminar','justificativa_contratacao','atestado_tecnico',
  'carta_exclusividade','tabela_precos','perguntas_frequentes','video','manual',
  'documento_tecnico','documento_juridico','material_implantacao','material_suporte'
);

create type nivel_visibilidade_material as enum (
  'interno_doisge','portfolio','rede_autorizada','publico','restrito'
);

-- ── Rede / Parceiro ──────────────────────────────────────────────
create type tipo_parceiro as enum (
  'canal_comercial','revendedor_distribuidor','revendedor_parceiro','parceiro_servico',
  'consultor','representante_regional','parceiro_institucional'
);

create type status_parceiro as enum (
  'prospectado','em_qualificacao','contrato_em_elaboracao','ativo','suspenso',
  'inativo','descredenciado','encerrado'
);

create type status_autorizacao as enum (
  'solicitada','em_analise','aprovada','ativa','suspensa','encerrada','cancelada'
);

-- ── Município / Órgão ────────────────────────────────────────────
create type porte_municipio as enum (
  'ate_5_mil','de_5_a_10_mil','de_10_a_25_mil','de_25_a_50_mil','de_50_a_100_mil','acima_100_mil'
);

create type tipo_orgao as enum (
  'prefeitura','secretaria_municipal','camara_municipal','autarquia','fundacao',
  'consorcio_publico','hospital_publico','escola_rede_publica','outro'
);

create type perfil_decisao as enum (
  'decisor','influenciador','facilitador','tecnico','compras_licitacao','juridico',
  'financeiro','operacional','usuario_final'
);

-- ── Território comercial ─────────────────────────────────────────
create type status_area_preferencial as enum (
  'solicitada','em_analise','aprovada','ativa','rejeitada','vencida','cancelada',
  'liberada','convertida_em_exclusiva'
);

create type status_area_exclusiva as enum (
  'ativa','em_implantacao','suspensa','encerrada','cancelada','em_renovacao',
  'mantida_por_direito_economico'
);

-- ── Comercial ────────────────────────────────────────────────────
create type origem_oportunidade as enum (
  'doisge','parceiro','empresa_portfolio','indicacao','evento',
  'relacionamento_institucional','demanda_espontanea','licitacao','outro'
);

create type etapa_comercial as enum (
  'lead_identificado','oportunidade_cadastrada','qualificacao_inicial','diagnostico_da_dor',
  'reuniao_realizada','solucao_apresentada','interesse_validado','proposta_solicitada',
  'proposta_enviada','modelo_contratacao_definido','processo_compra_iniciado',
  'compra_em_andamento','negociacao','contrato_em_elaboracao','fechado_ganho',
  'fechado_perdido','suspenso'
);

create type status_oportunidade as enum (
  'aberta','em_andamento','ganha','perdida','suspensa','cancelada'
);

create type tipo_atividade as enum (
  'ligacao','reuniao','whatsapp','email','visita_presencial','apresentacao',
  'proposta_enviada','follow_up','negociacao','evento','registro_interno','pendencia',
  'atualizacao_compra_publica','atualizacao_entrega'
);

create type visibilidade_atividade as enum (
  'interna_doisge','visivel_portfolio','visivel_rede','visivel_portfolio_e_rede','restrita'
);

create type status_proposta as enum (
  'solicitada','em_elaboracao','enviada','em_negociacao','aprovada','recusada',
  'vencida','substituida'
);

-- ── Compra pública ───────────────────────────────────────────────
create type tipo_compra_publica as enum (
  'inexigibilidade','dispensa_compra_direta','pregao','concorrencia','registro_precos',
  'adesao_ata','credenciamento','chamamento_publico','termo_cooperacao',
  'contrato_administrativo','outro'
);

create type status_compra_publica as enum (
  'sem_processo_formal','demanda_identificada','termo_referencia_em_elaboracao',
  'cotacao_orcamento','processo_administrativo_aberto','parecer_juridico',
  'edital_em_elaboracao','edital_publicado','sessao_agendada','em_disputa',
  'aguardando_homologacao','homologado','empenho_emitido','contrato_em_elaboracao',
  'contrato_assinado','perdido','cancelado','suspenso'
);

create type tipo_documento_compra as enum (
  'termo_referencia','estudo_tecnico_preliminar','justificativa_contratacao',
  'justificativa_preco','razao_escolha_fornecedor','carta_exclusividade',
  'atestado_tecnico','parecer_juridico','cotacao','edital','ata_sessao','homologacao',
  'empenho','contrato','publicacao','recurso','outro'
);

-- ── Contrato / Financeiro ────────────────────────────────────────
create type status_contrato as enum (
  'em_elaboracao','enviado_para_assinatura','assinado','aguardando_implantacao',
  'em_implantacao','ativo','em_renovacao','renovado','suspenso','encerrado',
  'cancelado','inadimplente','substituido'
);

create type status_parcela as enum (
  'prevista','faturada','recebida','atrasada','cancelada','suspensa'
);

create type tipo_comissao as enum (
  'comissao_doisge','comissao_parceiro','comissao_indicacao','comissao_implantacao',
  'comissao_recorrente','comissao_primeiro_contrato','comissao_por_mensalidade',
  'comissao_parceiro_ativo','bonus_sucesso','participacao_projeto'
);

create type base_calculo_comissao as enum (
  'valor_bruto_contratado','valor_liquido_contratado','valor_faturado','valor_recebido',
  'mensalidade','valor_implantacao','valor_fixo','outro'
);

create type condicao_pagamento_comissao as enum (
  'na_assinatura','no_faturamento','no_recebimento','mensal','anual','por_competencia',
  'apos_implantacao','primeiros_12_meses','enquanto_contrato_ativo','conforme_aditivo'
);

create type status_comissao as enum (
  'prevista','provisionada','faturada','recebida','calculada','aprovada','a_pagar',
  'paga','suspensa','contestada','cancelada'
);

-- ── Entrega ──────────────────────────────────────────────────────
create type tipo_responsavel_entrega as enum (
  'portfolio','parceiro_rede','doisge','compartilhado','terceiro'
);

create type status_entrega as enum (
  'nao_iniciada','aguardando_contrato_empenho','aguardando_dados_cliente','em_preparacao',
  'em_implantacao','treinamento_agendado','entregue','implantacao_concluida','em_suporte',
  'pendente_cliente','pendente_portfolio','pendente_parceiro','finalizada','cancelada'
);

-- ── Governança ───────────────────────────────────────────────────
create type tipo_politica as enum (
  'preco','desconto','comissao','area_preferencial','area_exclusiva','faturamento',
  'pagamento','entrega','suporte','renovacao','direito_economico','descredenciamento',
  'protecao_oportunidade'
);

create type tipo_solicitacao as enum (
  'aprovacao_produto','autorizacao_parceiro_produto','area_preferencial','excecao_preco',
  'excecao_comissao','liberacao_material','criacao_oportunidade_fora_area',
  'alteracao_parametro_contrato','cancelamento_area','liberacao_visibilidade_portfolio','outro'
);

create type status_solicitacao as enum (
  'solicitada','em_analise','aprovada','rejeitada','cancelada','devolvida_para_ajuste'
);

-- ── Função utilitária: updated_at automático ─────────────────────
create or replace function public.fn_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
