-- 005: Governança — políticas, solicitações, auditoria

-- ── Políticas comerciais ─────────────────────────────────────────
create table public.politicas_comerciais (
  id uuid primary key default gen_random_uuid(),
  nome_politica text not null,
  empresa_portfolio_id uuid references public.empresas_portfolio (id),
  produto_id uuid references public.produtos (id),
  parceiro_rede_id uuid references public.parceiros_rede (id),
  tipo_politica tipo_politica not null,
  descricao text,
  parametros jsonb,
  data_inicio date,
  data_fim date,
  status text not null default 'ativa',
  aprovado_por uuid,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_politicas_updated before update on public.politicas_comerciais
  for each row execute function fn_set_updated_at();

-- ── Solicitações de aprovação ────────────────────────────────────
create table public.solicitacoes_aprovacao (
  id uuid primary key default gen_random_uuid(),
  tipo_solicitacao tipo_solicitacao not null,
  solicitante uuid not null,
  perfil_solicitante perfil_acesso,
  entidade text,
  entidade_id uuid,
  descricao text,
  status status_solicitacao not null default 'solicitada',
  data_solicitacao timestamptz not null default now(),
  data_decisao timestamptz,
  decidido_por uuid,
  motivo_decisao text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_solicitacoes_status on public.solicitacoes_aprovacao (status);
create trigger trg_solicitacoes_updated before update on public.solicitacoes_aprovacao
  for each row execute function fn_set_updated_at();

-- ── Histórico de alterações (auditoria) ──────────────────────────
create table public.historico_alteracoes (
  id bigint generated always as identity primary key,
  entidade text not null,
  entidade_id uuid not null,
  campo_alterado text not null,
  valor_anterior text,
  valor_novo text,
  usuario_responsavel uuid,
  data_alteracao timestamptz not null default now(),
  motivo text,
  observacoes text
);
create index idx_historico_entidade on public.historico_alteracoes (entidade, entidade_id);

-- Trigger genérico: grava o diff campo a campo de tabelas críticas
create or replace function public.fn_registrar_historico()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
  v_key text;
begin
  for v_key in select jsonb_object_keys(v_new) loop
    if v_key in ('updated_at','created_at') then continue; end if;
    if v_old -> v_key is distinct from v_new -> v_key then
      insert into public.historico_alteracoes
        (entidade, entidade_id, campo_alterado, valor_anterior, valor_novo, usuario_responsavel)
      values
        (tg_table_name, (v_new ->> 'id')::uuid, v_key,
         v_old ->> v_key, v_new ->> v_key, auth.uid());
    end if;
  end loop;
  return new;
end $$;

-- Tabelas críticas auditadas (preço, comissão, área, contrato, autorização, status)
create trigger trg_hist_precos after update on public.precos_produto
  for each row execute function public.fn_registrar_historico();
create trigger trg_hist_autorizacoes after update on public.autorizacoes_parceiro_produto
  for each row execute function public.fn_registrar_historico();
create trigger trg_hist_areas_pref after update on public.areas_preferenciais
  for each row execute function public.fn_registrar_historico();
create trigger trg_hist_areas_excl after update on public.areas_exclusivas
  for each row execute function public.fn_registrar_historico();
create trigger trg_hist_contratos after update on public.contratos
  for each row execute function public.fn_registrar_historico();
create trigger trg_hist_regras_comissao after update on public.regras_comissao
  for each row execute function public.fn_registrar_historico();
create trigger trg_hist_comissoes after update on public.comissoes
  for each row execute function public.fn_registrar_historico();
create trigger trg_hist_oportunidades after update on public.oportunidades
  for each row execute function public.fn_registrar_historico();
create trigger trg_hist_politicas after update on public.politicas_comerciais
  for each row execute function public.fn_registrar_historico();
