-- 006: Row Level Security — permissionamento por perfil (Governança / Portfólio / Rede)

-- ── Funções de contexto do usuário logado ────────────────────────
create or replace function public.fn_meu_perfil()
returns perfil_acesso language sql stable security definer set search_path = public as $$
  select perfil from public.profiles where id = auth.uid();
$$;

create or replace function public.fn_e_doisge()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select perfil in ('administrador_geral','governanca_doisge','gestor_comercial_doisge',
                       'gestor_financeiro_doisge','gestor_contratos_doisge')
     from public.profiles where id = auth.uid() and status = 'ativo'), false);
$$;

create or replace function public.fn_e_doisge_leitura()
returns boolean language sql stable security definer set search_path = public as $$
  select public.fn_e_doisge() or coalesce(
    (select perfil = 'usuario_consulta' from public.profiles
     where id = auth.uid() and status = 'ativo'), false);
$$;

create or replace function public.fn_minha_empresa()
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_portfolio_id from public.profiles where id = auth.uid() and status = 'ativo';
$$;

create or replace function public.fn_meu_parceiro()
returns uuid language sql stable security definer set search_path = public as $$
  select parceiro_rede_id from public.profiles where id = auth.uid() and status = 'ativo';
$$;

-- Autorização ativa do parceiro logado para um produto
create or replace function public.fn_produto_autorizado(p_produto uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.autorizacoes_parceiro_produto
    where produto_id = p_produto
      and parceiro_rede_id = public.fn_meu_parceiro()
      and status = 'ativa');
$$;

-- ── Habilita RLS em todas as tabelas ─────────────────────────────
alter table public.municipios enable row level security;
alter table public.orgaos_publicos enable row level security;
alter table public.contatos_publicos enable row level security;
alter table public.empresas_portfolio enable row level security;
alter table public.parceiros_rede enable row level security;
alter table public.socios enable row level security;
alter table public.certidoes enable row level security;
alter table public.produtos enable row level security;
alter table public.precos_produto enable row level security;
alter table public.materiais_produto enable row level security;
alter table public.autorizacoes_parceiro_produto enable row level security;
alter table public.profiles enable row level security;
alter table public.areas_preferenciais enable row level security;
alter table public.oportunidades enable row level security;
alter table public.atividades_comerciais enable row level security;
alter table public.propostas enable row level security;
alter table public.processos_compra_publica enable row level security;
alter table public.documentos_compra_publica enable row level security;
alter table public.contratos enable row level security;
alter table public.parcelas_contrato enable row level security;
alter table public.areas_exclusivas enable row level security;
alter table public.regras_comissao enable row level security;
alter table public.comissoes enable row level security;
alter table public.entregas enable row level security;
alter table public.politicas_comerciais enable row level security;
alter table public.solicitacoes_aprovacao enable row level security;
alter table public.historico_alteracoes enable row level security;

-- ── Municípios: leitura geral, escrita DOISGE ────────────────────
create policy sel_municipios on public.municipios for select to authenticated using (true);
create policy all_municipios_doisge on public.municipios for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());

-- ── Órgãos e contatos: leitura geral, cadastro por qualquer perfil ativo ─
create policy sel_orgaos on public.orgaos_publicos for select to authenticated using (true);
create policy ins_orgaos on public.orgaos_publicos for insert to authenticated with check (true);
create policy upd_orgaos on public.orgaos_publicos for update to authenticated using (true);
create policy del_orgaos_doisge on public.orgaos_publicos for delete to authenticated using (fn_e_doisge());

create policy sel_contatos on public.contatos_publicos for select to authenticated using (true);
create policy ins_contatos on public.contatos_publicos for insert to authenticated with check (true);
create policy upd_contatos on public.contatos_publicos for update to authenticated using (true);
create policy del_contatos_doisge on public.contatos_publicos for delete to authenticated using (fn_e_doisge());

-- ── Empresas do Portfólio ────────────────────────────────────────
create policy sel_empresas on public.empresas_portfolio for select to authenticated
  using (fn_e_doisge_leitura() or id = fn_minha_empresa());
create policy all_empresas_doisge on public.empresas_portfolio for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy upd_empresa_propria on public.empresas_portfolio for update to authenticated
  using (id = fn_minha_empresa() and fn_meu_perfil() = 'administrador_portfolio');

-- ── Parceiros da Rede ────────────────────────────────────────────
create policy sel_parceiros on public.parceiros_rede for select to authenticated
  using (fn_e_doisge_leitura() or id = fn_meu_parceiro());
create policy all_parceiros_doisge on public.parceiros_rede for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy upd_parceiro_proprio on public.parceiros_rede for update to authenticated
  using (id = fn_meu_parceiro() and fn_meu_perfil() = 'administrador_rede');

