-- ============================================
-- Supabase Storage Setup for Message Attachments
-- ============================================
-- Execute este SQL no Supabase SQL Editor após criar o bucket manualmente
-- 
-- PASSO 1: Criar bucket via Dashboard do Supabase:
--   - Nome: message-attachments
--   - Public: false
--   - File size limit: 10485760 (10MB)
--   - Allowed MIME types: image/*, application/pdf
--
-- PASSO 2: Executar este SQL abaixo
-- ============================================

-- Política: Usuários podem visualizar anexos de mensagens em ministérios que participam
CREATE POLICY "Users can view attachments from their ministries"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'message-attachments'
  AND (
    -- Public read para mensagens de ministérios onde o usuário é membro
    EXISTS (
      SELECT 1 
      FROM ministry_members mm
      INNER JOIN messages m ON m.ministry_id = mm.ministry_id
      WHERE mm.user_id = auth.uid()
      -- Extrai o message_id do path (formato: ministry_id/message_id/filename)
      AND storage.objects.name LIKE '%' || m.id || '%'
    )
    -- OU o usuário é PASTOR (vê tudo)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND global_role = 'PASTOR'
    )
  )
);

-- Política: Usuários podem fazer upload de anexos para seus ministérios
CREATE POLICY "Users can upload attachments to their ministries"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments'
  AND auth.uid() IS NOT NULL
  -- Verifica se o usuário é membro do ministério
  -- (O path deve começar com ministry_id onde o usuário é membro)
  AND EXISTS (
    SELECT 1 FROM ministry_members
    WHERE user_id = auth.uid()
    AND ministry_id::text = split_part(storage.objects.name, '/', 1)
  )
);

-- Política: Apenas o autor da mensagem pode deletar anexos
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1 FROM messages m
    INNER JOIN message_attachments ma ON ma.message_id = m.id
    WHERE m.author_id = auth.uid()
    AND storage.objects.name = ma.storage_path
  )
);

-- ============================================
-- Notas:
-- - O bucket 'message-attachments' deve ser criado manualmente primeiro
-- - A estrutura de path é: {ministry_id}/{message_id}/{filename}
-- - Tamanho máximo: 10MB
-- - Tipos aceitos: imagens (jpg, png, gif) e PDF
-- ============================================
