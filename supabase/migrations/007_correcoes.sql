-- 007: Correções aplicadas após os testes de ciclo completo (19/08/2026)

-- FK para juntar solicitações com o perfil do solicitante
alter table public.solicitacoes_aprovacao
  add constraint solicitacoes_solicitante_fkey
  foreign key (solicitante) references public.profiles (id);

-- Contrato já criado como assinado/ativo também converte o território
create or replace function public.fn_contrato_gera_area_exclusiva()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status_contrato in ('assinado','ativo')
     and (tg_op = 'INSERT' or old.status_contrato is distinct from new.status_contrato)
     and new.parceiro_rede_id is not null then

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

    update public.areas_preferenciais
      set status = 'convertida_em_exclusiva'
      where produto_id = new.produto_id
        and municipio_id = new.municipio_id
        and parceiro_rede_id = new.parceiro_rede_id
        and status in ('aprovada','ativa');
  end if;
  return new;
end $$;

drop trigger if exists trg_contrato_area_exclusiva on public.contratos;
create trigger trg_contrato_area_exclusiva
  after insert or update of status_contrato on public.contratos
  for each row execute function public.fn_contrato_gera_area_exclusiva();

-- Parceiro também pode criar oportunidades em cidades EXCLUSIVAS dele
drop policy if exists ins_oportunidade_parceiro on public.oportunidades;
create policy ins_oportunidade_parceiro on public.oportunidades for insert to authenticated
  with check (
    parceiro_rede_id = fn_meu_parceiro()
    and fn_produto_autorizado(produto_id)
    and (
      exists (
        select 1 from public.areas_preferenciais ap
        where ap.produto_id = oportunidades.produto_id
          and ap.municipio_id = oportunidades.municipio_id
          and ap.parceiro_rede_id = fn_meu_parceiro()
          and ap.status in ('aprovada','ativa')
      )
      or exists (
        select 1 from public.areas_exclusivas ae
        where ae.produto_id = oportunidades.produto_id
          and ae.municipio_id = oportunidades.municipio_id
          and ae.parceiro_rede_id = fn_meu_parceiro()
          and ae.status in ('ativa','em_implantacao','em_renovacao')
      )
    ));

-- ── FK para o join historico_alteracoes → profiles (auditoria) ───
alter table public.historico_alteracoes
  add constraint historico_usuario_fkey
  foreign key (usuario_responsavel) references public.profiles (id);

-- ── Limite padrão da Área Preferencial: 10 → 20 cidades ──────────
-- A Governança segue podendo definir um valor diferente por Canal × produto.
alter table public.autorizacoes_parceiro_produto
  alter column qtd_max_municipios_preferenciais set default 20;

create or replace function public.fn_validar_limite_area_preferencial()
returns trigger language plpgsql as $$
declare
  v_limite integer;
  v_atual integer;
begin
  if new.status in ('aprovada','ativa') then
    select coalesce(max(qtd_max_municipios_preferenciais), 20) into v_limite
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

update public.autorizacoes_parceiro_produto
  set qtd_max_municipios_preferenciais = 20
  where qtd_max_municipios_preferenciais = 10;

-- ── E-mail institucional da GovTech ──────────────────────────────
alter table public.empresas_portfolio add column email_institucional text;