-- ── Sócios e certidões: DOISGE ou dono da entidade ───────────────
create policy all_socios on public.socios for all to authenticated
  using (fn_e_doisge()
    or (entidade = 'empresa_portfolio' and entidade_id = fn_minha_empresa())
    or (entidade = 'parceiro_rede' and entidade_id = fn_meu_parceiro()))
  with check (fn_e_doisge()
    or (entidade = 'empresa_portfolio' and entidade_id = fn_minha_empresa())
    or (entidade = 'parceiro_rede' and entidade_id = fn_meu_parceiro()));

create policy all_certidoes on public.certidoes for all to authenticated
  using (fn_e_doisge()
    or (entidade = 'empresa_portfolio' and entidade_id = fn_minha_empresa())
    or (entidade = 'parceiro_rede' and entidade_id = fn_meu_parceiro()))
  with check (fn_e_doisge()
    or (entidade = 'empresa_portfolio' and entidade_id = fn_minha_empresa())
    or (entidade = 'parceiro_rede' and entidade_id = fn_meu_parceiro()));

-- ── Produtos ─────────────────────────────────────────────────────
create policy sel_produtos on public.produtos for select to authenticated
  using (fn_e_doisge_leitura()
    or empresa_portfolio_id = fn_minha_empresa()
    or fn_produto_autorizado(id));
create policy all_produtos_doisge on public.produtos for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy ins_produto_portfolio on public.produtos for insert to authenticated
  with check (empresa_portfolio_id = fn_minha_empresa());
create policy upd_produto_portfolio on public.produtos for update to authenticated
  using (empresa_portfolio_id = fn_minha_empresa());

-- ── Preços: DOISGE e Portfólio dono (Rede usa os preços da autorização) ─
create policy sel_precos on public.precos_produto for select to authenticated
  using (fn_e_doisge_leitura()
    or exists (select 1 from public.produtos p
               where p.id = produto_id and p.empresa_portfolio_id = fn_minha_empresa()));
create policy all_precos_doisge on public.precos_produto for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy ins_precos_portfolio on public.precos_produto for insert to authenticated
  with check (exists (select 1 from public.produtos p
              where p.id = produto_id and p.empresa_portfolio_id = fn_minha_empresa()));
create policy upd_precos_portfolio on public.precos_produto for update to authenticated
  using (exists (select 1 from public.produtos p
         where p.id = produto_id and p.empresa_portfolio_id = fn_minha_empresa()));

-- ── Materiais: visibilidade controlada ───────────────────────────
create policy sel_materiais on public.materiais_produto for select to authenticated
  using (fn_e_doisge_leitura()
    or exists (select 1 from public.produtos p
               where p.id = produto_id and p.empresa_portfolio_id = fn_minha_empresa())
    or (nivel_visibilidade = 'publico')
    or (nivel_visibilidade = 'rede_autorizada' and fn_produto_autorizado(produto_id)));
create policy all_materiais_doisge on public.materiais_produto for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy ins_materiais_portfolio on public.materiais_produto for insert to authenticated
  with check (exists (select 1 from public.produtos p
              where p.id = produto_id and p.empresa_portfolio_id = fn_minha_empresa()));
create policy upd_materiais_portfolio on public.materiais_produto for update to authenticated
  using (exists (select 1 from public.produtos p
         where p.id = produto_id and p.empresa_portfolio_id = fn_minha_empresa()));

-- ── Autorizações: DOISGE gerencia; parceiro vê as suas e pode solicitar ─
create policy sel_autorizacoes on public.autorizacoes_parceiro_produto for select to authenticated
  using (fn_e_doisge_leitura() or parceiro_rede_id = fn_meu_parceiro());
create policy all_autorizacoes_doisge on public.autorizacoes_parceiro_produto for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy ins_autorizacao_parceiro on public.autorizacoes_parceiro_produto for insert to authenticated
  with check (parceiro_rede_id = fn_meu_parceiro() and status = 'solicitada');

-- ── Profiles ─────────────────────────────────────────────────────
create policy sel_profiles on public.profiles for select to authenticated
  using (id = auth.uid() or fn_e_doisge_leitura());
create policy upd_profile_proprio on public.profiles for update to authenticated
  using (id = auth.uid());
create policy all_profiles_doisge on public.profiles for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());

-- ── Áreas Preferenciais ──────────────────────────────────────────
create policy sel_areas_pref on public.areas_preferenciais for select to authenticated
  using (fn_e_doisge_leitura()
    or parceiro_rede_id = fn_meu_parceiro()
    or exists (select 1 from public.produtos p
               where p.id = produto_id and p.empresa_portfolio_id = fn_minha_empresa()));
