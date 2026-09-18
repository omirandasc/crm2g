-- Chamados do cliente de 15/09/2026 (aplicado em produção em 18/09/2026)
-- A exclusão do contrato de teste 01/2026 foi feita direto em produção e não se repete aqui.

-- ═══ Chamado 9: etapas removidas do funil ═══
update public.oportunidades set etapa_comercial = 'qualificacao_inicial'
  where etapa_comercial in ('lead_identificado','oportunidade_cadastrada','diagnostico_da_dor');
update public.oportunidades set etapa_comercial = 'solucao_apresentada'
  where etapa_comercial = 'interesse_validado';
update public.oportunidades set etapa_comercial = 'proposta_enviada'
  where etapa_comercial in ('proposta_solicitada','modelo_contratacao_definido');
alter table public.oportunidades alter column etapa_comercial set default 'qualificacao_inicial';
alter table public.oportunidades add constraint oportunidades_etapa_ativa check (
  etapa_comercial not in ('lead_identificado','oportunidade_cadastrada','diagnostico_da_dor',
                          'interesse_validado','proposta_solicitada','modelo_contratacao_definido'));

-- ═══ Chamado 1: parceiro com um ou mais tipos (só 3 tipos válidos) ═══
alter table public.parceiros_rede add column tipos_parceiro text[] not null default '{}';
update public.parceiros_rede set tipo_parceiro = 'revendedor_distribuidor' where tipo_parceiro in ('revendedor_parceiro');
update public.parceiros_rede set tipo_parceiro = 'parceiro_servico' where tipo_parceiro in ('consultor','parceiro_institucional');
update public.parceiros_rede set tipo_parceiro = 'canal_comercial' where tipo_parceiro in ('representante_regional');
update public.parceiros_rede set tipos_parceiro = array[tipo_parceiro::text];
alter table public.parceiros_rede add constraint parceiros_tipos_validos check (
  cardinality(tipos_parceiro) >= 1
  and tipos_parceiro <@ array['canal_comercial','revendedor_distribuidor','parceiro_servico']);

-- ═══ Chamado 7: beneficiário da regra de comissão vira lista fixa ═══
update public.regras_comissao set
  observacoes = trim(both ' ' from coalesce(observacoes, '') || ' Beneficiário anterior: ' || beneficiario),
  beneficiario = case when parceiro_rede_id is not null then 'canal' else 'outro' end
  where beneficiario not in ('doisge','canal','govtech','indicacao','outro');
alter table public.regras_comissao add constraint regras_beneficiario_valido check (
  beneficiario in ('doisge','canal','govtech','indicacao','outro'));

-- ═══ Chamado 6: responsável de compras vem dos contatos do órgão ═══
alter table public.processos_compra_publica
  add column responsavel_compras_id uuid references public.contatos_publicos (id) on delete set null;

-- ═══ Chamado 4: preço abaixo da tabela trava a oportunidade ═══
alter table public.oportunidades
  add column quantidade integer,
  add column preco_aprovacao_status text check (preco_aprovacao_status in ('pendente','aprovado','recusado')),
  add column preco_aprov_doisge_por uuid references public.profiles (id),
  add column preco_aprov_doisge_em timestamptz,
  add column preco_aprov_govtech_por uuid references public.profiles (id),
  add column preco_aprov_govtech_em timestamptz,
  add column preco_motivo_recusa text;

create or replace function public.fn_trava_preco_oportunidade()
returns trigger language plpgsql as $$
begin
  if new.valor_tabela is not null and new.valor_venda is not null
     and new.valor_venda < new.valor_tabela then
    if tg_op = 'INSERT'
       or new.valor_venda is distinct from old.valor_venda
       or new.valor_tabela is distinct from old.valor_tabela then
      new.preco_aprovacao_status := 'pendente';
      new.preco_aprov_doisge_por := null;  new.preco_aprov_doisge_em := null;
      new.preco_aprov_govtech_por := null; new.preco_aprov_govtech_em := null;
      new.preco_motivo_recusa := null;
    end if;
  else
    new.preco_aprovacao_status := null;
    new.preco_aprov_doisge_por := null;  new.preco_aprov_doisge_em := null;
    new.preco_aprov_govtech_por := null; new.preco_aprov_govtech_em := null;
    new.preco_motivo_recusa := null;
  end if;
  -- trava: não avança no funil enquanto o preço não for aprovado (perder/suspender é livre)
  if tg_op = 'UPDATE'
     and new.etapa_comercial is distinct from old.etapa_comercial
     and new.etapa_comercial not in ('fechado_perdido','suspenso')
     and new.preco_aprovacao_status in ('pendente','recusado') then
    raise exception 'Oportunidade travada: o valor de venda está abaixo da tabela e aguarda aprovação da DoisGe e da GovTech.';
  end if;
  return new;
