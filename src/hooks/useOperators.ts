import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : 'https://planing-ita.com/api';

export interface Operator {
  _id: string;
  name: string;
  code: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export function useOperators() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchOperators = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/operators`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch operators');
      }

      const data = await response.json();
      setOperators(data || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
      toast({
        title: "Erro ao carregar operadores",
        description: "Não foi possível carregar a lista de operadores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOperator = async (operatorData: Omit<Operator, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/operators`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(operatorData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create operator');
      }

      const data = await response.json();
      setOperators(prev => [...prev, data]);
      toast({
        title: "Operador criado!",
        description: `Operador ${operatorData.name} foi criado com sucesso.`,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating operator:', error);
      toast({
        title: "Erro ao criar operador",
        description: error.message || "Não foi possível criar o operador.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateOperator = async (id: string, updates: Partial<Operator>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/operators/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update operator');
      }

      const data = await response.json();
      setOperators(prev => prev.map(operator => 
        operator._id === id ? { ...operator, ...data } : operator
      ));

      toast({
        title: "Operador atualizado!",
        description: "As informações do operador foram atualizadas.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating operator:', error);
      toast({
        title: "Erro ao atualizar operador",
        description: error.message || "Não foi possível atualizar o operador.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteOperator = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/operators/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete operator');
      }

      setOperators(prev => prev.filter(operator => operator._id !== id));
      toast({
        title: "Operador removido!",
        description: "O operador foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting operator:', error);
      toast({
        title: "Erro ao remover operador",
        description: error.message || "Não foi possível remover o operador.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  return {
    operators,
    loading,
    createOperator,
    updateOperator,
    deleteOperator,
    refetch: fetchOperators
  };
}