-- ── Radar PNCP: palavras-chave monitoradas ───────────────────────
create table public.palavras_chave_pncp (
  id uuid primary key default gen_random_uuid(),
  termo text not null,
  uf char(2),
  ativo boolean not null default true,
  criado_por uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
alter table public.palavras_chave_pncp enable row level security;
create policy sel_palavras_pncp on public.palavras_chave_pncp
  for select to authenticated using (fn_e_doisge_leitura());
create policy all_palavras_pncp_doisge on public.palavras_chave_pncp
  for all to authenticated using (fn_e_doisge()) with check (fn_e_doisge());

-- ── DoisGe isenta do limite de cidades preferenciais (autonomia) ─
create or replace function public.fn_validar_limite_area_preferencial()
returns trigger language plpgsql as $$
declare
  v_limite integer;
  v_atual integer;
begin
  if new.status in ('aprovada','ativa') and not fn_e_doisge() then
    select coalesce(max(qtd_max_municipios_preferenciais), 20) into v_limite
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

-- ── Carteira de 30 cidades por Canal (sem contrato fechado) ──────
alter table public.parceiros_rede
  add column limite_cidades_preferenciais integer not null default 30;

create or replace function public.fn_validar_limite_area_preferencial()
returns trigger language plpgsql as $$
declare
  v_limite integer;
  v_atual integer;
  v_exclusiva integer;
begin
  if new.status in ('aprovada','ativa') then
    select count(*) into v_exclusiva
      from public.areas_exclusivas
      where produto_id = new.produto_id
        and municipio_id = new.municipio_id
        and status in ('ativa','em_implantacao','em_renovacao','mantida_por_direito_economico');
    if v_exclusiva > 0 then
      raise exception 'Esta cidade já é exclusiva de um Canal para este produto.';
    end if;

    select coalesce(limite_cidades_preferenciais, 30) into v_limite
      from public.parceiros_rede
      where id = new.parceiro_rede_id;

    select count(*) into v_atual
      from public.areas_preferenciais
      where parceiro_rede_id = new.parceiro_rede_id
        and status in ('aprovada','ativa')
        and id <> new.id;

    if v_atual >= v_limite then
      raise exception 'Carteira cheia: o limite é de % cidades preferenciais sem contrato fechado. Feche contrato numa delas para abrir vaga.', v_limite;
    end if;
  end if;
  return new;
end $$;

drop policy ins_area_pref_parceiro on public.areas_preferenciais;
create policy ins_area_pref_parceiro on public.areas_preferenciais for insert to authenticated
  with check (parceiro_rede_id = fn_meu_parceiro()
    and status in ('solicitada','ativa')
    and fn_produto_autorizado(produto_id));

-- ── Múltiplas UFs de credenciamento + cidade dentro das UFs ──────
alter table public.parceiros_rede
  add column ufs_credenciamento text[] not null default '{}';

update public.parceiros_rede
  set ufs_credenciamento = array[uf_credenciamento]
  where uf_credenciamento is not null and uf_credenciamento <> '';

create or replace function public.fn_validar_limite_area_preferencial()
returns trigger language plpgsql as $$
declare
  v_limite integer;
  v_atual integer;
  v_exclusiva integer;
  v_ufs text[];
  v_uf_municipio text;
begin
  if new.status in ('aprovada','ativa') then
    select count(*) into v_exclusiva
      from public.areas_exclusivas
      where produto_id = new.produto_id
        and municipio_id = new.municipio_id
        and status in ('ativa','em_implantacao','em_renovacao','mantida_por_direito_economico');
    if v_exclusiva > 0 then
      raise exception 'Esta cidade já é exclusiva de um Canal para este produto.';
    end if;

    select coalesce(ufs_credenciamento, '{}'), coalesce(limite_cidades_preferenciais, 30)
      into v_ufs, v_limite
      from public.parceiros_rede
      where id = new.parceiro_rede_id;

    if array_length(v_ufs, 1) is not null then
      select uf into v_uf_municipio from public.municipios where id = new.municipio_id;
      if not (v_uf_municipio = any(v_ufs)) then
        raise exception 'Cidade fora das UFs de credenciamento deste Canal (%).', array_to_string(v_ufs, ', ');
      end if;
    end if;

    select count(*) into v_atual
      from public.areas_preferenciais
      where parceiro_rede_id = new.parceiro_rede_id
        and status in ('aprovada','ativa')
        and id <> new.id;

    if v_atual >= v_limite then
      raise exception 'Carteira cheia: o limite é de % cidades preferenciais sem contrato fechado. Feche contrato numa delas para abrir vaga.', v_limite;
    end if;
  end if;
  return new;
end $$;

-- ── Aba "Negócio" da GovTech (acordo DoisGe ↔ GovTech) ───────────
-- (importação da planilha Funil do Portfólio feita em produção em 28/08/2026)
alter table public.empresas_portfolio
  add column if not exists modelo_negocio text,
  add column if not exists modulos text[],
  add column if not exists proposta_trabalho text,
  add column if not exists condicoes_financeiras text,
  add column if not exists modelo_distribuicao text,
  add column if not exists remuneracao_canal text;
