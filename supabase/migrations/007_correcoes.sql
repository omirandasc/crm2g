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
