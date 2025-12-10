-- ============================================
-- Fase 6: Gestão de Membros (People Management)
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Política: PASTOR pode ver todos os perfis (já coberto pela política Public, mas reforçando se mudar)
-- Atualmente: "Public profiles are viewable by everyone" (Supabase Schema linha 119) -> OK

-- 2. Política: PASTOR pode ATUALIZAR qualquer perfil (ex: mudar role)
DROP POLICY IF EXISTS "PASTOR can update any profile" ON profiles;

CREATE POLICY "PASTOR can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND global_role = 'PASTOR'
    )
  );

-- 3. (Opcional) Política: PASTOR pode DELETAR perfis (Banir)
DROP POLICY IF EXISTS "PASTOR can delete profiles" ON profiles;

CREATE POLICY "PASTOR can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND global_role = 'PASTOR'
    )
  );

-- 4. Função RPC para listar todos os membros com detalhes (útil se precisarmos de dados extras no futuro)
-- Por enquanto, um simples SELECT * FROM profiles funciona no client se tivermos a política correta.
-- Mas vamos garantir que o service role ou o PASTOR consiga listar tudo sem restrição.

-- Verificação:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
