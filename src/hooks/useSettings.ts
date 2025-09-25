import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = 'http://localhost:3001/api';

export interface SystemSettings {
  [key: string]: string | boolean | number;
}

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const defaultSettings = {
    // Configurações Gerais
    company_name: "Empresa Industrial LTDA",
    timezone: "America/Sao_Paulo",
    language: "pt_BR",
    date_format: "DD/MM/YYYY",
    currency: "BRL",
    
    // Configurações OEE
    availability_target: "85",
    performance_target: "90", 
    quality_target: "95",
    oee_target: "80",
    update_interval: "30",
    auto_calculation: true,
    
    // Configurações de Notificação
    email_notifications: true,
    downtime_alerts: true,
    low_oee_alerts: true,
    production_target_alerts: true,
    loss_threshold_alerts: true,
    email_threshold: "70",
    
    // Configurações do Sistema
    auto_backup: true,
    backup_interval: "daily",
    data_retention: "365",
    maintenance_mode: false,
    debug_mode: false
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      
      // Converter array de configurações para objeto
      const settingsObj: SystemSettings = { ...defaultSettings };
      
      if (data && Array.isArray(data)) {
        data.forEach((setting: any) => {
          let value: any = setting.value;
          
          // Converter strings boolean para boolean
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          // Tentar converter para número se possível
          else if (!isNaN(Number(value)) && value !== '') value = Number(value);
          
          settingsObj[setting.key] = value;
        });
      }
      
      setSettings(settingsObj);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Usando configurações padrão.",
        variant: "destructive",
      });
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          key, 
          value: String(value)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update setting');
      }

      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message || "Não foi possível atualizar a configuração.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateMultipleSettings = async (newSettings: Record<string, any>) => {
    try {
      const settingsArray = Object.entries(newSettings).map(([key, value]) => ({
        key,
        value: String(value)
      }));

      const response = await fetch(`${API_BASE_URL}/settings/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ settings: settingsArray })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }

      setSettings(prev => ({ ...prev, ...newSettings }));
      
      toast({
        title: "Configurações salvas!",
        description: "As configurações foram atualizadas com sucesso.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: "Erro ao salvar configurações",
        description: error.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetToDefaults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/reset`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset settings');
      }

      setSettings(defaultSettings);
      
      toast({
        title: "Configurações resetadas!",
        description: "Todas as configurações foram restauradas para os valores padrão.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      toast({
        title: "Erro ao resetar configurações",
        description: error.message || "Não foi possível resetar as configurações.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSetting = async (key: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/${key}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete setting');
      }

      setSettings(prev => {
        const newSettings = { ...prev };
        delete newSettings[key];
        return newSettings;
      });

      toast({
        title: "Configuração removida!",
        description: "A configuração foi removida com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting setting:', error);
      toast({
        title: "Erro ao remover configuração",
        description: error.message || "Não foi possível remover a configuração.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getSetting = (key: string) => {
    return settings[key] ?? defaultSettings[key as keyof typeof defaultSettings];
  };

  const getSettingsByCategory = (category: string): Record<string, any> => {
    const categorySettings: Record<string, any> = {};
    
    Object.entries(settings).forEach(([key, value]) => {
      if (key.startsWith(category)) {
        categorySettings[key] = value;
      }
    });
    
    return categorySettings;
  };

  const exportSettings = (): string => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = async (settingsJson: string) => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      await updateMultipleSettings(importedSettings);
      
      toast({
        title: "Configurações importadas!",
        description: "As configurações foram importadas com sucesso.",
      });
    } catch (error: any) {
      console.error('Error importing settings:', error);
      toast({
        title: "Erro ao importar configurações",
        description: error.message || "Formato de arquivo inválido.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    updateMultipleSettings,
    resetToDefaults,
    deleteSetting,
    getSetting,
    getSettingsByCategory,
    exportSettings,
    importSettings,
    refetch: fetchSettings
  };
}