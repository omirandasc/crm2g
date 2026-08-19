-- 004: Contratos, parcelas, área exclusiva, comissões e entregas

-- ── Contratos ────────────────────────────────────────────────────
create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  oportunidade_id uuid not null references public.oportunidades (id),
  proposta_id uuid references public.propostas (id),
  processo_compra_id uuid references public.processos_compra_publica (id),
  produto_id uuid not null references public.produtos (id),
  empresa_portfolio_id uuid references public.empresas_portfolio (id),
  parceiro_rede_id uuid references public.parceiros_rede (id),
  municipio_id uuid not null references public.municipios (id),
  orgao_publico_id uuid references public.orgaos_publicos (id),
  numero_contrato text,
  numero_processo text,
  tipo_compra_publica tipo_compra_publica,
  data_assinatura date,
  inicio_vigencia date,
  fim_vigencia date,
  prazo_meses integer,
  valor_mensal numeric(14,2),
  valor_anual numeric(14,2),
  valor_total numeric(14,2),
  recorrente boolean not null default true,
  indice_reajuste text,
  data_base_reajuste date,
  possibilidade_renovacao boolean,
  status_contrato status_contrato not null default 'em_elaboracao',
  status_financeiro text,
  status_entrega text,
  arquivo_contrato_url text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_contratos_oportunidade on public.contratos (oportunidade_id);
create index idx_contratos_parceiro on public.contratos (parceiro_rede_id);
create index idx_contratos_municipio on public.contratos (municipio_id);
create trigger trg_contratos_updated before update on public.contratos
  for each row execute function fn_set_updated_at();

-- ── Parcelas / Competências ──────────────────────────────────────
create table public.parcelas_contrato (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos (id) on delete cascade,
  competencia text not null, -- formato AAAA-MM
  data_prevista_faturamento date,
  data_faturamento date,
  data_prevista_recebimento date,
  data_recebimento date,
  valor_bruto numeric(14,2),
  descontos numeric(14,2) default 0,
  impostos numeric(14,2) default 0,
  valor_liquido numeric(14,2),
  status status_parcela not null default 'prevista',
  nota_fiscal text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contrato_id, competencia)
);
create trigger trg_parcelas_updated before update on public.parcelas_contrato
  for each row execute function fn_set_updated_at();

