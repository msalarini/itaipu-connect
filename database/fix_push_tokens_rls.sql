-- ============================================
-- Fase 10: Políticas RLS para push_tokens
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can delete own tokens" ON push_tokens;

-- Política: Usuários podem ver seus próprios tokens
CREATE POLICY "Users can view own tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir seus próprios tokens
CREATE POLICY "Users can insert own tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios tokens
CREATE POLICY "Users can update own tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios tokens
CREATE POLICY "Users can delete own tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Verificar se funcionou:
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename = 'push_tokens';
