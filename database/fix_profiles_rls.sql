-- ============================================
-- FIX: Adicionar política INSERT para profiles
-- ============================================
-- O erro "new row violates row-level security policy for table profiles"
-- acontece porque não existe política de INSERT para a tabela profiles.
--
-- Execute este SQL no Supabase SQL Editor:
-- ============================================

-- Remover política anterior se existir
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Permitir que usuários autenticados criem seu próprio perfil
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- Alternativa: Se precisar de mais flexibilidade para triggers
-- Use esta versão que permite insert de qualquer usuário autenticado:
-- ============================================

-- DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;
-- CREATE POLICY "Authenticated users can insert profiles"
-- ON profiles FOR INSERT
-- WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- IMPORTANTE: Se você usa um trigger para criar profiles, 
-- pode precisar de uma política ainda mais permissiva:
-- ============================================

-- Versão mais permissiva (use apenas se necessário)
-- DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
-- CREATE POLICY "Service role can insert profiles"
-- ON profiles FOR INSERT
-- WITH CHECK (true);

-- ============================================
-- Verificar se funcionou:
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
