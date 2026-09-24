-- Compatibilidade entre a coluna nova (tipos_parceiro, vários tipos) e a
-- antiga (tipo_parceiro, tipo único). Sem isso, qualquer cadastro feito por
-- uma versão do sistema que ainda não conhece tipos_parceiro cai no valor
-- padrão '{}' e esbarra no CHECK parceiros_tipos_validos.
create or replace function fn_sincroniza_tipos_parceiro()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.tipos_parceiro is null or cardinality(new.tipos_parceiro) = 0 then
    new.tipos_parceiro := array[
      case new.tipo_parceiro::text
        when 'revendedor_parceiro'     then 'revendedor_distribuidor'
        when 'consultor'               then 'parceiro_servico'
        when 'representante_regional'  then 'canal_comercial'
        when 'parceiro_institucional'  then 'parceiro_servico'
        else new.tipo_parceiro::text
      end
    ];
  end if;

  -- a coluna antiga sempre espelha o primeiro tipo marcado
  new.tipo_parceiro := (new.tipos_parceiro[1])::tipo_parceiro;
  return new;
end;
$$;

drop trigger if exists trg_parceiros_tipos on parceiros_rede;
create trigger trg_parceiros_tipos
  before insert or update on parceiros_rede
  for each row execute function fn_sincroniza_tipos_parceiro();
