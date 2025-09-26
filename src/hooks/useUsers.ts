import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://planing-ita.com/api' 
  : 'http://localhost:3001/api';

export interface User {
  _id: string;
  id?: string; // Alias for _id for compatibility
  user_id?: string;
  full_name: string;
  email: string;
  role: string;
  sector?: string;
  shift?: string;
  status?: string;
  last_login?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserRole {
  id: string;
  name: string;
  color: string;
  level: string;
  description: string;
  permissions: string[];
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const roles: UserRole[] = [
    { 
      id: "admin", 
      name: "Administrador", 
      color: "bg-red-500",
      level: "Nível 4",
      description: "Acesso completo ao sistema com permissões administrativas totais.",
      permissions: ["Acesso total", "Gerenciar usuários", "Configurações"] 
    },
    { 
      id: "supervisor", 
      name: "Supervisor", 
      color: "bg-blue-500",
      level: "Nível 3", 
      description: "Supervisiona operações e tem acesso a relatórios avançados.",
      permissions: ["Dashboard", "Relatórios", "Gerenciar produção"] 
    },
    { 
      id: "planner", 
      name: "Planejador", 
      color: "bg-purple-500",
      level: "Nível 2",
      description: "Responsável pelo planejamento e ordens de produção.",
      permissions: ["Planejamento", "Ordens de produção", "Relatórios"] 
    },
    { 
      id: "operator", 
      name: "Operador", 
      color: "bg-green-500",
      level: "Nível 1",
      description: "Operador de chão de fábrica com acesso básico ao sistema.",
      permissions: ["Apontamentos", "Registrar perdas", "Dashboard básico"] 
    }
  ];

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      
      // Map profiles to users format
      const mappedUsers = data?.map((profile: any) => ({
        _id: profile._id,
        id: profile._id, // Add id as alias for _id
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        sector: profile.sector || '',
        shift: profile.shift || '',
        status: profile.status || 'active',
        last_login: profile.last_login || '',
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      })) || [];

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: {
    email: string;
    full_name: string;
    role: string;
    sector?: string;
    shift?: string;
  }) => {
    try {
      // Create the auth user (this automatically creates the profile)
      const authResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: 'temp123456', // Temporary password
          full_name: userData.full_name,
          role: userData.role,
          sector: userData.sector || '',
          shift: userData.shift || ''
        })
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const authData = await authResponse.json();

      // Use the profile data returned from auth/register
      const profileResult = authData.profile;

      const newUser: User = {
        _id: profileResult._id,
        user_id: profileResult.user_id,
        full_name: profileResult.full_name,
        email: profileResult.email,
        role: profileResult.role,
        sector: profileResult.sector || '',
        shift: profileResult.shift || '',
        status: 'active',
        last_login: '',
        createdAt: profileResult.createdAt,
        updatedAt: profileResult.updatedAt
      };

      setUsers(prev => [newUser, ...prev]);
      
      toast({
        title: "Usuário criado!",
        description: `Usuário ${userData.full_name} foi criado com sucesso. Senha temporária: temp123456`,
      });
      
      return newUser;
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const data = await response.json();
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, ...data } : user
      ));

      toast({
        title: "Usuário atualizado!",
        description: "As informações do usuário foram atualizadas.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      setUsers(prev => prev.filter(user => user._id !== userId));
      toast({
        title: "Usuário removido!",
        description: "O usuário foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro ao remover usuário",
        description: error.message || "Não foi possível remover o usuário.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getRoleInfo = (roleId: string): UserRole | undefined => {
    return roles.find(role => role.id === roleId);
  };

  const getUsersByRole = (roleId: string): User[] => {
    return users.filter(user => user.role === roleId);
  };

  const getTotalUsers = (): number => {
    return users.length;
  };

  const getActiveUsers = (): User[] => {
    return users.filter(user => user.status === 'active');
  };

  const getRoleStats = () => {
    const stats = roles.map(role => {
      const roleUsers = getUsersByRole(role.id);
      return {
        id: role.id,
        name: role.name,
        role: role.name,
        count: roleUsers.length,
        color: role.color,
        percentage: users.length > 0 ? Math.round((roleUsers.length / users.length) * 100) : 0
      };
    });
    return stats;
  };

  const getUserInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    roles,
    createUser,
    updateUser,
    deleteUser,
    getRoleInfo,
    getUsersByRole,
    getTotalUsers,
    getActiveUsers,
    getRoleStats,
    getUserInitials,
    refetch: fetchUsers
  };
}