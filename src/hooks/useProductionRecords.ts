import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : 'https://planing-ita.com/api';

export interface ProductionRecord {
  _id: string;
  order_id: string;
  operator_id: string | null;
  produced_quantity: number;
  reject_quantity: number;
  downtime_minutes: number;
  recorded_at: string;
  createdAt: string;
  downtime_type_id?: string | null;
  downtime_start_time?: string | null;
  downtime_end_time?: string | null;
  downtime_description?: string | null;
}

export function useProductionRecords() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchRecords = async (orderId?: string) => {
    try {
      let url = `${API_BASE_URL}/production-records`;
      if (orderId) {
        url += `?order_id=${orderId}`;
      }

      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch production records');
      }

      const data = await response.json();
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching production records:', error);
      toast({
        title: "Erro ao carregar registros",
        description: "Não foi possível carregar os registros de produção.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Força uma atualização dos cálculos
  const forceRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const createDowntimeRecord = async (downtimeData: {
    order_id: string;
    operator_id?: string | null;
    downtime_type_id: string;
    downtime_start_time: string;
    downtime_end_time: string;
    downtime_description?: string;
  }) => {
    console.log('createDowntimeRecord called with data:', downtimeData);
    try {
      // Calculate downtime minutes
      const startTime = new Date(downtimeData.downtime_start_time);
      const endTime = new Date(downtimeData.downtime_end_time);
      const downtimeMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      console.log('Calculated downtime minutes:', downtimeMinutes);

      const recordData = {
        order_id: downtimeData.order_id,
        operator_id: downtimeData.operator_id || null,
        produced_quantity: 0,
        reject_quantity: 0,
        downtime_minutes: downtimeMinutes,
        recorded_at: new Date().toISOString(),
        downtime_type_id: downtimeData.downtime_type_id,
        downtime_start_time: downtimeData.downtime_start_time,
        downtime_end_time: downtimeData.downtime_end_time,
        downtime_description: downtimeData.downtime_description || null,
      };

      console.log('Inserting record data:', recordData);

      const response = await fetch(`${API_BASE_URL}/production-records`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(recordData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.message || 'Failed to create downtime record');
      }

      const data = await response.json();
      console.log('Record created successfully:', data);

      // Reload all records from server to get updated data
      await fetchRecords();
      
      // Also trigger refresh for calculations
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "Parada registrada!",
        description: `Parada de ${downtimeMinutes} minutos foi registrada.`,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating downtime record:', error);
      toast({
        title: "Erro ao registrar parada",
        description: error.message || "Não foi possível registrar a parada.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createRecord = async (recordData: Omit<ProductionRecord, '_id' | 'createdAt'>, onSuccess?: () => void) => {
    try {
      console.log('Creating production record:', recordData);
      
      const response = await fetch(`${API_BASE_URL}/production-records`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(recordData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create production record');
      }

      const newRecord = await response.json();
      console.log('Production record created successfully:', newRecord);
      
      // Reload all records from server to get updated data
      await fetchRecords();
      
      // Also trigger refresh for calculations
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "Sucesso",
        description: "Registro de produção criado com sucesso",
        variant: "default",
      });

      if (onSuccess) {
        onSuccess();
      }

      return newRecord;
    } catch (error: any) {
      console.error('Error creating production record:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar registro de produção",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateRecord = async (id: string, updates: Partial<ProductionRecord>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/production-records/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update production record');
      }

      const data = await response.json();
      
      // Reload all records from server to get updated data
      await fetchRecords();
      
      // Also trigger refresh for calculations
      setRefreshTrigger(prev => prev + 1);

      toast({
        title: "Registro atualizado!",
        description: "O registro de produção foi atualizado.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating production record:', error);
      toast({
        title: "Erro ao atualizar registro",
        description: error.message || "Não foi possível atualizar o registro.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/production-records/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete production record');
      }

      // Reload all records from server to get updated data
      await fetchRecords();
      
      // Also trigger refresh for calculations
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "Registro removido!",
        description: "O registro de produção foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting production record:', error);
      toast({
        title: "Erro ao remover registro",
        description: error.message || "Não foi possível remover o registro.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getTotalProduced = useCallback((orderId: string) => {
    const filteredRecords = records.filter(record => {
      // Handle both populated and non-populated order_id
      if (!record.order_id) return false;
      
      const recordOrderId = typeof record.order_id === 'object' && record.order_id !== null 
        ? (record.order_id as any)._id 
        : record.order_id;
      
      return recordOrderId === orderId;
    });
    
    const total = filteredRecords.reduce((total, record) => total + record.produced_quantity, 0);
    return total;
  }, [records, refreshTrigger]);

  const getTotalRejects = useCallback((orderId: string) => {
    return records
      .filter(record => {
        if (!record.order_id) return false;
        
        const recordOrderId = typeof record.order_id === 'object' && record.order_id !== null 
          ? (record.order_id as any)._id 
          : record.order_id;
        return recordOrderId === orderId;
      })
      .reduce((total, record) => total + record.reject_quantity, 0);
  }, [records, refreshTrigger]);

  const getTotalDowntime = useCallback((orderId: string) => {
    return records
      .filter(record => {
        if (!record.order_id) return false;
        
        const recordOrderId = typeof record.order_id === 'object' && record.order_id !== null 
          ? (record.order_id as any)._id 
          : record.order_id;
        return recordOrderId === orderId;
      })
      .reduce((total, record) => total + record.downtime_minutes, 0);
  }, [records, refreshTrigger]);

  useEffect(() => {
    fetchRecords();
    
    // Set up automatic polling every 30 seconds
    const interval = setInterval(() => {
      fetchRecords();
    }, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return {
    records,
    loading,
    createRecord,
    createDowntimeRecord,
    updateRecord,
    deleteRecord,
    getTotalProduced,
    getTotalRejects,
    getTotalDowntime,
    forceRefresh,
    refetch: fetchRecords
  };
}