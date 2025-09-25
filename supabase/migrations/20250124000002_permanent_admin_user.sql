-- Garantir que o usuário admin@oee.com seja permanente no sistema
-- Esta migração assegura que o administrador principal sempre exista

-- Inserir ou atualizar o perfil do administrador permanente
INSERT INTO public.profiles (email, full_name, role, sector, shift) VALUES
  ('admin@oee.com', 'João Silva - Administrador', 'admin', 'Administração', 'Integral')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  sector = EXCLUDED.sector,
  shift = EXCLUDED.shift,
  updated_at = NOW();

-- Criar política especial para proteger o usuário admin
CREATE POLICY "Protect admin user from deletion" 
ON public.profiles 
FOR DELETE 
USING (email != 'admin@oee.com');

-- Criar política para garantir que o admin sempre tenha role admin
CREATE OR REPLACE FUNCTION protect_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Impedir alteração do role do admin
  IF OLD.email = 'admin@oee.com' AND NEW.role != 'admin' THEN
    RAISE EXCEPTION 'Não é possível alterar o role do usuário administrador principal';
  END IF;
  
  -- Impedir alteração do email do admin
  IF OLD.email = 'admin@oee.com' AND NEW.email != 'admin@oee.com' THEN
    RAISE EXCEPTION 'Não é possível alterar o email do usuário administrador principal';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger de proteção
DROP TRIGGER IF EXISTS protect_admin_trigger ON public.profiles;
CREATE TRIGGER protect_admin_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_admin_role();

-- Comentário para documentação
COMMENT ON TRIGGER protect_admin_trigger ON public.profiles IS 
'Protege o usuário admin@oee.com de alterações não autorizadas no role e email';