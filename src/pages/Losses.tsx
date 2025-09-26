import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMaterialLosses } from "@/hooks/useMaterialLosses";
import { useMachines } from "@/hooks/useMachines";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import { useOperators } from "@/hooks/useOperators";
import { 
  AlertTriangle, 
  Plus, 
  Clock,
  TrendingUp,
  Target
} from "lucide-react";
import { useState, useEffect } from "react";
import { safeNumberFromMongo } from "@/lib/utils";

export default function Losses() {
  const [formData, setFormData] = useState({
    machine_id: "",
    loss_type_id: "",
    amount: "",
    reason: "",
    order_id: ""
  });

  const { losses, lossTypes, recentLosses, loading, createLoss, getTotalLosses, getLossTypeTotal, fetchRecentLosses } = useMaterialLosses();
  const { machines } = useMachines();
  const { orders } = useProductionOrders();
  const { operators } = useOperators();

  useEffect(() => {
    console.log('🔍 Losses.tsx - useEffect executado');
    fetchRecentLosses(24, 10); // Carregar perdas das últimas 24 horas
  }, [fetchRecentLosses]);

  useEffect(() => {
    console.log('📊 Losses.tsx - recentLosses mudou:', recentLosses);
    console.log('🏭 Losses.tsx - machines:', machines);
    console.log('📋 Losses.tsx - lossTypes:', lossTypes);
  }, [recentLosses, machines, lossTypes]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.machine_id || !formData.loss_type_id || !formData.amount || !formData.reason) {
      return;
    }

    try {
      await createLoss({
        machine_id: formData.machine_id,
        loss_type_id: formData.loss_type_id,
        amount: parseFloat(formData.amount),
        reason: formData.reason,
        order_id: formData.order_id || null,
      });

      // Reset form
      setFormData({
        machine_id: "",
        loss_type_id: "",
        amount: "",
        reason: "",
        order_id: ""
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Carregando...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Registro de Perdas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitore e registre perdas de material em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4 text-losses" />
            <span className="text-muted-foreground">
              Total hoje: <span className="font-bold text-losses">{Number(getTotalLosses()).toFixed(1)} kg</span>
            </span>
          </div>
        </div>

        {/* Loss Type Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {lossTypes.map((type) => (
            <Card key={type._id} className="text-center">
              <CardContent className="p-4">
                <div className={`w-12 h-12 ${type.color} rounded-full flex items-center justify-center text-white text-xl mx-auto mb-2`}>
                  {type.icon}
                </div>
                <h3 className="font-medium text-sm">{type.name}</h3>
                <p className="text-2xl font-bold text-foreground">
                  {Number(getLossTypeTotal(type._id)).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">kg hoje</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Loss Registration Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Registrar Nova Perda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="machine">Máquina *</Label>
                    <Select value={formData.machine_id} onValueChange={(value) => handleInputChange("machine_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar máquina" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines.map((machine) => (
                          <SelectItem key={machine._id} value={machine._id}>
                            {machine.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Perda *</Label>
                    <Select value={formData.loss_type_id} onValueChange={(value) => handleInputChange("loss_type_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {lossTypes.map((type) => (
                          <SelectItem key={type._id} value={type._id}>
                            <div className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              {type.name} ({type.unit})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Quantidade *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.1"
                      placeholder={`Ex: 12.5 ${lossTypes.find(t => t._id === formData.loss_type_id)?.unit || ''}`}
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order">Ordem de Produção</Label>
                    <Select value={formData.order_id} onValueChange={(value) => handleInputChange("order_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar ordem" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((order) => (
                          <SelectItem key={order._id} value={order._id}>
                            {order.code} - {order.product_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo/Causa *</Label>
                    <Textarea
                      id="reason"
                      placeholder="Descreva o motivo da perda..."
                      value={formData.reason}
                      onChange={(e) => handleInputChange("reason", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-losses hover:bg-losses/90">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Registrar Perda
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent Losses */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Perdas Recentes (24h)
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-losses border-losses">
                      {recentLosses?.summary.total_count || 0} registros
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fetchRecentLosses(24, 10)}
                      className="text-xs"
                    >
                      Atualizar
                    </Button>
                  </div>
                </div>
                {recentLosses?.summary && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Total: <strong className="text-losses">{Number(recentLosses.summary.total_amount).toFixed(1)} kg</strong></span>
                    <span>Média: <strong>{Number(recentLosses.summary.avg_amount).toFixed(1)} kg</strong></span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLosses?.losses && recentLosses.losses.length > 0 ? (
                    recentLosses.losses.map((loss) => {
                      // Usar os dados já populados pela API
                      const lossType = loss.loss_type_id;
                      const machine = loss.machine_id;
                      const order = loss.order_id; // Usar o objeto já populado
                      
                      return (
                        <div key={loss._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 ${lossType?.color || 'bg-gray-500'} rounded-full flex items-center justify-center text-white text-sm`}>
                                {lossType?.icon || '?'}
                              </div>
                              <div>
                                <h4 className="font-medium">{machine?.name || 'Máquina não identificada'}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {lossType?.name || 'Tipo não identificado'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-losses">
                                {safeNumberFromMongo(loss.amount).toFixed(1)} {lossType?.unit || 'kg'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(() => {
                                  try {
                                    const date = new Date(loss.recorded_at);
                                    return isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleString('pt-BR', { 
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    });
                                  } catch {
                                    return 'Data inválida';
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">{loss.reason}</p>
                            {order && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Ordem: {order.code} - {order.product_name}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma perda registrada nas últimas 24 horas</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-losses">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Perda Total Hoje</p>
                  <p className="text-2xl font-bold text-losses">{getTotalLosses().toFixed(1)} kg</p>
                </div>
                <TrendingUp className="h-8 w-8 text-losses" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Meta Diária</p>
                  <p className="text-2xl font-bold text-yellow-600">50.0 kg</p>
                </div>
                <Target className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Performance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {getTotalLosses() <= 50 ? "✓ Dentro" : "⚠ Acima"}
                  </p>
                </div>
                <div className="text-2xl">
                  {getTotalLosses() <= 50 ? "✅" : "⚠️"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}