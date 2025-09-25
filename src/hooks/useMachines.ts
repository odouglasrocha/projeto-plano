import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = 'http://localhost:3001/api';

export interface Machine {
  _id: string;
  name: string;
  code: string;
  model: string | null;
  location: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchMachines = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/machines`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch machines');
      }

      const data = await response.json();
      setMachines(data || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast({
        title: "Erro ao carregar máquinas",
        description: "Não foi possível carregar a lista de máquinas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMachine = async (machineData: Omit<Machine, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/machines`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(machineData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create machine');
      }

      const data = await response.json();
      setMachines(prev => [...prev, data]);
      toast({
        title: "Máquina criada!",
        description: `Máquina ${machineData.name} foi criada com sucesso.`,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating machine:', error);
      toast({
        title: "Erro ao criar máquina",
        description: error.message || "Não foi possível criar a máquina.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateMachine = async (id: string, updates: Partial<Machine>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/machines/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update machine');
      }

      const data = await response.json();
      setMachines(prev => prev.map(machine => 
        machine._id === id ? { ...machine, ...data } : machine
      ));

      toast({
        title: "Máquina atualizada!",
        description: "As informações da máquina foram atualizadas.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating machine:', error);
      toast({
        title: "Erro ao atualizar máquina",
        description: error.message || "Não foi possível atualizar a máquina.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteMachine = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/machines/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete machine');
      }

      setMachines(prev => prev.filter(machine => machine._id !== id));
      toast({
        title: "Máquina removida!",
        description: "A máquina foi removida com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting machine:', error);
      toast({
        title: "Erro ao remover máquina",
        description: error.message || "Não foi possível remover a máquina.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  return {
    machines,
    loading,
    createMachine,
    updateMachine,
    deleteMachine,
    refetch: fetchMachines
  };
}