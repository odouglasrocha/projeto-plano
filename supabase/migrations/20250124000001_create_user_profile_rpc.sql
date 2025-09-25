-- Função RPC para criar perfil de usuário sem restrições de RLS
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Inserir o perfil diretamente na tabela profiles
  INSERT INTO profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (p_user_id, p_email, p_full_name, p_role, NOW(), NOW())
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
EXCEPTION
  WHEN unique_violation THEN
    -- Se o perfil já existe, retornar o ID existente
    SELECT id INTO profile_id FROM profiles WHERE user_id = p_user_id;
    RETURN profile_id;
  WHEN OTHERS THEN
    -- Log do erro e re-raise
    RAISE EXCEPTION 'Erro ao criar perfil: %', SQLERRM;
END;
$$;

-- Dar permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT) TO anon;