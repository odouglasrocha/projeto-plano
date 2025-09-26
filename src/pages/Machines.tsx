import { MainLayout } from "@/components/layout/MainLayout";
import { MachineStatusCard } from "@/components/dashboard/MachineStatusCard";
import { NewMachineModal } from "@/components/modals/NewMachineModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Search, Wifi, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMachines } from "@/hooks/useMachines";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import { useProductionRecords } from "@/hooks/useProductionRecords";
import { useMemo, useState } from "react";

export default function Machines() {
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const { machines, loading, refetch, realTimeEnabled: isRealTimeActive } = useMachines(realTimeEnabled);
  const { orders } = useProductionOrders();
  const { getTotalProduced } = useProductionRecords();
  const [searchTerm, setSearchTerm] = useState("");

  const statusCounts = useMemo(() => ({
    running: machines.filter(m => m.status === 'running').length,
    stopped: machines.filter(m => m.status === 'stopped').length,
    maintenance: machines.filter(m => m.status === 'maintenance').length,
    idle: machines.filter(m => m.status === 'idle').length,
  }), [machines]);

  const enrichedMachines = useMemo(() => {
    return machines
      .filter(machine => 
        machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(machine => {
        const currentOrder = orders.find(order => {
          // Handle both populated and non-populated machine_id
          const orderMachineId = typeof order.machine_id === 'object' && order.machine_id !== null 
            ? order.machine_id._id 
            : order.machine_id;
          return orderMachineId?.toString() === machine._id?.toString() && order.status === 'em_andamento';
        });
        
        const produced = currentOrder ? getTotalProduced(currentOrder._id) : 0;
        const efficiency = currentOrder && currentOrder.planned_quantity > 0 ? 
          Math.min((produced / currentOrder.planned_quantity) * 100, 100) : 0;

        const getValidStatus = (status: string) => {
          const validStatuses = ['running', 'stopped', 'maintenance', 'idle'];
          return validStatuses.includes(status) ? status as any : 'idle';
        };

        return {
          id: machine._id,
          name: machine.name,
          status: getValidStatus(machine.status),
          lastUpdate: new Date(machine.updatedAt).toLocaleString('pt-BR'),
          currentOrder: currentOrder?.code,
          efficiency: Math.round(efficiency),
          location: machine.location || 'N/A',
          model: machine.model || 'N/A'
        };
      });
  }, [machines, orders, getTotalProduced, searchTerm]);
  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gerenciamento de Máquinas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitore o status e performance de todas as máquinas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={realTimeEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className="flex items-center gap-2"
          >
            {realTimeEnabled ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {realTimeEnabled ? "Tempo Real Ativo" : "Tempo Real Inativo"}
          </Button>
          <NewMachineModal onMachineCreated={refetch} />
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-machine-running">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rodando</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.running}</p>
              </div>
              <Badge className="bg-machine-running text-white">Ativo</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-machine-stopped">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paradas</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.stopped}</p>
              </div>
              <Badge className="bg-machine-stopped text-white">Crítico</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-machine-maintenance">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Manutenção</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.maintenance}</p>
              </div>
              <Badge className="bg-machine-maintenance text-white">Agendado</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-machine-idle">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Idle</p>
                <p className="text-2xl font-bold text-gray-600">{statusCounts.idle}</p>
              </div>
              <Badge className="bg-machine-idle text-white">Esperando</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar máquinas..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Machines Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Carregando máquinas...
          </div>
        ) : enrichedMachines.length > 0 ? (
          enrichedMachines.map((machine) => (
            <Card key={machine.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{machine.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {machine.model} • {machine.location}
                    </p>
                  </div>
                  <Badge 
                    className={
                      machine.status === 'running' ? 'bg-machine-running text-white animate-pulse' :
                      machine.status === 'stopped' ? 'bg-machine-stopped text-white' :
                      machine.status === 'maintenance' ? 'bg-machine-maintenance text-white' :
                      'bg-machine-idle text-white'
                    }
                  >
                    {(() => {
                      switch (machine.status) {
                        case 'running': return 'Rodando';
                        case 'stopped': return 'Parada';
                        case 'maintenance': return 'Manutenção';
                        default: return 'Idle';
                      }
                    })()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {machine.currentOrder && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ordem Atual</p>
                    <p className="font-medium">{machine.currentOrder}</p>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Eficiência</p>
                    <span className={`font-semibold ${
                      machine.efficiency >= 85 ? 'text-green-600' : 
                      machine.efficiency >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {machine.efficiency}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        machine.efficiency >= 85 ? 'bg-green-500' : 
                        machine.efficiency >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${machine.efficiency}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Atualizado {machine.lastUpdate}
                  </p>
                  <Button variant="outline" size="sm">
                    Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {searchTerm ? 'Nenhuma máquina encontrada com esse termo' : 'Nenhuma máquina cadastrada'}
          </div>
        )}
      </div>
      </div>
    </MainLayout>
  );
}