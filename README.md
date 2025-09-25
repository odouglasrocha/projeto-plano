# Sistema de Planejamento Industrial

Sistema completo de planejamento e controle de produção industrial desenvolvido com React, TypeScript e Supabase.

## 🚀 Funcionalidades

- **Dashboard Executivo**: Visão geral da produção com KPIs e métricas
- **Planejamento de Produção**: Criação e gestão de ordens de produção
- **Controle de Máquinas**: Monitoramento de equipamentos e disponibilidade
- **Gestão de Perdas**: Registro e análise de perdas de material
- **Relatórios**: Análises detalhadas de produtividade e eficiência
- **Gestão de Usuários**: Controle de acesso e permissões

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **UI/UX**: Tailwind CSS, Shadcn/ui, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deploy**: Nginx, SSL/HTTPS, VPS

## 📦 Instalação Local

```bash
# Clone o repositório
git clone <repository-url>
cd sistema-plano

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o arquivo .env.local com suas credenciais do Supabase

# Execute em modo desenvolvimento
npm run dev
```

## 🏗️ Build e Deploy

### Build Local
```bash
# Build de desenvolvimento
npm run build:dev

# Build de produção
npm run build:prod
```

### Deploy no VPS
```bash
# Deploy automático
npm run deploy

# Ou usando Docker
npm run docker:build
npm run docker:run
```

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente
Crie um arquivo `.env.local` com:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Banco de Dados
O sistema utiliza Supabase como backend. Execute as migrações:

```bash
# Se usando Supabase CLI
supabase db reset
```

## 📊 Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
├── pages/              # Páginas da aplicação
├── hooks/              # Custom hooks
├── integrations/       # Integrações (Supabase)
├── lib/                # Utilitários e configurações
└── assets/             # Recursos estáticos
```

## 🚀 Deploy em Produção

### VPS com Nginx
O sistema inclui scripts automatizados para deploy:

1. **Setup inicial do VPS**:
```bash
curl -sSL https://raw.githubusercontent.com/seu-usuario/sistema-plano/main/setup-vps.sh | bash
```

2. **Deploy de atualizações**:
```bash
ssh root@seu-vps "cd /var/www/html/sistema-plano && ./deploy.sh"
```

### GitHub Actions (CI/CD)
Configure os secrets no GitHub:
- `VPS_HOST`: IP do seu VPS
- `VPS_USERNAME`: usuário SSH
- `VPS_SSH_KEY`: chave SSH privada

## 📝 Licença

Este projeto está sob a licença MIT.
