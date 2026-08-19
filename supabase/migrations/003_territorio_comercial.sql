-- 003: Território (área preferencial) e funil comercial

-- ── Área Preferencial ────────────────────────────────────────────
create table public.areas_preferenciais (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos (id),
  parceiro_rede_id uuid not null references public.parceiros_rede (id),
  municipio_id uuid not null references public.municipios (id),
  status status_area_preferencial not null default 'solicitada',
  data_solicitacao timestamptz not null default now(),
  data_aprovacao timestamptz,
  aprovado_por uuid,
  data_inicio date,
  data_fim date,
  prazo_validade date,
  ultima_movimentacao_comercial timestamptz,
  justificativa text,
  motivo_rejeicao text,
  motivo_cancelamento text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Não pode haver duas áreas preferenciais ativas para o mesmo produto + município
create unique index uq_area_pref_produto_municipio_ativa
  on public.areas_preferenciais (produto_id, municipio_id)
  where status in ('aprovada','ativa');
create index idx_area_pref_parceiro on public.areas_preferenciais (parceiro_rede_id);
create index idx_area_pref_municipio on public.areas_preferenciais (municipio_id);
create trigger trg_area_pref_updated before update on public.areas_preferenciais
  for each row execute function fn_set_updated_at();

-- Trava: parceiro não pode exceder o limite de municípios preferenciais (padrão 10)
create or replace function public.fn_validar_limite_area_preferencial()
returns trigger language plpgsql as $$
declare
  v_limite integer;
  v_atual integer;
begin
  if new.status in ('aprovada','ativa') then
    select coalesce(max(qtd_max_municipios_preferenciais), 10) into v_limite
      from public.autorizacoes_parceiro_produto
      where parceiro_rede_id = new.parceiro_rede_id
        and produto_id = new.produto_id
        and status = 'ativa';

    select count(*) into v_atual
      from public.areas_preferenciais
      where parceiro_rede_id = new.parceiro_rede_id
        and produto_id = new.produto_id
        and status in ('aprovada','ativa')
        and id <> new.id;

    if v_atual >= v_limite then
      raise exception 'Limite de % municípios na Área Preferencial atingido para este produto.', v_limite;
    end if;
  end if;
  return new;
end $$;

create trigger trg_limite_area_preferencial
  before insert or update of status on public.areas_preferenciais
  for each row execute function public.fn_validar_limite_area_preferencial();

-- ── Oportunidades ────────────────────────────────────────────────
create table public.oportunidades (
  id uuid primary key default gen_random_uuid(),
  codigo serial,
  nome_oportunidade text not null,
  produto_id uuid not null references public.produtos (id),
  empresa_portfolio_id uuid references public.empresas_portfolio (id),
  parceiro_rede_id uuid references public.parceiros_rede (id),
  municipio_id uuid not null references public.municipios (id),
  orgao_publico_id uuid references public.orgaos_publicos (id),
  orgao_faturado_id uuid references public.orgaos_publicos (id), -- "Faturado Contra"
  origem origem_oportunidade not null default 'parceiro',
  etapa_comercial etapa_comercial not null default 'lead_identificado',
  status status_oportunidade not null default 'aberta',
  valor_tabela numeric(14,2),
  valor_venda numeric(14,2),
  valor_portfolio numeric(14,2),
  valor_doisge numeric(14,2),
  valor_estimado numeric(14,2),
  probabilidade integer check (probabilidade between 0 and 100),
  data_abertura date not null default current_date,
  previsao_fechamento date,
  dor_identificada text,
  tipo_compra_publica_previsto tipo_compra_publica,
  responsavel_doisge uuid,
  responsavel_parceiro uuid,
  visibilidade_portfolio boolean not null default true,
  proximo_passo text,
  data_proximo_passo date,
  motivo_perda text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_oport_produto on public.oportunidades (produto_id);
create index idx_oport_parceiro on public.oportunidades (parceiro_rede_id);
create index idx_oport_municipio on public.oportunidades (municipio_id);
create index idx_oport_etapa on public.oportunidades (etapa_comercial);
create trigger trg_oport_updated before update on public.oportunidades
  for each row execute function fn_set_updated_at();

-- Preenche a empresa do Portfólio a partir do produto
create or replace function public.fn_oportunidade_empresa()
returns trigger language plpgsql as $$
begin
  select empresa_portfolio_id into new.empresa_portfolio_id
    from public.produtos where id = new.produto_id;
  return new;
end $$;

create trigger trg_oport_empresa
  before insert or update of produto_id on public.oportunidades
  for each row execute function public.fn_oportunidade_empresa();

-- Registra movimentação comercial na área preferencial correspondente
create or replace function public.fn_oportunidade_movimenta_area()
returns trigger language plpgsql as $$
begin
  update public.areas_preferenciais
    set ultima_movimentacao_comercial = now()
    where produto_id = new.produto_id
      and municipio_id = new.municipio_id
      and parceiro_rede_id = new.parceiro_rede_id
      and status in ('aprovada','ativa');
  return new;
end $$;

create trigger trg_oport_movimenta_area
  after insert or update on public.oportunidades
  for each row execute function public.fn_oportunidade_movimenta_area();

-- ── Atividades comerciais ────────────────────────────────────────
create table public.atividades_comerciais (
  id uuid primary key default gen_random_uuid(),
  entidade text not null check (entidade in
    ('oportunidade','contrato','parceiro_rede','empresa_portfolio','municipio','orgao_publico')),
  entidade_id uuid not null,
  oportunidade_id uuid references public.oportunidades (id) on delete cascade,
  tipo_atividade tipo_atividade not null,
  data_atividade timestamptz not null default now(),
  responsavel uuid,
  participantes text,
  descricao text,
  proximo_passo text,
  data_proximo_passo date,
  anexos jsonb,
  visibilidade visibilidade_atividade not null default 'interna_doisge',
  created_at timestamptz not null default now()
);
create index idx_atividades_entidade on public.atividades_comerciais (entidade, entidade_id);
create index idx_atividades_oportunidade on public.atividades_comerciais (oportunidade_id);

-- Atividade em oportunidade também conta como movimentação da área
create or replace function public.fn_atividade_movimenta_area()
returns trigger language plpgsql as $$
begin
  if new.oportunidade_id is not null then
    update public.areas_preferenciais ap
      set ultima_movimentacao_comercial = now()
      from public.oportunidades o
      where o.id = new.oportunidade_id
        and ap.produto_id = o.produto_id
        and ap.municipio_id = o.municipio_id
        and ap.parceiro_rede_id = o.parceiro_rede_id
        and ap.status in ('aprovada','ativa');
  end if;
  return new;
end $$;

create trigger trg_atividade_movimenta_area
  after insert on public.atividades_comerciais
  for each row execute function public.fn_atividade_movimenta_area();

-- ── Propostas ────────────────────────────────────────────────────
create table public.propostas (
  id uuid primary key default gen_random_uuid(),
  oportunidade_id uuid not null references public.oportunidades (id),
  numero_proposta text,
  valor numeric(14,2),
  validade date,
  modelo_contratacao tipo_compra_publica,
  status status_proposta not null default 'solicitada',
  data_solicitacao timestamptz not null default now(),
  data_envio timestamptz,
  data_aceite timestamptz,
  responsavel uuid,
  arquivo_url text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_propostas_oportunidade on public.propostas (oportunidade_id);
create trigger trg_propostas_updated before update on public.propostas
  for each row execute function fn_set_updated_at();

-- ── Processo de Compra Pública ───────────────────────────────────
create table public.processos_compra_publica (
  id uuid primary key default gen_random_uuid(),
  oportunidade_id uuid not null unique references public.oportunidades (id),
  tipo_compra_publica tipo_compra_publica,
  status_compra status_compra_publica not null default 'sem_processo_formal',
  numero_processo_administrativo text,
  numero_edital text,
  portal_compra text,
  data_publicacao date,
  data_sessao date,
  data_homologacao date,
  responsavel_demanda text,
  responsavel_compras text,
  responsavel_juridico text,
  valor_estimado numeric(14,2),
  concorrentes_conhecidos text,
  riscos_identificados text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_processos_updated before update on public.processos_compra_publica
  for each row execute function fn_set_updated_at();

-- ── Documentos de Compra Pública ─────────────────────────────────
create table public.documentos_compra_publica (
  id uuid primary key default gen_random_uuid(),
  processo_compra_id uuid not null references public.processos_compra_publica (id) on delete cascade,
  tipo_documento tipo_documento_compra not null,
  nome_documento text not null,
  arquivo_url text,
  uploaded_por uuid,
  status text,
  observacoes text,
  created_at timestamptz not null default now()
);
create index idx_docs_compra_processo on public.documentos_compra_publica (processo_compra_id);
