import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Package, 
  User, 
  CheckCircle,
  AlertCircle,
  StopCircle,
  Timer
} from "lucide-react";
import { useState, useMemo } from "react";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import { useProductionRecords } from "@/hooks/useProductionRecords";
import { useMachines } from "@/hooks/useMachines";
import { useOperators } from "@/hooks/useOperators";
import { useDowntimeTypes } from "@/hooks/useDowntimeTypes";
import { materialsData } from "@/integrations/data/materialsData";

export default function Production() {
  const { orders, updateOrder } = useProductionOrders();
  const { 
    records, 
    createRecord, 
    createDowntimeRecord,
    updateRecord, 
    deleteRecord, 
    getTotalProduced, 
    loading 
  } = useProductionRecords();
  const { machines } = useMachines();
  const { operators } = useOperators();
  const { downtimeTypes } = useDowntimeTypes();
  const [selectedOrder, setSelectedOrder] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("");
  
  // Downtime form state
  const [downtimeTypeId, setDowntimeTypeId] = useState("");
  const [downtimeStartTime, setDowntimeStartTime] = useState("");
  const [downtimeEndTime, setDowntimeEndTime] = useState("");
  const [downtimeDescription, setDowntimeDescription] = useState("");
  
  const { toast } = useToast();

  // Filter orders that can be produced (pending or running)
  const activeOrders = useMemo(() => {
    return orders.filter(order => 
      order.status === 'planejada' || order.status === 'em_andamento'
    ).map(order => {
      // Handle both populated and non-populated machine_id
      let machine_name = 'Máquina não encontrada';
      
      if (typeof order.machine_id === 'object' && order.machine_id !== null) {
        // Machine is populated from API
        machine_name = order.machine_id.name;
      } else if (typeof order.machine_id === 'string') {
        // Machine is not populated, find it in machines array
        const machine = machines.find(m => m._id === order.machine_id);
        machine_name = machine?.name || 'Máquina não encontrada';
      }
      
      const produced = getTotalProduced(order._id);
      
      return {
        ...order,
        machine_name,
        produced
      };
    });
  }, [orders, machines, getTotalProduced]);

  const currentOrder = activeOrders.find(order => order._id === selectedOrder);

  const handleStartProduction = async () => {
    if (!selectedOrder) return;
    
    try {
      await updateOrder(selectedOrder, { status: 'em_andamento' });
      toast({
        title: "Produção iniciada!",
        description: `Ordem ${currentOrder?.code} foi iniciada com sucesso.`,
        variant: "default",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handlePauseProduction = async () => {
    if (!selectedOrder) return;
    
    try {
      await updateOrder(selectedOrder, { status: 'planejada' });
      toast({
        title: "Produção pausada",
        description: `Ordem ${currentOrder?.code} foi pausada.`,
        variant: "default",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleStopProduction = async () => {
    if (!selectedOrder) return;
    
    try {
      await updateOrder(selectedOrder, { status: 'concluida' });
      toast({
        title: "Produção finalizada",
        description: `Ordem ${currentOrder?.code} foi finalizada.`,
        variant: "default",
      });
      setSelectedOrder("");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleAddProduction = async () => {
    if (!quantityInput || !selectedOrder) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma ordem de produção e preencha a quantidade produzida.",
        variant: "destructive",
      });
      return;
    }

    // Validate selectedOrder is a valid MongoDB ObjectId (24 characters hex)
    if (!selectedOrder.match(/^[0-9a-fA-F]{24}$/)) {
      toast({
        title: "Ordem inválida",
        description: "Por favor, selecione uma ordem de produção válida.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate production value: Quantidade Produzida / Und (número de caixas)
      const material = materialsData.find(m => m.Material === currentOrder?.product_name);
      const calculatedQuantity = material && material.Und ? 
        Math.round(parseInt(quantityInput) / material.Und) : 
        parseInt(quantityInput);

      // Prepare record data, excluding null values for optional fields
      const recordData: any = {
        order_id: selectedOrder,
        produced_quantity: calculatedQuantity,
        reject_quantity: 0,
        downtime_minutes: 0,
        recorded_at: new Date().toISOString()
      };

      // Only include operator_id if it's not null
      // Express-validator doesn't accept null for optional fields
      if (selectedOperator) {
        recordData.operator_id = selectedOperator;
      }

      await createRecord(recordData);

      toast({
        title: "Produção registrada!",
        description: `${calculatedQuantity} caixas foram registradas (${quantityInput} unidades ÷ ${material?.Und || 1}).`,
        variant: "default",
      });

      setQuantityInput("");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleAddDowntime = async () => {
    if (!downtimeTypeId || !downtimeStartTime || !downtimeEndTime || !selectedOrder) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios da parada.",
        variant: "destructive",
      });
      return;
    }

    // Validate time range
    const startTime = new Date(downtimeStartTime);
    const endTime = new Date(downtimeEndTime);
    
    // Check if dates are valid
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      toast({
        title: "Horário inválido",
        description: "Por favor, insira horários válidos.",
        variant: "destructive",
      });
      return;
    }
    
    if (endTime <= startTime) {
      toast({
        title: "Horário inválido",
        description: "O horário de fim deve ser posterior ao horário de início.",
        variant: "destructive",
      });
      return;
    }

    // Check if the downtime period is reasonable (not more than 48 hours)
    const downtimeHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (downtimeHours > 48) {
      toast({
        title: "Período muito longo",
        description: "O período de parada não pode ser superior a 48 horas.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createDowntimeRecord({
        order_id: selectedOrder,
        operator_id: null,
        downtime_type_id: downtimeTypeId,
        downtime_start_time: downtimeStartTime,
        downtime_end_time: downtimeEndTime,
        downtime_description: downtimeDescription,
      });

      // Clear form
      setDowntimeTypeId("");
      setDowntimeStartTime("");
      setDowntimeEndTime("");
      setDowntimeDescription("");
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Apontamento de Produção</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Controle e registre a produção em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-muted-foreground">Ao vivo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Production Control */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Seleção de Ordem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ordem de Produção Ativa</Label>
                  <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar ordem..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeOrders.map((order) => (
                        <SelectItem key={order._id} value={order._id}>
                          {order.code} - {order.product_name} ({order.machine_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentOrder && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Produto</p>
                      <p className="font-medium">{currentOrder.product_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Máquina</p>
                      <p className="font-medium">{currentOrder.machine_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantidade Total</p>
                      <p className="font-medium">
                        {(() => {
                          const material = materialsData.find(m => m.Material === currentOrder.product_name);
                          const totalQuantity = material ? currentOrder.planned_quantity * material.Und : currentOrder.planned_quantity;
                          return totalQuantity.toLocaleString();
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Produzido</p>
                      <p className="font-medium text-primary">
                        {getTotalProduced(currentOrder._id).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Production Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Controles de Produção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <Button 
                    onClick={handleStartProduction}
                    className="bg-green-600 hover:bg-green-700 text-white h-12 sm:h-16"
                    disabled={!selectedOrder}
                  >
                    <Play className="h-6 w-6 mr-2" />
                    Iniciar
                  </Button>
                  <Button 
                    onClick={handlePauseProduction}
                    variant="outline"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 h-12 sm:h-16"
                    disabled={!selectedOrder || currentOrder?.status !== 'em_andamento'}
                  >
                    <Pause className="h-6 w-6 mr-2" />
                    Pausar
                  </Button>
                  <Button 
                    onClick={handleStopProduction}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50 h-12 sm:h-16"
                    disabled={!selectedOrder || currentOrder?.status === 'concluida'}
                  >
                    <Square className="h-6 w-6 mr-2" />
                    Finalizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Production Registration */}
            <Card>
              <CardHeader>
                <CardTitle>Registrar Produção</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade Produzida *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Ex: 500"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boxes">Número de Caixas (Calculado)</Label>
                    <div className="p-3 bg-muted rounded-md border">
                      <p className="font-medium text-center">
                        {(() => {
                          if (!quantityInput || !currentOrder) return "0";
                          const material = materialsData.find(m => m.Material === currentOrder.product_name);
                          const calculatedBoxes = material && material.Und ? 
                            Math.round(parseInt(quantityInput) / material.Und) : 
                            parseInt(quantityInput);
                          return calculatedBoxes.toLocaleString();
                        })()}
                      </p>
                      {currentOrder && (() => {
                        const material = materialsData.find(m => m.Material === currentOrder.product_name);
                        return material ? (
                          <p className="text-xs text-muted-foreground text-center mt-1">
                            {quantityInput || 0} ÷ {material.Und}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddProduction}
                  className="w-full bg-primary hover:bg-primary/90 h-12"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Registrar Produção
                </Button>
              </CardContent>
            </Card>

            {/* Downtime Registration */}
       <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StopCircle className="h-5 w-5 text-red-500" />
                  Registrar Parada Indesejada
                </CardTitle>
                {currentOrder && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    <strong>Máquina:</strong> {currentOrder.machine_name} - <strong>Ordem:</strong> {currentOrder.code}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Parada *</Label>
                  <Select value={downtimeTypeId} onValueChange={setDowntimeTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo de parada..." />
                    </SelectTrigger>
                    <SelectContent>
                      {downtimeTypes.map((type) => (
                        <SelectItem key={type._id} value={type._id}>
                          {type.name} ({type.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Hora Início *</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={downtimeStartTime}
                      onChange={(e) => setDowntimeStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora Fim *</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={downtimeEndTime}
                      onChange={(e) => setDowntimeEndTime(e.target.value)}
                      min={downtimeStartTime}
                    />
                  </div>
                </div>

                {downtimeStartTime && downtimeEndTime && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Timer className="h-4 w-4" />
                      <span className="font-medium">Tempo de Parada:</span>
                      <span className="text-red-600">
                        {Math.round((new Date(downtimeEndTime).getTime() - new Date(downtimeStartTime).getTime()) / (1000 * 60))} minutos
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="downtimeDesc">Descrição (opcional)</Label>
                  <Input
                    id="downtimeDesc"
                    placeholder="Detalhes adicionais sobre a parada..."
                    value={downtimeDescription}
                    onChange={(e) => setDowntimeDescription(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleAddDowntime}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
                  disabled={!selectedOrder}
                >
                  <StopCircle className="h-5 w-5 mr-2" />
                  Registrar Parada
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Atual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentOrder ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={
                        currentOrder.status === 'em_andamento' ? 'bg-green-500 animate-pulse' :
            currentOrder.status === 'planejada' ? 'bg-yellow-500' : 'bg-gray-500'
                      }>
                        {currentOrder.status === 'em_andamento' ? 'Rodando' :
          currentOrder.status === 'planejada' ? 'Pendente' : 'Finalizada'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Progresso</span>
                        <span className="text-sm font-medium">
                          {Math.round((currentOrder.produced / currentOrder.planned_quantity) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((currentOrder.produced / currentOrder.planned_quantity) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Restante</span>
                      <span className="text-sm font-medium">
                        {Math.max(0, currentOrder.planned_quantity - currentOrder.produced).toLocaleString()} unidades
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhuma ordem selecionada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ordens Ativas</span>
                    <span className="font-medium">{activeOrders.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ordens em Produção</span>
                    <span className="font-medium text-green-600">
                      {activeOrders.filter(o => o.status === 'em_andamento').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Máquinas Disponíveis</span>
                    <span className="font-medium">{machines.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}