end $$;
create trigger trg_trava_preco_oportunidade
  before insert or update on public.oportunidades
  for each row execute function public.fn_trava_preco_oportunidade();

-- Mensagem para a DoisGe: abre (ou encerra) a solicitação em Aprovações
create or replace function public.fn_solicitacao_preco_oportunidade()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.preco_aprovacao_status = 'pendente'
     and (tg_op = 'INSERT' or old.preco_aprovacao_status is distinct from 'pendente'
          or new.valor_venda is distinct from old.valor_venda) then
    update public.solicitacoes_aprovacao set status = 'cancelada', data_decisao = now(),
           motivo_decisao = 'Substituída por novo valor'
      where entidade = 'oportunidades' and entidade_id = new.id
        and tipo_solicitacao = 'excecao_preco' and status in ('solicitada','em_analise');
    if auth.uid() is not null then
      insert into public.solicitacoes_aprovacao (tipo_solicitacao, solicitante, entidade, entidade_id, descricao)
      values ('excecao_preco', auth.uid(), 'oportunidades', new.id,
        format('Oportunidade #%s — %s: valor de venda R$ %s abaixo da tabela (R$ %s). Precisa da aprovação da DoisGe e da GovTech.',
               new.codigo, new.nome_oportunidade,
               to_char(new.valor_venda, 'FM999G999G990D00'), to_char(new.valor_tabela, 'FM999G999G990D00')));
    end if;
  elsif new.preco_aprovacao_status is null and tg_op = 'UPDATE' and old.preco_aprovacao_status is not null then
    update public.solicitacoes_aprovacao set status = 'cancelada', data_decisao = now(),
           motivo_decisao = 'Valor de venda ajustado para a tabela ou acima'
      where entidade = 'oportunidades' and entidade_id = new.id
        and tipo_solicitacao = 'excecao_preco' and status in ('solicitada','em_analise');
  end if;
  return new;
end $$;
create trigger trg_solicitacao_preco_oportunidade
  after insert or update of valor_venda, valor_tabela, preco_aprovacao_status on public.oportunidades
  for each row execute function public.fn_solicitacao_preco_oportunidade();