create policy all_areas_pref_doisge on public.areas_preferenciais for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy ins_area_pref_parceiro on public.areas_preferenciais for insert to authenticated
  with check (parceiro_rede_id = fn_meu_parceiro()
    and status = 'solicitada'
    and fn_produto_autorizado(produto_id));

-- ── Oportunidades (com as travas de território e autorização) ────
create policy sel_oportunidades on public.oportunidades for select to authenticated
  using (fn_e_doisge_leitura()
    or parceiro_rede_id = fn_meu_parceiro()
    or (empresa_portfolio_id = fn_minha_empresa() and visibilidade_portfolio));
create policy all_oportunidades_doisge on public.oportunidades for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
-- Trava central: parceiro só cria oportunidade para produto autorizado
-- e em município da sua área preferencial ativa
create policy ins_oportunidade_parceiro on public.oportunidades for insert to authenticated
  with check (
    parceiro_rede_id = fn_meu_parceiro()
    and fn_produto_autorizado(produto_id)
    and exists (
      select 1 from public.areas_preferenciais ap
      where ap.produto_id = oportunidades.produto_id
        and ap.municipio_id = oportunidades.municipio_id
        and ap.parceiro_rede_id = fn_meu_parceiro()
        and ap.status in ('aprovada','ativa')));
create policy upd_oportunidade_parceiro on public.oportunidades for update to authenticated
  using (parceiro_rede_id = fn_meu_parceiro());

-- ── Atividades comerciais ────────────────────────────────────────
create policy sel_atividades on public.atividades_comerciais for select to authenticated
  using (fn_e_doisge_leitura()
    or responsavel = auth.uid()
    or (visibilidade in ('visivel_rede','visivel_portfolio_e_rede')
        and exists (select 1 from public.oportunidades o
                    where o.id = oportunidade_id and o.parceiro_rede_id = fn_meu_parceiro()))
    or (visibilidade in ('visivel_portfolio','visivel_portfolio_e_rede')
        and exists (select 1 from public.oportunidades o
                    where o.id = oportunidade_id and o.empresa_portfolio_id = fn_minha_empresa()))
    or (entidade = 'parceiro_rede' and entidade_id = fn_meu_parceiro() and visibilidade <> 'interna_doisge')
    or (entidade = 'empresa_portfolio' and entidade_id = fn_minha_empresa() and visibilidade <> 'interna_doisge'));
create policy ins_atividades on public.atividades_comerciais for insert to authenticated
  with check (responsavel = auth.uid() or fn_e_doisge());
create policy all_atividades_doisge on public.atividades_comerciais for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy upd_atividade_propria on public.atividades_comerciais for update to authenticated
  using (responsavel = auth.uid());

-- ── Propostas ────────────────────────────────────────────────────
create policy sel_propostas on public.propostas for select to authenticated
  using (fn_e_doisge_leitura()
    or exists (select 1 from public.oportunidades o where o.id = oportunidade_id
               and (o.parceiro_rede_id = fn_meu_parceiro()
                    or (o.empresa_portfolio_id = fn_minha_empresa() and o.visibilidade_portfolio))));
create policy all_propostas_doisge on public.propostas for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy ins_proposta_parceiro on public.propostas for insert to authenticated
  with check (exists (select 1 from public.oportunidades o
              where o.id = oportunidade_id and o.parceiro_rede_id = fn_meu_parceiro()));
create policy upd_proposta_parceiro on public.propostas for update to authenticated
  using (exists (select 1 from public.oportunidades o
         where o.id = oportunidade_id and o.parceiro_rede_id = fn_meu_parceiro()));

-- ── Processos e documentos de compra pública ─────────────────────
create policy sel_processos on public.processos_compra_publica for select to authenticated
  using (fn_e_doisge_leitura()
    or exists (select 1 from public.oportunidades o where o.id = oportunidade_id
               and (o.parceiro_rede_id = fn_meu_parceiro()
                    or (o.empresa_portfolio_id = fn_minha_empresa() and o.visibilidade_portfolio))));
create policy all_processos_doisge on public.processos_compra_publica for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy ins_processo_parceiro on public.processos_compra_publica for insert to authenticated
  with check (exists (select 1 from public.oportunidades o
              where o.id = oportunidade_id and o.parceiro_rede_id = fn_meu_parceiro()));
create policy upd_processo_parceiro on public.processos_compra_publica for update to authenticated
  using (exists (select 1 from public.oportunidades o
         where o.id = oportunidade_id and o.parceiro_rede_id = fn_meu_parceiro()));

