-- ============================================
-- FIX: Adicionar políticas RLS para message_attachments
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Apenas se a tabela message_attachments já existir
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Attachments viewable by ministry members" ON message_attachments;
DROP POLICY IF EXISTS "Members can insert attachments" ON message_attachments;
DROP POLICY IF EXISTS "Authors can delete their attachments" ON message_attachments;

-- Política: Membros do ministério podem ver anexos das mensagens
CREATE POLICY "Attachments viewable by ministry members"
  ON message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN ministry_members mm ON mm.ministry_id = m.ministry_id
      WHERE m.id = message_attachments.message_id
      AND mm.user_id = auth.uid()
    )
  );

-- Política: Membros podem inserir anexos em suas mensagens
CREATE POLICY "Members can insert attachments"
  ON message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN ministry_members mm ON mm.ministry_id = m.ministry_id
      WHERE m.id = message_attachments.message_id
      AND mm.user_id = auth.uid()
    )
  );

-- Política: Autores podem deletar seus próprios anexos
CREATE POLICY "Authors can delete their attachments"
  ON message_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
      AND m.author_id = auth.uid()
    )
  );

-- ============================================
-- Verificar se funcionou:
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename = 'message_attachments';
