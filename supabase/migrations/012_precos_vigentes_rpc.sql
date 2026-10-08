-- Tabela de preços vigente que o usuário logado pode enxergar, para o
-- cálculo automático na oportunidade (chamado 4). A tabela precos_produto
-- só é legível pela DoisGe e pela GovTech dona; o Canal precisa ver o preço
-- dos produtos que está autorizado a vender — por isso SECURITY DEFINER
-- com a checagem de identidade dentro.
create or replace function fn_precos_vigentes()
returns table (
  produto_id    uuid,
  tipo_preco    text,
  valor         numeric,
  faixa_inicial integer,
  faixa_final   integer
)
language sql
stable
security definer
set search_path = public
as $$
  select pp.produto_id, pp.tipo_preco::text, pp.valor, pp.faixa_inicial, pp.faixa_final
  from public.precos_produto pp
  join public.produtos p on p.id = pp.produto_id
  where auth.uid() is not null
    and pp.status = 'ativo'
    and (pp.data_inicio_vigencia is null or pp.data_inicio_vigencia <= current_date)
    and (pp.data_fim_vigencia is null or pp.data_fim_vigencia >= current_date)
    and (
      fn_e_doisge_leitura()
      or p.empresa_portfolio_id = fn_minha_empresa()
      or fn_produto_autorizado(pp.produto_id)
    )
  order by pp.produto_id, pp.faixa_inicial nulls first;
$$;

revoke execute on function public.fn_precos_vigentes() from public, anon;
grant execute on function public.fn_precos_vigentes() to authenticated, service_role;
