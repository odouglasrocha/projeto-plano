import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = 'http://localhost:3001/api';

export interface Report {
  _id: string;
  name: string;
  type: string;
  format: string;
  parameters?: any;
  file_path?: string;
  file_size?: number;
  status: 'generating' | 'completed' | 'failed';
  created_by?: string;
  createdAt: string;
  completed_at?: string;
  updatedAt?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const reportTemplates: ReportTemplate[] = [
    {
      id: "oee-daily",
      name: "Relatório OEE Diário",
      description: "Análise completa de disponibilidade, performance e qualidade por dia",
      icon: "BarChart3",
      color: "bg-blue-500"
    },
    {
      id: "production-summary",
      name: "Resumo de Produção",
      description: "Consolidado de produção por máquina e turno",
      icon: "Factory",
      color: "bg-green-500"
    },
    {
      id: "losses-analysis",
      name: "Análise de Perdas",
      description: "Breakdown detalhado de perdas por tipo e causa",
      icon: "AlertTriangle",
      color: "bg-red-500"
    },
    {
      id: "shift-report",
      name: "Relatório por Turno",
      description: "Performance detalhada por turno de trabalho",
      icon: "Clock",
      color: "bg-purple-500"
    }
  ];

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports?limit=20`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Erro ao carregar relatórios",
        description: "Não foi possível carregar os relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportData: {
    type: string;
    dateFrom?: string;
    dateTo?: string;
    machineId?: string;
    format: string;
  }) => {
    try {
      const template = reportTemplates.find(t => t.id === reportData.type);
      if (!template) throw new Error('Template não encontrado');

      const reportName = `${template.name} - ${new Date().toLocaleDateString('pt-BR')}`;

      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: reportName,
          type: reportData.type,
          format: reportData.format,
          parameters: {
            dateFrom: reportData.dateFrom,
            dateTo: reportData.dateTo,
            machineId: reportData.machineId
          },
          status: 'generating'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }

      const data = await response.json();

      // Simular processamento do relatório
      setTimeout(async () => {
        try {
          const updateResponse = await fetch(`${API_BASE_URL}/reports/${data._id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              status: 'completed',
              completed_at: new Date().toISOString(),
              file_size: Math.floor(Math.random() * 3000000) + 1000000
            })
          });

          if (updateResponse.ok) {
            fetchReports();
          }
        } catch (error) {
          console.error('Error updating report status:', error);
        }
      }, 3000);

      setReports(prev => [data, ...prev]);
      
      toast({
        title: "Relatório iniciado!",
        description: `${reportName} está sendo gerado.`,
        variant: "default",
      });

      return data;
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Não foi possível iniciar a geração do relatório.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateReport = async (reportId: string, updates: Partial<Report>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update report');
      }

      const data = await response.json();
      setReports(prev => prev.map(report => 
        report._id === reportId ? { ...report, ...data } : report
      ));

      toast({
        title: "Relatório atualizado!",
        description: "O relatório foi atualizado com sucesso.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating report:', error);
      toast({
        title: "Erro ao atualizar relatório",
        description: error.message || "Não foi possível atualizar o relatório.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete report');
      }

      setReports(prev => prev.filter(report => report._id !== reportId));
      toast({
        title: "Relatório removido!",
        description: "O relatório foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting report:', error);
      toast({
        title: "Erro ao remover relatório",
        description: error.message || "Não foi possível remover o relatório.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const downloadReport = (reportId: string) => {
    const report = reports.find(r => r._id === reportId);
    if (!report) return;

    // Simular download
    toast({
      title: "Download iniciado!",
      description: `Fazendo download de ${report.name}`,
      variant: "default",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getReportsByType = (type: string): Report[] => {
    return reports.filter(report => report.type === type);
  };

  const getReportsByStatus = (status: 'generating' | 'completed' | 'failed'): Report[] => {
    return reports.filter(report => report.status === status);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    reportTemplates,
    loading,
    generateReport,
    updateReport,
    deleteReport,
    downloadReport,
    formatFileSize,
    getReportsByType,
    getReportsByStatus,
    refetch: fetchReports
  };
}