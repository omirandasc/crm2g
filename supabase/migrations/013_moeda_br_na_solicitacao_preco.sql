-- O pedido de aprovação mostrava "R$ 1,000.00" (separadores em inglês, vindos
-- do lc_numeric do servidor). Formata em padrão brasileiro: R$ 1.000,00.
create or replace function fn_moeda_br(v numeric)
returns text
language sql
immutable
set search_path = public
as $$
  select translate(to_char(coalesce(v, 0), 'FM999G999G999G990D00'), ',.', '.,');
$$;
revoke execute on function public.fn_moeda_br(numeric) from public, anon;
grant execute on function public.fn_moeda_br(numeric) to authenticated, service_role;

create or replace function fn_solicitacao_preco_oportunidade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.preco_aprovacao_status = 'pendente'
     and (tg_op = 'INSERT' or old.preco_aprovacao_status is distinct from 'pendente'
          or new.valor_venda is distinct from old.valor_venda) then
    update public.solicitacoes_aprovacao
       set status = 'cancelada', data_decisao = now(), motivo_decisao = 'Substituída por novo valor'
     where entidade = 'oportunidades' and entidade_id = new.id
       and tipo_solicitacao = 'excecao_preco' and status in ('solicitada','em_analise');
    if auth.uid() is not null then
      insert into public.solicitacoes_aprovacao (tipo_solicitacao, solicitante, entidade, entidade_id, descricao)
      values ('excecao_preco', auth.uid(), 'oportunidades', new.id,
        format('Oportunidade #%s — %s: valor de venda R$ %s abaixo da tabela (R$ %s). Precisa da aprovação da DoisGe e da GovTech.',
               new.codigo, new.nome_oportunidade, fn_moeda_br(new.valor_venda), fn_moeda_br(new.valor_tabela)));
    end if;
  elsif new.preco_aprovacao_status is null and tg_op = 'UPDATE' and old.preco_aprovacao_status is not null then
    update public.solicitacoes_aprovacao
       set status = 'cancelada', data_decisao = now(), motivo_decisao = 'Valor de venda ajustado para a tabela ou acima'
     where entidade = 'oportunidades' and entidade_id = new.id
       and tipo_solicitacao = 'excecao_preco' and status in ('solicitada','em_analise');
  end if;
  return new;
end $$;
