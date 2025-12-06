-- ============================================
-- Fase 11: Políticas RLS para tabela invites
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "PASTOR can view all invites" ON invites;
DROP POLICY IF EXISTS "PASTOR can create invites" ON invites;
DROP POLICY IF EXISTS "PASTOR can delete invites" ON invites;
DROP POLICY IF EXISTS "Users can view invite by code" ON invites;

-- Política: Apenas PASTOR pode ver todos os convites
CREATE POLICY "PASTOR can view all invites"
  ON invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND global_role = 'PASTOR'
    )
  );

-- Política: Apenas PASTOR pode criar convites
CREATE POLICY "PASTOR can create invites"
  ON invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND global_role = 'PASTOR'
    )
  );

-- Política: PASTOR pode deletar convites não utilizados
CREATE POLICY "PASTOR can delete invites"
  ON invites FOR DELETE
  USING (
    used_at IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND global_role = 'PASTOR'
    )
  );

-- ============================================
-- Função RPC para verificar código de convite
-- (Chamada durante o registro, permite qualquer usuário)
-- ============================================
DROP FUNCTION IF EXISTS check_invite_code(text);

CREATE OR REPLACE FUNCTION check_invite_code(invite_code text)
RETURNS TABLE (
  id uuid,
  email text,
  global_role text,
  ministries_default jsonb,
  expires_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.global_role,
    i.ministries_default,
    i.expires_at
  FROM invites i
  WHERE i.code = invite_code
    AND i.used_at IS NULL
    AND i.expires_at > NOW();
END;
$$;

-- ============================================
-- Função RPC para marcar convite como usado
-- ============================================
DROP FUNCTION IF EXISTS mark_invite_used(text);

CREATE OR REPLACE FUNCTION mark_invite_used(invite_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE invites
  SET used_at = NOW()
  WHERE code = invite_code
    AND used_at IS NULL;
END;
$$;

-- ============================================
-- Verificar se funcionou:
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename = 'invites';
