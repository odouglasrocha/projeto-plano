import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : 'https://planing-ita.com/api';

export interface ProductionOrder {
  _id: string;
  code: string;
  product_name: string;
  machine_id: string | { _id: string; name: string; code: string } | null;
  planned_quantity: number;
  pallet_quantity: number;
  status: string;
  shift: string;
  createdAt: string;
  updatedAt: string;
}

export function useProductionOrders() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/production-orders`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch production orders');
      }

      const data = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching production orders:', error);
      toast({
        title: "Erro ao carregar ordens",
        description: "Não foi possível carregar as ordens de produção.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: Omit<ProductionOrder, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/production-orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create production order');
      }

      const data = await response.json();
      setOrders(prev => [data, ...prev]);
      toast({
        title: "Ordem criada!",
        description: `Ordem ${orderData.code} foi criada com sucesso.`,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating production order:', error);
      
      toast({
        title: "Erro ao criar ordem",
        description: error.message || "Não foi possível criar a ordem de produção.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateOrder = async (id: string, updates: Partial<ProductionOrder>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/production-orders/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update production order');
      }

      const data = await response.json();
      setOrders(prev => prev.map(order => 
        order._id === id ? { ...order, ...data } : order
      ));

      toast({
        title: "Ordem atualizada!",
        description: "A ordem de produção foi atualizada.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating production order:', error);
      toast({
        title: "Erro ao atualizar ordem",
        description: error.message || "Não foi possível atualizar a ordem.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/production-orders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete production order');
      }

      setOrders(prev => prev.filter(order => order._id !== id));
      toast({
        title: "Ordem removida!",
        description: "A ordem de produção foi removida com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting production order:', error);
      toast({
        title: "Erro ao remover ordem",
        description: error.message || "Não foi possível remover a ordem.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    createOrder,
    updateOrder,
    deleteOrder,
    refetch: fetchOrders
  };
}