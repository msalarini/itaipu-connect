-- ============================================
-- FIX COMPLETO: Criar perfil automaticamente via Trigger
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Remover políticas antigas de profiles se existirem
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- 2. Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, global_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'global_role', 'MEMBER')
  );
  RETURN NEW;
END;
$$;

-- 3. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Criar trigger que executa quando novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Política permissiva para INSERT (backup, caso o trigger falhe)
CREATE POLICY "Enable insert for authenticated users only"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- Verificar se funcionou:
-- ============================================
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
