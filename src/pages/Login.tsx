import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Factory, Shield, Eye, Wrench, User, Lock } from "lucide-react";

// Demo users with different access levels
const demoUsers = [
  {
    role: 'admin',
    email: 'admin@sistema.com',
    password: 'admin123',
    name: 'João Silva',
    title: 'Administrador',
    icon: Shield,
    color: 'bg-red-500',
    permissions: ['Gerenciar usuários', 'Configurar sistema', 'Relatórios avançados', 'Todas as funcionalidades']
  },
  {
    role: 'supervisor',
    email: 'supervisor@oee.com', 
    password: 'supervisor123',
    name: 'Maria Santos',
    title: 'Supervisora',
    icon: Eye,
    color: 'bg-blue-500',
    permissions: ['Monitorar produção', 'Aprovar ordens', 'Relatórios operacionais', 'Gerenciar operadores']
  },
  {
    role: 'operador',
    email: 'operador@oee.com',
    password: 'operador123', 
    name: 'Pedro Costa',
    title: 'Operador',
    icon: Wrench,
    color: 'bg-green-500',
    permissions: ['Registrar produção', 'Visualizar dashboard', 'Reportar perdas', 'Controlar máquinas']
  }
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      // Error handling is done in the signIn function
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoUser: typeof demoUsers[0]) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    
    setLoading(true);
    try {
      await signIn(demoUser.email, demoUser.password);
      navigate('/');
    } catch (error: any) {
      console.error('Demo login error:', error);
      // Error handling is done in the signIn function
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto lg:mx-0 lg:max-w-none">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Factory className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-primary">Sistema OEE</h1>
            </div>
            <CardTitle className="text-lg sm:text-xl">Acesso ao Sistema</CardTitle>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o sistema
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Users Panel */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center xl:text-left">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Níveis de Acesso</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Clique em um dos usuários demo para fazer login automaticamente
            </p>
          </div>

          <div className="grid gap-4">
            {demoUsers.map((user, index) => {
              const IconComponent = user.icon;
              return (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
                  style={{ borderLeftColor: user.color.replace('bg-', '#') }}
                  onClick={() => handleDemoLogin(user)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${user.color} text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{user.name}</h3>
                            <Badge variant="secondary" className="mt-1">
                              {user.title}
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            Login Demo
                          </Button>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Permissões:</p>
                          <div className="grid grid-cols-2 gap-1">
                            {user.permissions.map((permission, permIndex) => (
                              <div key={permIndex} className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                                <span className="text-xs text-muted-foreground">{permission}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>📧 {user.email}</span>
                            <span>🔑 {user.password}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">💡 Como usar:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Clique em qualquer card de usuário para login automático</li>
              <li>• Ou digite manualmente as credenciais no formulário</li>
              <li>• Cada nível tem acesso a funcionalidades específicas</li>
              <li>• O sistema adapta a interface conforme o nível do usuário</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}