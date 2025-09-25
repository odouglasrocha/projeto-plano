import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMachines } from "@/hooks/useMachines";
import { Plus, Factory } from "lucide-react";

interface NewMachineModalProps {
  children?: React.ReactNode;
  onMachineCreated?: () => void;
}

export function NewMachineModal({ children, onMachineCreated }: NewMachineModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    model: "",
    location: "",
    status: "stopped" as const
  });
  const { toast } = useToast();
  const { createMachine } = useMachines();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast({
        title: "Erro",
        description: "Nome e código da máquina são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMachine({
        name: formData.name,
        code: formData.code,
        model: formData.model || null,
        location: formData.location || null,
        status: formData.status
      });

      // Reset form
      setFormData({
        name: "",
        code: "",
        model: "",
        location: "",
        status: "stopped"
      });
      setOpen(false);
      
      // Chama o callback se fornecido
      if (onMachineCreated) {
        onMachineCreated();
      }
    } catch (error) {
      console.error("Erro ao cadastrar máquina:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nova Máquina
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            Cadastrar Nova Máquina
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar uma nova máquina no sistema
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Máquina *</Label>
              <Input
                id="name"
                placeholder="Ex: Linha 01"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                placeholder="Ex: M001"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                placeholder="Ex: Model A"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                placeholder="Ex: Setor 1"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Inicial</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stopped">Parada</SelectItem>
                <SelectItem value="running">Executando</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="idle">Ociosa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Cadastrar Máquina
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}