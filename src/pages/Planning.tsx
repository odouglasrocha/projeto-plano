import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewOrderModal } from "@/components/modals/NewOrderModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import { useMachines } from "@/hooks/useMachines";
import { useProductionRecords } from "@/hooks/useProductionRecords";
import { useMemo } from "react";

const shifts = [
  { name: "Manhã", value: "manha", period: "06:00 - 14:00", active: true },
  { name: "Tarde", value: "tarde", period: "14:00 - 22:00", active: false },
  { name: "Noite", value: "noite", period: "22:00 - 06:00", active: false }
];

export default function Planning() {
  const { orders, loading, refetch } = useProductionOrders();
  const { machines } = useMachines();
  const { getTotalProduced } = useProductionRecords();

  const enrichedOrders = useMemo(() => {
    console.log('Máquinas disponíveis:', machines);
    console.log('Ordens de produção:', orders);
    
    return orders.map(order => {
      console.log(`Processando order ${order.code} com machine_id:`, order.machine_id);
      
      let machine_name = 'Máquina não encontrada';
      
      // Verificar se machine_id é um objeto populado ou apenas um ID
      if (order.machine_id !== null && order.machine_id !== undefined) {
        if (typeof order.machine_id === 'object' && 'name' in order.machine_id) {
          // machine_id é um objeto populado
          machine_name = order.machine_id.name;
          console.log(`Máquina populada encontrada: ${machine_name}`);
        } else if (typeof order.machine_id === 'string') {
          // machine_id é apenas um ID, procurar na lista de máquinas
          const machineId = order.machine_id as string;
          const machine = machines.find(m => m._id === machineId);
          machine_name = machine?.name || 'Máquina não encontrada';
          console.log(`Máquina encontrada por ID: ${machine_name}`);
        }
      }
      
      const produced = getTotalProduced(order._id);
      
      return {
        ...order,
        machine_name,
        produced,
        progress: Math.round((produced / order.planned_quantity) * 100)
      };
    });
  }, [orders, machines, getTotalProduced]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_andamento': return 'bg-green-500 text-white';
      case 'planejada': return 'bg-gray-500 text-white';
      case 'concluida': return 'bg-blue-500 text-white';
      case 'cancelada': return 'bg-red-500 text-white';
      // Manter compatibilidade com status antigos
      case 'running': return 'bg-green-500 text-white';
      case 'stopped': return 'bg-red-500 text-white';
      case 'concluida': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_andamento': return 'Em Produção';
      case 'planejada': return 'Planejada';
      case 'concluida': return 'Concluída';
      case 'cancelada': return 'Cancelada';
      // Manter compatibilidade com status antigos
      case 'running': return 'Em Produção';
      case 'stopped': return 'Parada';
      case 'concluida': return 'Concluída';
      case 'pending': return 'Planejada';
      default: return 'Desconhecido';
    }
  };

  const getShiftDisplayName = (shiftValue: string) => {
    const shift = shifts.find(s => s.value === shiftValue);
    return shift ? shift.name : shiftValue;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Planejamento de Produção</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie ordens de produção por turno e máquina
          </p>
        </div>
          <NewOrderModal onOrderCreated={refetch} />
      </div>

      {/* Shift Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {shifts.map((shift, index) => (
          <Card key={index} className={`${shift.active ? 'border-primary border-2' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{shift.name}</h3>
                  <p className="text-sm text-muted-foreground">{shift.period}</p>
                </div>
                {shift.active && (
                  <Badge className="bg-primary text-primary-foreground animate-pulse">
                    Ativo
                  </Badge>
                )}
              </div>
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">
                  {enrichedOrders.filter(order => order.shift === shift.value).length} ordens ativas
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Production Orders */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Ordens de Produção</h2>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando ordens de produção...
          </div>
        ) : enrichedOrders.length > 0 ? (
          <div className="grid gap-4">
            {enrichedOrders.map((order) => (
              <Card key={order._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base sm:text-lg">{order.code}</CardTitle>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="self-start sm:self-auto">
                      {getShiftDisplayName(order.shift)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Produto</p>
                      <p className="font-medium">{order.product_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Máquina</p>
                      <p className="font-medium">{order.machine_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Criado em {(() => {
                          try {
                            const date = new Date(order.createdAt);
                            return isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR');
                          } catch {
                            return 'Data inválida';
                          }
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Progresso</p>
                      <span className="text-sm font-medium">
                        {order.produced.toLocaleString()} / {order.planned_quantity.toLocaleString()} unidades
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          order.progress >= 90 ? 'bg-green-500' :
                          order.progress >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(order.progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.progress}% concluído
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 border-t gap-3">
                    <div className="flex items-center gap-2">
                      {order.status === 'stopped' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">Atenção necessária</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma ordem de produção encontrada. Clique em "Nova Ordem" para criar uma.
          </div>
        )}
      </div>
      </div>
    </MainLayout>
  );
}