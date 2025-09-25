import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Shield,
  User,
  Settings
} from "lucide-react";
import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";

export default function Users() {
  const { 
    users, 
    roles, 
    loading, 
    createUser, 
    deleteUser, 
    getRoleInfo, 
    getRoleStats, 
    getUserInitials
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    full_name: "",
    email: "",
    role: "",
    sector: "",
    shift: ""
  });
  const { toast } = useToast();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status?: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const handleCreateUser = async () => {
    if (!newUserData.full_name || !newUserData.email || !newUserData.role) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createUser(newUserData);
      setNewUserOpen(false);
      setNewUserData({ full_name: "", email: "", role: "", sector: "", shift: "" });
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário ${userName}?`)) {
      try {
        await deleteUser(userId);
      } catch (error) {
        // Error is already handled in the hook
      }
    }
  };

  const roleStats = getRoleStats();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <UsersIcon className="h-8 w-8 text-primary" />
              Gerenciamento de Usuários
            </h1>
            <p className="text-muted-foreground">
              Gerencie usuários, funções e permissões do sistema
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Criar Novo Usuário
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os dados abaixo para criar um novo usuário no sistema.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome Completo *</Label>
                      <Input
                        id="full_name"
                        value={newUserData.full_name}
                        onChange={(e) => setNewUserData({...newUserData, full_name: e.target.value})}
                        placeholder="Digite o nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                        placeholder="Digite o email"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Função *</Label>
                      <Select value={newUserData.role} onValueChange={(value) => setNewUserData({...newUserData, role: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sector">Setor</Label>
                      <Select value={newUserData.sector} onValueChange={(value) => setNewUserData({...newUserData, sector: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="producao">Produção</SelectItem>
                          <SelectItem value="qualidade">Qualidade</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="logistica">Logística</SelectItem>
                          <SelectItem value="administrativo">Administrativo</SelectItem>
                          <SelectItem value="engenharia">Engenharia</SelectItem>
                          <SelectItem value="rh">Recursos Humanos</SelectItem>
                          <SelectItem value="financeiro">Financeiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shift">Turno</Label>
                      <Select value={newUserData.shift} onValueChange={(value) => setNewUserData({...newUserData, shift: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o turno" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manha">Manhã (06:00 - 14:00)</SelectItem>
                          <SelectItem value="tarde">Tarde (14:00 - 22:00)</SelectItem>
                          <SelectItem value="noite">Noite (22:00 - 06:00)</SelectItem>
                          <SelectItem value="administrativo">Administrativo (08:00 - 17:00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setNewUserOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateUser}>
                      Criar Usuário
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Role Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {roleStats.map((role) => (
            <Card key={role.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{role.name}</p>
                    <p className="text-2xl font-bold">{role.count}</p>
                  </div>
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as funções</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getUserInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{user.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {roleInfo && (
                            <Badge variant="secondary">{roleInfo.name}</Badge>
                          )}
                          {user.sector && (
                            <Badge variant="outline">{user.sector}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {user.email === 'admin@oee.com' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Protegido
                        </Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={user.email === 'admin@oee.com'}
                        className={user.email === 'admin@oee.com' ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        className={`text-destructive hover:text-destructive ${
                          user.email === 'admin@oee.com' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={user.email === 'admin@oee.com'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Roles and Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Funções e Permissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div key={role.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{role.name}</h3>
                    <Badge variant="outline">{role.level}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                  <ul className="space-y-1">
                    {role.permissions.map((permission, index) => (
                      <li key={`${role.id}-permission-${index}`} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}