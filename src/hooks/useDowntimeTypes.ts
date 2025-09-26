import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : 'https://planing-ita.com/api';

export interface DowntimeType {
  _id: string;
  name: string;
  description: string | null;
  category: string;
  createdAt: string;
  updatedAt?: string;
}

export function useDowntimeTypes() {
  const [downtimeTypes, setDowntimeTypes] = useState<DowntimeType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchDowntimeTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/downtime-types`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch downtime types');
      }

      const data = await response.json();
      setDowntimeTypes(data || []);
    } catch (error) {
      console.error('Error fetching downtime types:', error);
      toast({
        title: "Erro ao carregar tipos de parada",
        description: "Não foi possível carregar os tipos de parada.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDowntimeType = async (typeData: {
    name: string;
    description?: string | null;
    category: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/downtime-types`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(typeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create downtime type');
      }

      const data = await response.json();
      setDowntimeTypes(prev => [data, ...prev]);

      toast({
        title: "Tipo de parada criado!",
        description: `Tipo de parada "${typeData.name}" foi criado com sucesso.`,
      });

      return data;
    } catch (error: any) {
      console.error('Error creating downtime type:', error);
      toast({
        title: "Erro ao criar tipo de parada",
        description: error.message || "Não foi possível criar o tipo de parada.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDowntimeType = async (typeId: string, updates: Partial<DowntimeType>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/downtime-types/${typeId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update downtime type');
      }

      const data = await response.json();
      setDowntimeTypes(prev => prev.map(type => 
        type._id === typeId ? { ...type, ...data } : type
      ));

      toast({
        title: "Tipo de parada atualizado!",
        description: "O tipo de parada foi atualizado com sucesso.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating downtime type:', error);
      toast({
        title: "Erro ao atualizar tipo de parada",
        description: error.message || "Não foi possível atualizar o tipo de parada.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDowntimeType = async (typeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/downtime-types/${typeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete downtime type');
      }

      setDowntimeTypes(prev => prev.filter(type => type._id !== typeId));
      toast({
        title: "Tipo de parada removido!",
        description: "O tipo de parada foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting downtime type:', error);
      toast({
        title: "Erro ao remover tipo de parada",
        description: error.message || "Não foi possível remover o tipo de parada.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getTypesByCategory = (category: string): DowntimeType[] => {
    return downtimeTypes.filter(type => type.category === category);
  };

  const getCategories = (): string[] => {
    const categories = downtimeTypes.map(type => type.category);
    return [...new Set(categories)].sort();
  };

  useEffect(() => {
    fetchDowntimeTypes();
  }, []);

  return {
    downtimeTypes,
    loading,
    createDowntimeType,
    updateDowntimeType,
    deleteDowntimeType,
    getTypesByCategory,
    getCategories,
    refetch: fetchDowntimeTypes
  };
}