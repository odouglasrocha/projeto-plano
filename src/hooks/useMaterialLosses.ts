import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { safeNumberFromMongo } from '@/lib/utils';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : 'https://planing-ita.com/api';

export interface LossType {
  _id: string;
  name: string;
  unit: string;
  color: string;
  icon: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RecentLossesResponse {
  losses: PopulatedMaterialLoss[];
  summary: {
    total_amount: number;
    total_count: number;
    avg_amount: number;
    loss_types: Array<{
      type_id: string;
      type_name: string;
      unit: string;
    }>;
  };
  period: {
    hours: number;
    from: string;
    to: string;
  };
}

export interface Machine {
  _id: string;
  name: string;
  code: string;
}

export interface PopulatedMaterialLoss {
  _id: string;
  machine_id: Machine | null;
  loss_type_id: LossType;
  order_id: {
    _id: string;
    code: string;
    product_name: string;
  } | null;
  operator_id: {
    _id: string;
    name: string;
    code: string;
  } | null;
  amount: number;
  reason: string;
  recorded_at: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MaterialLoss {
  _id: string;
  machine_id: string | null;
  loss_type_id: string;
  order_id: string | null;
  operator_id: string | null;
  amount: number;
  reason: string;
  recorded_at: string;
  createdAt: string;
  updatedAt?: string;
}

export function useMaterialLosses() {
  const [losses, setLosses] = useState<MaterialLoss[]>([]);
  const [lossTypes, setLossTypes] = useState<LossType[]>([]);
  const [recentLosses, setRecentLosses] = useState<RecentLossesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchLossTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/loss-types`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch loss types');
      }

      const data = await response.json();
      setLossTypes(data || []);
    } catch (error) {
      console.error('Error fetching loss types:', error);
      toast({
        title: "Erro ao carregar tipos de perda",
        description: "Não foi possível carregar os tipos de perda.",
        variant: "destructive",
      });
    }
  };

  const fetchRecentLosses = useCallback(async (hours: number = 24, limit: number = 10) => {
    try {
      console.log('🔄 useMaterialLosses - Iniciando fetchRecentLosses');
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/material-losses/recent?hours=${hours}&limit=${limit}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 useMaterialLosses - Dados recebidos da API:', data);
      console.log('📊 useMaterialLosses - Perdas individuais:', data.losses);
      
      // Log detalhado de cada perda
      if (data.losses && data.losses.length > 0) {
        data.losses.forEach((loss: any, index: number) => {
          console.log(`📋 Perda ${index + 1}:`, {
            id: loss._id,
            amount: loss.amount,
            machine_id: loss.machine_id,
            loss_type_id: loss.loss_type_id,
            recorded_at: loss.recorded_at,
            reason: loss.reason
          });
        });
      }
      
      setRecentLosses(data);
    } catch (error) {
      console.error('❌ useMaterialLosses - Erro ao buscar perdas recentes:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar perdas recentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchLosses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/material-losses`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch losses');
      }

      const data = await response.json();
      setLosses(data || []);
    } catch (error) {
      console.error('Error fetching losses:', error);
      toast({
        title: "Erro ao carregar perdas",
        description: "Não foi possível carregar as perdas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLoss = async (lossData: {
    machine_id: string | null;
    loss_type_id: string;
    order_id?: string | null;
    operator_id?: string | null;
    amount: number;
    reason: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/material-losses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          machine_id: lossData.machine_id,
          loss_type_id: lossData.loss_type_id,
          order_id: lossData.order_id || null,
          operator_id: lossData.operator_id || null,
          amount: lossData.amount,
          reason: lossData.reason,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create loss');
      }

      const data = await response.json();
      setLosses(prev => [data, ...prev]);
      
      // Recarregar dados recentes para atualizar os cards automaticamente
      await fetchRecentLosses(24, 10);
      
      const lossType = lossTypes.find(type => type._id === lossData.loss_type_id);
      toast({
        title: "Perda registrada!",
        description: `${lossData.amount}${lossType?.unit || 'kg'} de perda tipo ${lossType?.name || 'desconhecido'} foi registrada.`,
        variant: "default",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating loss:', error);
      toast({
        title: "Erro ao registrar perda",
        description: error.message || "Não foi possível registrar a perda.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateLoss = async (lossId: string, updates: Partial<MaterialLoss>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/material-losses/${lossId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update loss');
      }

      const data = await response.json();
      setLosses(prev => prev.map(loss => 
        loss._id === lossId ? { ...loss, ...data } : loss
      ));

      toast({
        title: "Perda atualizada!",
        description: "A perda foi atualizada com sucesso.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating loss:', error);
      toast({
        title: "Erro ao atualizar perda",
        description: error.message || "Não foi possível atualizar a perda.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteLoss = async (lossId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/material-losses/${lossId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete loss');
      }

      setLosses(prev => prev.filter(loss => loss._id !== lossId));
      toast({
        title: "Perda removida!",
        description: "A perda foi removida com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting loss:', error);
      toast({
        title: "Erro ao remover perda",
        description: error.message || "Não foi possível remover a perda.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getTotalLosses = () => {
    try {
      // Usar os dados de recentLosses que já estão populados
      if (recentLosses?.summary?.total_amount) {
        return safeNumberFromMongo(recentLosses.summary.total_amount);
      }
      
      // Fallback para o array losses se recentLosses não estiver disponível
      const total = losses.reduce((sum, loss) => {
        const valueToAdd = safeNumberFromMongo(loss.amount);
        return sum + valueToAdd;
      }, 0);
      
      return total;
    } catch (error) {
      console.error('Erro ao calcular total geral:', error);
      return 0;
    }
  };

  const getLossTypeTotal = (typeId: string) => {
    try {
      // Usar os dados de recentLosses que já estão populados
      if (recentLosses?.losses) {
        const total = recentLosses.losses
          .filter(loss => loss.loss_type_id._id === typeId)
          .reduce((sum, loss) => {
            const valueToAdd = safeNumberFromMongo(loss.amount);
            return sum + valueToAdd;
          }, 0);
        
        return total;
      }
      
      // Fallback para o array losses se recentLosses não estiver disponível
      const total = losses
        .filter(loss => loss.loss_type_id === typeId)
        .reduce((sum, loss) => {
          const valueToAdd = safeNumberFromMongo(loss.amount);
          return sum + valueToAdd;
        }, 0);
      
      return total;
    } catch (error) {
      console.error('Erro ao calcular total por tipo:', error);
      return 0;
    }
  };

  useEffect(() => {
    fetchLossTypes();
    fetchLosses();
    // Removendo fetchRecentLosses do useEffect inicial para evitar chamadas desnecessárias
  }, []);

  return {
    losses,
    lossTypes,
    recentLosses,
    loading,
    createLoss,
    updateLoss,
    deleteLoss,
    getTotalLosses,
    getLossTypeTotal,
    fetchRecentLosses,
    refetch: fetchLosses
  };
}