create policy sel_docs_compra on public.documentos_compra_publica for select to authenticated
  using (fn_e_doisge_leitura()
    or exists (select 1 from public.processos_compra_publica pc
               join public.oportunidades o on o.id = pc.oportunidade_id
               where pc.id = processo_compra_id
                 and (o.parceiro_rede_id = fn_meu_parceiro()
                      or (o.empresa_portfolio_id = fn_minha_empresa() and o.visibilidade_portfolio))));
create policy all_docs_compra_doisge on public.documentos_compra_publica for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy ins_docs_compra_parceiro on public.documentos_compra_publica for insert to authenticated
  with check (exists (select 1 from public.processos_compra_publica pc
              join public.oportunidades o on o.id = pc.oportunidade_id
              where pc.id = processo_compra_id and o.parceiro_rede_id = fn_meu_parceiro()));

-- ── Contratos ────────────────────────────────────────────────────
create policy sel_contratos on public.contratos for select to authenticated
  using (fn_e_doisge_leitura()
    or parceiro_rede_id = fn_meu_parceiro()
    or empresa_portfolio_id = fn_minha_empresa());
create policy all_contratos_doisge on public.contratos for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());

-- ── Parcelas ─────────────────────────────────────────────────────
create policy sel_parcelas on public.parcelas_contrato for select to authenticated
  using (fn_e_doisge_leitura()
    or exists (select 1 from public.contratos c where c.id = contrato_id
               and (c.parceiro_rede_id = fn_meu_parceiro()
                    or c.empresa_portfolio_id = fn_minha_empresa())));
create policy all_parcelas_doisge on public.parcelas_contrato for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());

-- ── Áreas Exclusivas ─────────────────────────────────────────────
create policy sel_areas_excl on public.areas_exclusivas for select to authenticated
  using (fn_e_doisge_leitura()
    or parceiro_rede_id = fn_meu_parceiro()
    or exists (select 1 from public.produtos p
               where p.id = produto_id and p.empresa_portfolio_id = fn_minha_empresa()));
create policy all_areas_excl_doisge on public.areas_exclusivas for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());

-- ── Regras de comissão: somente DOISGE ───────────────────────────
create policy all_regras_comissao_doisge on public.regras_comissao for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());

-- ── Comissões: DOISGE; parceiro vê as suas quando liberadas ──────
create policy sel_comissoes on public.comissoes for select to authenticated
  using (fn_e_doisge()
    or (parceiro_rede_id = fn_meu_parceiro() and visivel_parceiro));
create policy all_comissoes_doisge on public.comissoes for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());

-- ── Entregas ─────────────────────────────────────────────────────
create policy sel_entregas on public.entregas for select to authenticated
  using (fn_e_doisge_leitura()
    or parceiro_rede_id = fn_meu_parceiro()
    or empresa_portfolio_id = fn_minha_empresa());
create policy all_entregas_doisge on public.entregas for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());
create policy upd_entrega_responsavel on public.entregas for update to authenticated
  using (parceiro_rede_id = fn_meu_parceiro() or empresa_portfolio_id = fn_minha_empresa());

-- ── Políticas comerciais ─────────────────────────────────────────
create policy sel_politicas on public.politicas_comerciais for select to authenticated
  using (fn_e_doisge_leitura() or parceiro_rede_id = fn_meu_parceiro()
    or empresa_portfolio_id = fn_minha_empresa());
create policy all_politicas_doisge on public.politicas_comerciais for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());

-- ── Solicitações de aprovação ────────────────────────────────────
create policy sel_solicitacoes on public.solicitacoes_aprovacao for select to authenticated
  using (fn_e_doisge_leitura() or solicitante = auth.uid());
create policy ins_solicitacoes on public.solicitacoes_aprovacao for insert to authenticated
  with check (solicitante = auth.uid());
create policy all_solicitacoes_doisge on public.solicitacoes_aprovacao for all to authenticated
  using (fn_e_doisge()) with check (fn_e_doisge());

-- ── Histórico: somente Governança lê; ninguém edita diretamente ──
create policy sel_historico_doisge on public.historico_alteracoes for select to authenticated
  using (fn_e_doisge());

-- ── Storage: buckets privados ────────────────────────────────────
insert into storage.buckets (id, name, public) values
  ('materiais','materiais', false),
  ('documentos','documentos', false),
  ('certidoes','certidoes', false)
on conflict (id) do nothing;

create policy storage_sel on storage.objects for select to authenticated
  using (bucket_id in ('materiais','documentos','certidoes'));
create policy storage_ins on storage.objects for insert to authenticated
  with check (bucket_id in ('materiais','documentos','certidoes'));
create policy storage_upd on storage.objects for update to authenticated
  using (bucket_id in ('materiais','documentos','certidoes'));
create policy storage_del on storage.objects for delete to authenticated
  using (bucket_id in ('materiais','documentos','certidoes') and fn_e_doisge());
