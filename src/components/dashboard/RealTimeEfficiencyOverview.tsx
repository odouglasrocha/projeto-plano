import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Zap, 
  Target, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Factory,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealTimeEfficiency } from "@/hooks/useRealTimeEfficiency";
import { OEECard } from "./OEECard";

interface RealTimeEfficiencyOverviewProps {
  className?: string;
  refreshInterval?: number;
}

export function RealTimeEfficiencyOverview({ 
  className, 
  refreshInterval = 30000 
}: RealTimeEfficiencyOverviewProps) {
  const {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    oeeMetrics,
    machineEfficiency,
    summary,
    isConnected,
    isStale,
    getMachinesWithIssues,
    getTopPerformingMachines
  } = useRealTimeEfficiency(refreshInterval);

  const machinesWithIssues = getMachinesWithIssues();
  const topPerformingMachines = getTopPerformingMachines(3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'idle':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'Em Operação';
      case 'stopped':
        return 'Parada';
      case 'maintenance':
        return 'Manutenção';
      case 'idle':
        return 'Ociosa';
      default:
        return 'Desconhecido';
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Nunca';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    return lastUpdated.toLocaleTimeString('pt-BR');
  };

  if (loading && !data) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Eficiência em Tempo Real</h2>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Erro ao carregar dados</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Eficiência em Tempo Real</h2>
          <p className="text-sm text-muted-foreground">
            Visão geral da eficiência e OEE das máquinas
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className={cn("h-4 w-4", isStale ? "text-yellow-500" : "text-green-500")} />
                <span className={cn(isStale ? "text-yellow-600" : "text-green-600")}>
                  {isStale ? "Dados desatualizados" : "Conectado"}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Desconectado</span>
              </>
            )}
          </div>
          
          {/* Last Updated */}
          <div className="text-xs text-muted-foreground">
            Atualizado: {formatLastUpdated()}
          </div>
          
          {/* Refresh Button */}
          <Button 
            onClick={refresh} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* OEE Metrics Cards */}
      {oeeMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <OEECard
            title="Disponibilidade"
            value={oeeMetrics.availability.value}
            target={oeeMetrics.availability.target}
            trend={oeeMetrics.availability.trend}
            type="availability"
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <OEECard
            title="Performance"
            value={oeeMetrics.performance.value}
            target={oeeMetrics.performance.target}
            trend={oeeMetrics.performance.trend}
            type="performance"
            icon={<Zap className="h-5 w-5" />}
          />
          <OEECard
            title="Qualidade"
            value={oeeMetrics.quality.value}
            target={oeeMetrics.quality.target}
            trend={oeeMetrics.quality.trend}
            type="quality"
            icon={<Target className="h-5 w-5" />}
          />
          <OEECard
            title="OEE Geral"
            value={oeeMetrics.overall.value}
            target={oeeMetrics.overall.target}
            trend={oeeMetrics.overall.trend}
            type="oee"
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Summary and Machine Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                Resumo da Produção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Máquinas Ativas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.running_machines}/{summary.total_machines}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ordens Ativas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summary.active_orders}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produzido</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.total_produced.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rejeitos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {summary.total_rejects.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Tempo de Parada</p>
                <p className="text-xl font-bold text-yellow-600">
                  {Math.floor(summary.total_downtime / 60)}h {summary.total_downtime % 60}min
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Performing Machines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Melhor Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformingMachines.length > 0 ? (
              <div className="space-y-3">
                {topPerformingMachines.map((machine, index) => (
                  <div key={machine.machine_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(machine.machine_status))} />
                      <span className="font-medium text-sm">{machine.machine_name}</span>
                    </div>
                    <Badge variant={machine.efficiency >= 85 ? "default" : machine.efficiency >= 70 ? "secondary" : "destructive"}>
                      {machine.efficiency.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma máquina em operação</p>
            )}
          </CardContent>
        </Card>

        {/* Machines with Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent>
            {machinesWithIssues.length > 0 ? (
              <div className="space-y-3">
                {machinesWithIssues.slice(0, 5).map((machine) => (
                  <div key={machine.machine_id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", getStatusColor(machine.machine_status))} />
                        <span className="font-medium text-sm">{machine.machine_name}</span>
                      </div>
                      <Badge variant="destructive">
                        {machine.efficiency.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground ml-4">
                      {machine.downtime_minutes > 60 && (
                        <span>Parada: {Math.floor(machine.downtime_minutes / 60)}h {machine.downtime_minutes % 60}min</span>
                      )}
                      {machine.efficiency < 70 && machine.downtime_minutes > 60 && " • "}
                      {machine.efficiency < 70 && (
                        <span>Baixa eficiência</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Todas as máquinas operando normalmente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Machine Status Grid */}
      {machineEfficiency.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              Status das Máquinas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machineEfficiency.map((machine) => (
                <div key={machine.machine_id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{machine.machine_name}</h4>
                    <Badge variant="outline">
                      {getStatusText(machine.machine_status)}
                    </Badge>
                  </div>
                  
                  {machine.current_order && (
                    <div className="text-sm text-muted-foreground">
                      <p>Ordem: {machine.current_order.code}</p>
                      <p>{machine.current_order.product_name}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Eficiência</span>
                      <span className={cn(
                        "font-medium",
                        machine.efficiency >= 85 ? "text-green-600" : 
                        machine.efficiency >= 70 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {machine.efficiency.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          machine.efficiency >= 85 ? "bg-green-500" : 
                          machine.efficiency >= 70 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.min(machine.efficiency, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Produzido: {machine.produced_quantity}</div>
                    <div>Rejeitos: {machine.reject_quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}