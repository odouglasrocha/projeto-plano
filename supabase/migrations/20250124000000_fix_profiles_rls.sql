-- Corrigir políticas RLS para permitir criação de usuários por administradores

-- Remover política restritiva de insert
DROP POLICY IF EXISTS "Allow insert during signup" ON public.profiles;

-- Criar política mais permissiva para insert
CREATE POLICY "Allow insert for authenticated users"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Adicionar política para permitir que administradores vejam todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
  OR auth.uid() = user_id
);

-- Adicionar política para permitir que administradores atualizem todos os perfis
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
  OR auth.uid() = user_id
);

-- Adicionar política para permitir que administradores deletem perfis
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);