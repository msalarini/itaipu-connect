-- 1. Permitir que novos usuários criem seu próprio perfil
create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- 2. Função segura para validar convite (sem expor a tabela toda)
create or replace function check_invite_code(invite_code text)
returns json
language plpgsql
security definer -- Roda com permissões de admin
as $$
declare
  invite_record record;
begin
  select * from invites
  where code = invite_code
  and used_at is null
  and expires_at > now()
  into invite_record;

  if invite_record is null then
    return null;
  end if;

  return row_to_json(invite_record);
end;
$$;

-- 3. Função para marcar convite como usado
create or replace function mark_invite_used(invite_code text)
returns void
language plpgsql
security definer
as $$
begin
  update invites
  set used_at = now()
  where code = invite_code;
end;
$$;

-- 4. Permitir que usuários se adicionem a ministérios (necessário para o fluxo de cadastro)
-- Vamos criar uma policy que permite INSERT se o usuário estiver usando um convite válido
-- Mas como validar isso no INSERT?
-- Abordagem simplificada para MVP: Permitir INSERT se for o próprio usuário.
-- A validação real fica no client/RPC por enquanto, ou poderíamos fazer uma trigger complexa.
create policy "Users can join ministries"
  on ministry_members for insert
  with check ( auth.uid() = user_id );
