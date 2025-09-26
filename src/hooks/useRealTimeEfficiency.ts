import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : 'https://planing-ita.com/api';

export interface MachineEfficiency {
  machine_id: string;
  machine_name: string;
  machine_status: 'running' | 'stopped' | 'maintenance' | 'idle';
  current_order: {
    id: string;
    code: string;
    product_name: string;
    planned_quantity: number;
  } | null;
  efficiency: number;
  produced_quantity: number;
  reject_quantity: number;
  downtime_minutes: number;
  last_updated: string;
}

export interface OEEMetric {
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
}

export interface OEEMetrics {
  availability: OEEMetric;
  performance: OEEMetric;
  quality: OEEMetric;
  overall: OEEMetric;
}

export interface EfficiencySummary {
  total_machines: number;
  running_machines: number;
  active_orders: number;
  total_produced: number;
  total_rejects: number;
  total_downtime: number;
}

export interface RealTimeEfficiencyData {
  timestamp: string;
  oee_metrics: OEEMetrics;
  machine_efficiency: MachineEfficiency[];
  summary: EfficiencySummary;
}

export function useRealTimeEfficiency(refreshInterval: number = 30000) {
  const [data, setData] = useState<RealTimeEfficiencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const fetchEfficiencyData = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/production-records/efficiency/realtime`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const efficiencyData = await response.json();
      
      // Verificar se os dados têm a estrutura esperada
      if (efficiencyData && typeof efficiencyData === 'object') {
        // Se os dados vêm diretamente como array de máquinas
        if (Array.isArray(efficiencyData)) {
          const processedData = {
            timestamp: new Date().toISOString(),
            machine_efficiency: efficiencyData,
            oee_metrics: {
              availability: { value: 0, target: 85, trend: 'stable' as const },
              performance: { value: 0, target: 85, trend: 'stable' as const },
              quality: { value: 0, target: 95, trend: 'stable' as const },
              overall: { value: 0, target: 80, trend: 'stable' as const }
            },
            summary: {
              total_machines: efficiencyData.length,
              running_machines: efficiencyData.filter(m => m.machine_status === 'running').length,
              active_orders: efficiencyData.filter(m => m.current_order).length,
              total_produced: efficiencyData.reduce((sum, m) => sum + (m.produced_quantity || 0), 0),
              total_rejects: efficiencyData.reduce((sum, m) => sum + (m.reject_quantity || 0), 0),
              total_downtime: efficiencyData.reduce((sum, m) => sum + (m.downtime_minutes || 0), 0)
            }
          };
          setData(processedData);
        } else {
          // Se os dados já têm a estrutura completa
          setData(efficiencyData);
        }
      } else {
        setData(null);
      }
      setLastUpdated(new Date());
      
      // Only set loading to false after first successful fetch
      if (loading) {
        setLoading(false);
      }
      
    } catch (error: any) {
      console.error('Error fetching real-time efficiency data:', error);
      setError(error.message || 'Erro ao carregar dados de eficiência');
      
      // Only show toast on first error or if we had data before
      if (loading || data) {
        toast({
          title: "Erro ao carregar eficiência",
          description: "Não foi possível carregar os dados de eficiência em tempo real.",
          variant: "destructive",
        });
      }
      
      setLoading(false);
    }
  }, [loading, data, toast]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchEfficiencyData();
  }, [fetchEfficiencyData]);

  // Get efficiency for a specific machine
  const getMachineEfficiency = useCallback((machineId: string): MachineEfficiency | null => {
    if (!data?.machine_efficiency) return null;
    return data.machine_efficiency.find(m => m.machine_id === machineId) || null;
  }, [data]);

  // Get machines by status
  const getMachinesByStatus = useCallback((status: MachineEfficiency['machine_status']): MachineEfficiency[] => {
    if (!data?.machine_efficiency) return [];
    return data.machine_efficiency.filter(m => m.machine_status === status);
  }, [data]);

  // Get top performing machines
  const getTopPerformingMachines = useCallback((limit: number = 5): MachineEfficiency[] => {
    if (!data?.machine_efficiency) return [];
    return [...data.machine_efficiency]
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, limit);
  }, [data]);

  // Get machines with issues (low efficiency or high downtime)
  const getMachinesWithIssues = useCallback((): MachineEfficiency[] => {
    if (!data?.machine_efficiency) return [];
    return data.machine_efficiency.filter(m => 
      m.efficiency < 70 || m.downtime_minutes > 60
    );
  }, [data]);

  // Calculate trend compared to previous data
  const getTrendIndicator = useCallback((currentValue: number, previousValue: number): 'up' | 'down' | 'stable' => {
    const threshold = 2; // 2% threshold for trend detection
    const diff = currentValue - previousValue;
    
    if (Math.abs(diff) < threshold) return 'stable';
    return diff > 0 ? 'up' : 'down';
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchEfficiencyData();
    
    // Set up polling interval
    const interval = setInterval(() => {
      fetchEfficiencyData();
    }, refreshInterval);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [fetchEfficiencyData, refreshInterval]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    getMachineEfficiency,
    getMachinesByStatus,
    getTopPerformingMachines,
    getMachinesWithIssues,
    getTrendIndicator,
    // Convenience getters for OEE metrics
    oeeMetrics: data?.oee_metrics || null,
    machineEfficiency: data?.machine_efficiency || [],
    summary: data?.summary || null,
    // Status indicators
    isConnected: !error && data !== null,
    isStale: lastUpdated ? (Date.now() - lastUpdated.getTime()) > refreshInterval * 2 : false
  };
}