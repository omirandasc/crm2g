-- 002: Cadastros centrais — municípios, órgãos, portfólio, produtos, rede, usuários

-- ── Municípios ───────────────────────────────────────────────────
create table public.municipios (
  id uuid primary key default gen_random_uuid(),
  codigo_ibge text not null unique,
  nome text not null,
  uf char(2) not null,
  populacao integer,
  porte porte_municipio generated always as (
    case
      when populacao is null then null
      when populacao <= 5000 then 'ate_5_mil'::porte_municipio
      when populacao <= 10000 then 'de_5_a_10_mil'::porte_municipio
      when populacao <= 25000 then 'de_10_a_25_mil'::porte_municipio
      when populacao <= 50000 then 'de_25_a_50_mil'::porte_municipio
      when populacao <= 100000 then 'de_50_a_100_mil'::porte_municipio
      else 'acima_100_mil'::porte_municipio
    end
  ) stored,
  regiao text generated always as (
    case
      when uf in ('AC','AP','AM','PA','RO','RR','TO') then 'Norte'
      when uf in ('AL','BA','CE','MA','PB','PE','PI','RN','SE') then 'Nordeste'
      when uf in ('DF','GO','MT','MS') then 'Centro-Oeste'
      when uf in ('ES','MG','RJ','SP') then 'Sudeste'
      when uf in ('PR','RS','SC') then 'Sul'
      else null
    end
  ) stored,
  microrregiao text,
  associacao_municipios text,
  prefeito text,
  partido_prefeito text,
  site_oficial text,
  endereco_prefeitura text,
  endereco_entidades text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_municipios_uf on public.municipios (uf);
create index idx_municipios_nome on public.municipios (nome);
create trigger trg_municipios_updated before update on public.municipios
  for each row execute function fn_set_updated_at();

-- ── Órgãos públicos ──────────────────────────────────────────────
create table public.orgaos_publicos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios (id),
  nome_orgao text not null,
  tipo_orgao tipo_orgao not null default 'prefeitura',
  cnpj text,
  endereco text,
  secretaria text,
  responsavel text,
  cargo_responsavel text,
  email text,
  telefone text,
  site text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orgaos_municipio on public.orgaos_publicos (municipio_id);
create trigger trg_orgaos_updated before update on public.orgaos_publicos
  for each row execute function fn_set_updated_at();

-- ── Contatos públicos ────────────────────────────────────────────
create table public.contatos_publicos (
  id uuid primary key default gen_random_uuid(),
  orgao_publico_id uuid not null references public.orgaos_publicos (id) on delete cascade,
  nome text not null,
  cargo text,
  secretaria text,
  email text,
  telefone text,
  whatsapp text,
  midias_sociais text,
  perfil_decisao perfil_decisao,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_contatos_orgao on public.contatos_publicos (orgao_publico_id);
create trigger trg_contatos_updated before update on public.contatos_publicos
  for each row execute function fn_set_updated_at();

-- ── Empresas do Portfólio ────────────────────────────────────────
create table public.empresas_portfolio (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  nome_fantasia text,
  cnpj text unique,
  endereco text,
  cidade text,
  uf char(2),
  site text,
  segmento text,
  descricao text,
  responsavel_principal text,
  email_responsavel text,
  telefone_responsavel text,
  contato_tecnico_nome text,
  contato_tecnico_email text,
  contato_tecnico_telefone text,
  dados_bancarios jsonb,
  status status_empresa_portfolio not null default 'prospectada',
  data_entrada date,
  data_saida date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_empresas_updated before update on public.empresas_portfolio
  for each row execute function fn_set_updated_at();

-- ── Parceiros da Rede ────────────────────────────────────────────
create table public.parceiros_rede (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  nome_fantasia text,
  cnpj text unique,
  tipo_parceiro tipo_parceiro not null default 'revendedor_parceiro',
  endereco text,
  cidade text,
  uf char(2),
  uf_credenciamento char(2),
  regioes_atuacao text[],
  segmentos_conhecimento text[],
  historico_setor_publico text,
  responsavel_principal text,
  email_responsavel text,
  telefone_responsavel text,
  consultor_responsavel text,
  dados_bancarios jsonb,
  status status_parceiro not null default 'prospectado',
  data_entrada date,
  data_saida date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_parceiros_updated before update on public.parceiros_rede
  for each row execute function fn_set_updated_at();

-- ── Sócios (Portfólio e Rede) ────────────────────────────────────
create table public.socios (
  id uuid primary key default gen_random_uuid(),
  entidade text not null check (entidade in ('empresa_portfolio','parceiro_rede')),
  entidade_id uuid not null,
  nome text not null,
  cpf text,
  percentual numeric(5,2),
  email text,
  telefone text,
  observacoes text,
  created_at timestamptz not null default now()
);
create index idx_socios_entidade on public.socios (entidade, entidade_id);

-- ── Certidões (Portfólio e Rede) ─────────────────────────────────
create table public.certidoes (
  id uuid primary key default gen_random_uuid(),
  entidade text not null check (entidade in ('empresa_portfolio','parceiro_rede')),
  entidade_id uuid not null,
  nome text not null,
  arquivo_url text,
  data_validade date,
  status text not null default 'vigente',
  observacoes text,
  created_at timestamptz not null default now()
);
create index idx_certidoes_entidade on public.certidoes (entidade, entidade_id);

-- ── Produtos ─────────────────────────────────────────────────────
create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  empresa_portfolio_id uuid not null references public.empresas_portfolio (id),
  nome_produto text not null,
  descricao_curta text,
  descricao_completa text,
  segmento text,
  vertical text,
  tipo_produto tipo_produto not null default 'saas',
  publico_alvo text,
  dores_que_resolve text,
  diferenciais text,
  modelo_venda text,
  modelo_contratacao_publica_indicado tipo_compra_publica,
  recorrente boolean not null default true,
  prazo_contrato_padrao_meses integer,
  status status_produto not null default 'rascunho',
  data_aprovacao timestamptz,
  aprovado_por uuid,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_produtos_empresa on public.produtos (empresa_portfolio_id);
create trigger trg_produtos_updated before update on public.produtos
  for each row execute function fn_set_updated_at();

-- ── Preços do produto ────────────────────────────────────────────
create table public.precos_produto (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos (id) on delete cascade,
  tipo_preco tipo_preco not null,
  valor numeric(14,2),
  unidade text,
  faixa_inicial integer,
  faixa_final integer,
  preco_compra numeric(14,2),
  preco_venda_sugerido numeric(14,2),
  preco_minimo_permitido numeric(14,2),
  desconto_maximo numeric(5,2),
  margem_referencia numeric(5,2),
  data_inicio_vigencia date,
  data_fim_vigencia date,
  status text not null default 'ativo',
  aprovado_por uuid,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_precos_produto on public.precos_produto (produto_id);
create trigger trg_precos_updated before update on public.precos_produto
  for each row execute function fn_set_updated_at();

-- ── Materiais do produto ─────────────────────────────────────────
create table public.materiais_produto (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos (id) on delete cascade,
  nome_material text not null,
  tipo_material tipo_material not null,
  descricao text,
  arquivo_url text,
  nivel_visibilidade nivel_visibilidade_material not null default 'interno_doisge',
  status text not null default 'ativo',
  uploaded_por uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_materiais_produto on public.materiais_produto (produto_id);
create trigger trg_materiais_updated before update on public.materiais_produto
  for each row execute function fn_set_updated_at();

-- ── Autorização Parceiro × Produto ───────────────────────────────
create table public.autorizacoes_parceiro_produto (
  id uuid primary key default gen_random_uuid(),
  parceiro_rede_id uuid not null references public.parceiros_rede (id),
  produto_id uuid not null references public.produtos (id),
  status status_autorizacao not null default 'solicitada',
  data_solicitacao timestamptz not null default now(),
  data_aprovacao timestamptz,
  aprovado_por uuid,
  data_inicio date,
  data_fim date,
  preco_compra_autorizado numeric(14,2),
  preco_venda_sugerido numeric(14,2),
  preco_minimo_permitido numeric(14,2),
  comissao_doisge numeric(5,2),
  comissao_parceiro numeric(5,2),
  margem_parceiro numeric(5,2),
  regra_faturamento text,
  regra_pagamento text,
  regra_entrega text,
  regra_suporte text,
  qtd_max_municipios_preferenciais integer not null default 10,
  prazo_protecao_oportunidade_dias integer,
  prazo_validade_area_preferencial_dias integer,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parceiro_rede_id, produto_id)
);
create index idx_autorizacoes_parceiro on public.autorizacoes_parceiro_produto (parceiro_rede_id);
create index idx_autorizacoes_produto on public.autorizacoes_parceiro_produto (produto_id);
create trigger trg_autorizacoes_updated before update on public.autorizacoes_parceiro_produto
  for each row execute function fn_set_updated_at();

-- ── Perfis de usuário (ligados ao auth.users) ────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  email text,
  telefone text,
  perfil perfil_acesso not null default 'usuario_consulta',
  empresa_portfolio_id uuid references public.empresas_portfolio (id),
  parceiro_rede_id uuid references public.parceiros_rede (id),
  status status_usuario not null default 'ativo',
  ultimo_acesso timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function fn_set_updated_at();

-- Cria o profile automaticamente quando um usuário é criado no Auth
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'perfil')::perfil_acesso, 'usuario_consulta')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();