-- Decisão de preço: DoisGe decide pelo lado dela; GovTech (ou a DoisGe registrando por ela) pelo outro
create or replace function public.fn_decidir_preco_oportunidade(
  p_oportunidade uuid, p_lado text, p_aprovar boolean, p_motivo text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_status text;
  v_empresa uuid;
begin
  select o.preco_aprovacao_status, p.empresa_portfolio_id into v_status, v_empresa
    from public.oportunidades o join public.produtos p on p.id = o.produto_id
    where o.id = p_oportunidade;
  if not found then raise exception 'Oportunidade não encontrada.'; end if;
  if v_status is distinct from 'pendente' then
    raise exception 'Não há aprovação de preço pendente nesta oportunidade.';
  end if;
  if p_lado = 'doisge' then
    if not fn_e_doisge() then raise exception 'Somente a DoisGe pode dar esta aprovação.'; end if;
  elsif p_lado = 'govtech' then
    if not (fn_e_doisge() or fn_minha_empresa() = v_empresa) then
      raise exception 'Somente a GovTech dona do produto pode dar esta aprovação.';
    end if;
  else
    raise exception 'Lado inválido.';
  end if;
  if not p_aprovar then
    update public.oportunidades
      set preco_aprovacao_status = 'recusado', preco_motivo_recusa = nullif(trim(p_motivo), '')
      where id = p_oportunidade;
    update public.solicitacoes_aprovacao set status = 'rejeitada', data_decisao = now(),
           decidido_por = auth.uid(), motivo_decisao = nullif(trim(p_motivo), '')
      where entidade = 'oportunidades' and entidade_id = p_oportunidade
        and tipo_solicitacao = 'excecao_preco' and status in ('solicitada','em_analise');
    return 'recusado';
  end if;
  if p_lado = 'doisge' then
    update public.oportunidades set preco_aprov_doisge_por = auth.uid(), preco_aprov_doisge_em = now()
      where id = p_oportunidade;
  else
    update public.oportunidades set preco_aprov_govtech_por = auth.uid(), preco_aprov_govtech_em = now()
      where id = p_oportunidade;
  end if;
  update public.oportunidades set preco_aprovacao_status = 'aprovado'
    where id = p_oportunidade and preco_aprov_doisge_em is not null and preco_aprov_govtech_em is not null
    returning preco_aprovacao_status into v_status;
  if v_status = 'aprovado' then
    update public.solicitacoes_aprovacao set status = 'aprovada', data_decisao = now(),
           decidido_por = auth.uid(), motivo_decisao = 'Aprovado pela DoisGe e pela GovTech'
      where entidade = 'oportunidades' and entidade_id = p_oportunidade
        and tipo_solicitacao = 'excecao_preco' and status in ('solicitada','em_analise');
    return 'aprovado';
  end if;
  return 'pendente';
end $$;
grant execute on function public.fn_decidir_preco_oportunidade(uuid, text, boolean, text) to authenticated;

-- ═══ Chamado 5: numeração sequencial da proposta (CANAL-PRODUTO-ANO-SEQ) ═══
alter table public.produtos add column sigla text;
update public.produtos set sigla = upper(left(regexp_replace(
  public.unaccent(split_part(nome_produto, ' ', 1)), '[^A-Za-z0-9]', '', 'g'), 4));

create or replace function public.fn_numerar_proposta()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_canal text;
  v_produto text;
  v_prefixo text;
  v_seq integer;
begin
  if new.numero_proposta is not null and trim(new.numero_proposta) <> '' then
    return new;
  end if;
  select
    coalesce(nullif(upper(left(regexp_replace(public.unaccent(split_part(
      coalesce(nullif(pr.nome_fantasia, ''), pr.razao_social), ' ', 1)), '[^A-Za-z0-9]', '', 'g'), 10)), ''), 'DOISGE'),
    coalesce(nullif(upper(p.sigla), ''), upper(left(regexp_replace(public.unaccent(split_part(
      p.nome_produto, ' ', 1)), '[^A-Za-z0-9]', '', 'g'), 4)))
    into v_canal, v_produto
    from public.oportunidades o
    join public.produtos p on p.id = o.produto_id
    left join public.parceiros_rede pr on pr.id = o.parceiro_rede_id
    where o.id = new.oportunidade_id;
  v_prefixo := coalesce(v_canal, 'DOISGE') || '-' || coalesce(v_produto, 'PROD') || '-'
               || extract(year from now())::int;
  perform pg_advisory_xact_lock(hashtext(v_prefixo));
  select coalesce(max((regexp_match(numero_proposta, '-(\d+)$'))[1]::int), 0) + 1 into v_seq
    from public.propostas where numero_proposta like v_prefixo || '-%';
  new.numero_proposta := v_prefixo || '-' || lpad(v_seq::text, 3, '0');
  return new;
end $$;
create trigger trg_numerar_proposta
  before insert on public.propostas
  for each row execute function public.fn_numerar_proposta();

-- ═══ Chamado 3: exclusão pelo Administrador DoisGe ═══
create or replace function public.fn_excluir_contrato(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_numero text;
begin
  if fn_meu_perfil() is distinct from 'administrador_geral' then
    raise exception 'Apenas o Administrador DoisGe pode excluir contratos.';
  end if;
  select coalesce(numero_contrato, 'sem número') into v_numero from public.contratos where id = p_id;
  if not found then raise exception 'Contrato não encontrado.'; end if;
  delete from public.comissoes where contrato_id = p_id;
  delete from public.entregas where contrato_id = p_id;
  delete from public.areas_exclusivas where contrato_id = p_id;
  delete from public.contratos where id = p_id; -- parcelas saem em cascata
  insert into public.historico_alteracoes
    (entidade, entidade_id, campo_alterado, valor_anterior, valor_novo, usuario_responsavel, motivo)
  values ('contratos', p_id, '(registro excluído)', 'Contrato ' || v_numero, null, auth.uid(),
          'Exclusão pelo Administrador DoisGe (com parcelas, comissões, entregas e exclusividade)');
end $$;

create or replace function public.fn_excluir_oportunidade(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_nome text;
begin
  if fn_meu_perfil() is distinct from 'administrador_geral' then
    raise exception 'Apenas o Administrador DoisGe pode excluir oportunidades.';
  end if;
  select '#' || codigo || ' ' || nome_oportunidade into v_nome from public.oportunidades where id = p_id;
  if not found then raise exception 'Oportunidade não encontrada.'; end if;
  if exists (select 1 from public.contratos where oportunidade_id = p_id) then
    raise exception 'Esta oportunidade tem contrato vinculado. Exclua o contrato antes.';
  end if;
  delete from public.entregas where oportunidade_id = p_id;
  delete from public.propostas where oportunidade_id = p_id;
  delete from public.processos_compra_publica where oportunidade_id = p_id; -- documentos em cascata
  delete from public.solicitacoes_aprovacao where entidade = 'oportunidades' and entidade_id = p_id;
  delete from public.oportunidades where id = p_id; -- atividades em cascata
  insert into public.historico_alteracoes
    (entidade, entidade_id, campo_alterado, valor_anterior, valor_novo, usuario_responsavel, motivo)
  values ('oportunidades', p_id, '(registro excluído)', v_nome, null, auth.uid(),
          'Exclusão pelo Administrador DoisGe (com propostas, compra pública e atividades)');
end $$;

grant execute on function public.fn_excluir_contrato(uuid) to authenticated;
grant execute on function public.fn_excluir_oportunidade(uuid) to authenticated;