-- Gera parcelas mensais para um contrato recorrente (chamada via RPC)
create or replace function public.fn_gerar_parcelas(p_contrato_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  c record;
  v_data date;
  v_qtd integer := 0;
begin
  select * into c from public.contratos where id = p_contrato_id;
  if c is null then raise exception 'Contrato não encontrado.'; end if;
  if not c.recorrente or c.inicio_vigencia is null or c.fim_vigencia is null then
    raise exception 'Contrato precisa ser recorrente e ter vigência definida.';
  end if;
  v_data := date_trunc('month', c.inicio_vigencia)::date;
  while v_data <= c.fim_vigencia loop
    insert into public.parcelas_contrato
      (contrato_id, competencia, data_prevista_faturamento, valor_bruto, valor_liquido)
    values
      (c.id, to_char(v_data, 'YYYY-MM'), v_data, c.valor_mensal, c.valor_mensal)
    on conflict (contrato_id, competencia) do nothing;
    v_qtd := v_qtd + 1;
    v_data := (v_data + interval '1 month')::date;
  end loop;
  return v_qtd;
end $$;

-- ── Área Exclusiva ───────────────────────────────────────────────
create table public.areas_exclusivas (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos (id),
  parceiro_rede_id uuid not null references public.parceiros_rede (id),
  municipio_id uuid not null references public.municipios (id),
  contrato_id uuid not null references public.contratos (id),
  status status_area_exclusiva not null default 'ativa',
  data_inicio date not null default current_date,
  data_fim date,
  motivo_encerramento text,
  direito_economico_mantido boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_area_excl_produto_municipio_ativa
  on public.areas_exclusivas (produto_id, municipio_id)
  where status in ('ativa','em_implantacao','em_renovacao');
create index idx_area_excl_parceiro on public.areas_exclusivas (parceiro_rede_id);
create trigger trg_area_excl_updated before update on public.areas_exclusivas
  for each row execute function fn_set_updated_at();

-- Contrato assinado converte área preferencial em exclusiva (e libera a vaga)
create or replace function public.fn_contrato_gera_area_exclusiva()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status_contrato in ('assinado','ativo')
     and (old.status_contrato is distinct from new.status_contrato)
     and new.parceiro_rede_id is not null then

    -- cria a área exclusiva, se ainda não existir para este contrato
    insert into public.areas_exclusivas (produto_id, parceiro_rede_id, municipio_id, contrato_id)
    select new.produto_id, new.parceiro_rede_id, new.municipio_id, new.id
    where not exists (
      select 1 from public.areas_exclusivas
      where contrato_id = new.id
    )
    and not exists (
      select 1 from public.areas_exclusivas
      where produto_id = new.produto_id and municipio_id = new.municipio_id
        and status in ('ativa','em_implantacao','em_renovacao')
    );

    -- converte a área preferencial correspondente (libera vaga das 10 cidades)
    update public.areas_preferenciais
      set status = 'convertida_em_exclusiva'
      where produto_id = new.produto_id
        and municipio_id = new.municipio_id
        and parceiro_rede_id = new.parceiro_rede_id
        and status in ('aprovada','ativa');
  end if;
  return new;
end $$;

create trigger trg_contrato_area_exclusiva
  after update of status_contrato on public.contratos
  for each row execute function public.fn_contrato_gera_area_exclusiva();

-- ── Regras de Comissão ───────────────────────────────────────────
create table public.regras_comissao (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid references public.produtos (id),
  empresa_portfolio_id uuid references public.empresas_portfolio (id),
  parceiro_rede_id uuid references public.parceiros_rede (id),
  tipo_comissao tipo_comissao not null,
  beneficiario text not null,
  base_calculo base_calculo_comissao not null,
  percentual numeric(5,2),
  valor_fixo numeric(14,2),
  periodo_aplicacao text,
  inicio_vigencia date,
  fim_vigencia date,
  condicao_pagamento condicao_pagamento_comissao,
  status text not null default 'em_aprovacao',
  aprovado_por uuid,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_regras_comissao_produto on public.regras_comissao (produto_id);
create trigger trg_regras_comissao_updated before update on public.regras_comissao
  for each row execute function fn_set_updated_at();

-- ── Comissões ────────────────────────────────────────────────────
create table public.comissoes (
  id uuid primary key default gen_random_uuid(),
  regra_comissao_id uuid not null references public.regras_comissao (id),
  contrato_id uuid references public.contratos (id),
  parcela_id uuid references public.parcelas_contrato (id),
  produto_id uuid references public.produtos (id),
  empresa_portfolio_id uuid references public.empresas_portfolio (id),
  parceiro_rede_id uuid references public.parceiros_rede (id),
  beneficiario text not null,
  competencia text,
  data_faturamento date,
  data_recebimento date,
  valor_base numeric(14,2),
  percentual numeric(5,2),
  valor_fixo numeric(14,2),
  valor_comissao numeric(14,2),
  data_prevista_pagamento date,
  data_pagamento date,
  status status_comissao not null default 'prevista',
  visivel_parceiro boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (contrato_id is not null or parcela_id is not null)
);
create index idx_comissoes_contrato on public.comissoes (contrato_id);
create index idx_comissoes_parceiro on public.comissoes (parceiro_rede_id);
create trigger trg_comissoes_updated before update on public.comissoes
  for each row execute function fn_set_updated_at();

-- ── Entregas / Implantações ──────────────────────────────────────
create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid references public.contratos (id),
  oportunidade_id uuid references public.oportunidades (id),
  produto_id uuid references public.produtos (id),
  empresa_portfolio_id uuid references public.empresas_portfolio (id),
  parceiro_rede_id uuid references public.parceiros_rede (id),
  municipio_id uuid references public.municipios (id),
  orgao_publico_id uuid references public.orgaos_publicos (id),
  responsavel_entrega text,
  tipo_responsavel tipo_responsavel_entrega not null default 'portfolio',
  status_entrega status_entrega not null default 'nao_iniciada',
  data_inicio date,
  data_prevista_conclusao date,
  data_conclusao date,
  pendencias text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (contrato_id is not null or oportunidade_id is not null)
);
create index idx_entregas_contrato on public.entregas (contrato_id);
create trigger trg_entregas_updated before update on public.entregas
  for each row execute function fn_set_updated_at();
