-- ════════════════════════════════════════════════════════════════
-- Blindagem de segurança — auditoria de 24/09/2026
-- Aplicar no SQL Editor do Supabase (projeto CRM-2G) de uma vez só.
-- ════════════════════════════════════════════════════════════════

-- ── 1) Conta nova nunca escolhe o próprio perfil ────────────────
-- Antes, fn_handle_new_user lia 'perfil' de raw_user_meta_data, que é
-- controlado por quem se cadastra. Com o cadastro público aberto, bastava
-- enviar {"perfil":"administrador_geral"} para virar administrador.
-- Agora todo usuário nasce sem acesso; quem promove é a Governança pela
-- edge function admin-usuarios (que roda com service_role).
create or replace function fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, perfil, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    'usuario_rede'::perfil_acesso,
    'inativo'::status_usuario
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- ── 2) Ninguém muda o próprio nível de acesso ───────────────────
-- A política upd_profile_proprio deixa o usuário editar a própria linha —
-- inclusive as colunas perfil, status e vínculos. Este gatilho separa o que
-- é dado pessoal do que é permissão.
create or replace function fn_protege_acesso_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() nulo = chamada com service_role (edge function admin-usuarios,
  -- migrações). Governança segue podendo administrar pelas telas.
  if auth.uid() is null or fn_e_doisge() then
    return new;
  end if;

  if new.perfil is distinct from old.perfil
     or new.status is distinct from old.status
     or new.empresa_portfolio_id is distinct from old.empresa_portfolio_id
     or new.parceiro_rede_id is distinct from old.parceiro_rede_id then
    raise exception 'Você não pode alterar seu nível de acesso. Fale com a Governança DoisGe.';
  end if;

  return new;
end $$;

drop trigger if exists trg_profiles_protege_acesso on profiles;
create trigger trg_profiles_protege_acesso
  before update on profiles
  for each row execute function fn_protege_acesso_profile();

-- ── 3) Gerar parcelas exige ser da DoisGe ───────────────────────
-- A função é SECURITY DEFINER (ignora RLS) e estava executável sem login:
-- POST /rest/v1/rpc/fn_gerar_parcelas com a chave pública já entrava nela.
create or replace function fn_gerar_parcelas(p_contrato_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  v_data date;
  v_qtd integer := 0;
begin
  if not fn_e_doisge() then
    raise exception 'Apenas a DoisGe (Governança) pode gerar as parcelas do contrato.';
  end if;

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

-- ── 4) Fechar a porta da chave pública (anon) ───────────────────
-- Toda função nasce com EXECUTE para PUBLIC. Como são SECURITY DEFINER,
-- cada uma é uma porta que ignora RLS. Quem precisa continuar chamando é o
-- usuário logado (authenticated) — as políticas de RLS dependem disso.
revoke execute on function public.fn_gerar_parcelas(uuid) from public, anon;
revoke execute on function public.fn_excluir_contrato(uuid) from public, anon;
revoke execute on function public.fn_excluir_oportunidade(uuid) from public, anon;
revoke execute on function public.fn_decidir_preco_oportunidade(uuid, text, boolean, text) from public, anon;
revoke execute on function public.fn_e_doisge() from public, anon;
revoke execute on function public.fn_e_doisge_leitura() from public, anon;
revoke execute on function public.fn_meu_perfil() from public, anon;
revoke execute on function public.fn_minha_empresa() from public, anon;
revoke execute on function public.fn_meu_parceiro() from public, anon;
revoke execute on function public.fn_produto_autorizado(uuid) from public, anon;

grant execute on function public.fn_gerar_parcelas(uuid) to authenticated;
grant execute on function public.fn_excluir_contrato(uuid) to authenticated;
grant execute on function public.fn_excluir_oportunidade(uuid) to authenticated;
grant execute on function public.fn_decidir_preco_oportunidade(uuid, text, boolean, text) to authenticated;
grant execute on function public.fn_e_doisge() to authenticated;
grant execute on function public.fn_e_doisge_leitura() to authenticated;
grant execute on function public.fn_meu_perfil() to authenticated;
grant execute on function public.fn_minha_empresa() to authenticated;
grant execute on function public.fn_meu_parceiro() to authenticated;
grant execute on function public.fn_produto_autorizado(uuid) to authenticated;

grant execute on function public.fn_gerar_parcelas(uuid) to service_role;
grant execute on function public.fn_excluir_contrato(uuid) to service_role;
grant execute on function public.fn_excluir_oportunidade(uuid) to service_role;
grant execute on function public.fn_decidir_preco_oportunidade(uuid, text, boolean, text) to service_role;
grant execute on function public.fn_e_doisge() to service_role;
grant execute on function public.fn_e_doisge_leitura() to service_role;
grant execute on function public.fn_meu_perfil() to service_role;
grant execute on function public.fn_minha_empresa() to service_role;
grant execute on function public.fn_meu_parceiro() to service_role;
grant execute on function public.fn_produto_autorizado(uuid) to service_role;

-- Funções de gatilho: o Postgres as dispara sem checar EXECUTE, então tirar
-- da chave pública não muda nada no funcionamento. Os demais papéis ficam
-- como estão (chamar gatilho pela API já dá erro por natureza).
revoke execute on function public.fn_handle_new_user() from public, anon;
revoke execute on function public.fn_protege_acesso_profile() from public, anon;
revoke execute on function public.fn_registrar_historico() from public, anon;
revoke execute on function public.fn_numerar_proposta() from public, anon;
revoke execute on function public.fn_contrato_gera_area_exclusiva() from public, anon;
revoke execute on function public.fn_solicitacao_preco_oportunidade() from public, anon;
revoke execute on function public.fn_trava_preco_oportunidade() from public, anon;
revoke execute on function public.fn_oportunidade_empresa() from public, anon;
revoke execute on function public.fn_oportunidade_movimenta_area() from public, anon;
revoke execute on function public.fn_atividade_movimenta_area() from public, anon;
revoke execute on function public.fn_validar_limite_area_preferencial() from public, anon;
revoke execute on function public.fn_encerrar_exclusiva_com_contrato() from public, anon;
revoke execute on function public.fn_sincroniza_tipos_parceiro() from public, anon;
revoke execute on function public.fn_set_updated_at() from public, anon;

-- O Supabase concede EXECUTE a anon em toda função nova criada pelo postgres.
-- Daqui pra frente a chave pública não ganha mais esse acesso automático;
-- authenticated e service_role continuam recebendo como antes.
alter default privileges for role postgres in schema public revoke execute on functions from anon;

-- ── 5) search_path fixo (aviso do linter do Supabase) ───────────
-- Sem isso, quem controla o search_path da sessão pode fazer a função
-- chamar outra tabela/função com o mesmo nome.
alter function public.fn_set_updated_at() set search_path = public;
alter function public.fn_validar_limite_area_preferencial() set search_path = public;
alter function public.fn_oportunidade_empresa() set search_path = public;
alter function public.fn_oportunidade_movimenta_area() set search_path = public;
alter function public.fn_atividade_movimenta_area() set search_path = public;
alter function public.fn_sem_acento(text) set search_path = public;
alter function public.fn_encerrar_exclusiva_com_contrato() set search_path = public;
alter function public.fn_trava_preco_oportunidade() set search_path = public;
