-- Contatos e órgãos públicos: leitura continua compartilhada (são entidades
-- públicas comuns a todos), mas a edição passa a ser de quem cadastrou —
-- o usuário, a equipe do mesmo Canal ou da mesma GovTech — e da DoisGe.
-- Registros antigos, sem autor conhecido, só a DoisGe edita.

alter table contatos_publicos
  add column if not exists criado_por       uuid default auth.uid(),
  add column if not exists parceiro_criador uuid default fn_meu_parceiro(),
  add column if not exists empresa_criadora uuid default fn_minha_empresa();

alter table orgaos_publicos
  add column if not exists criado_por       uuid default auth.uid(),
  add column if not exists parceiro_criador uuid default fn_meu_parceiro(),
  add column if not exists empresa_criadora uuid default fn_minha_empresa();

drop policy if exists upd_contatos on contatos_publicos;
create policy upd_contatos on contatos_publicos
  for update to authenticated
  using (
    fn_e_doisge()
    or criado_por = auth.uid()
    or (parceiro_criador is not null and parceiro_criador = fn_meu_parceiro())
    or (empresa_criadora is not null and empresa_criadora = fn_minha_empresa())
  )
  with check (
    fn_e_doisge()
    or criado_por = auth.uid()
    or (parceiro_criador is not null and parceiro_criador = fn_meu_parceiro())
    or (empresa_criadora is not null and empresa_criadora = fn_minha_empresa())
  );

drop policy if exists upd_orgaos on orgaos_publicos;
create policy upd_orgaos on orgaos_publicos
  for update to authenticated
  using (
    fn_e_doisge()
    or criado_por = auth.uid()
    or (parceiro_criador is not null and parceiro_criador = fn_meu_parceiro())
    or (empresa_criadora is not null and empresa_criadora = fn_minha_empresa())
  )
  with check (
    fn_e_doisge()
    or criado_por = auth.uid()
    or (parceiro_criador is not null and parceiro_criador = fn_meu_parceiro())
    or (empresa_criadora is not null and empresa_criadora = fn_minha_empresa())
  );

-- Ninguém cadastra em nome de outro: o autor é sempre quem está logado.
drop policy if exists ins_contatos on contatos_publicos;
create policy ins_contatos on contatos_publicos
  for insert to authenticated
  with check (criado_por = auth.uid() or fn_e_doisge());

drop policy if exists ins_orgaos on orgaos_publicos;
create policy ins_orgaos on orgaos_publicos
  for insert to authenticated
  with check (criado_por = auth.uid() or fn_e_doisge());
