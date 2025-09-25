# Sistema de Produção - Backend API

Backend API para o Sistema de Produção Industrial com MongoDB.

## 🚀 Instalação

1. **Instalar dependências:**
```bash
cd backend
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- `MONGODB_URI`: URL de conexão com MongoDB
- `JWT_SECRET`: Chave secreta para JWT
- `PORT`: Porta do servidor (padrão: 5000)

3. **Iniciar MongoDB:**
Certifique-se de que o MongoDB está rodando na sua máquina.

## 📊 Seed da Base de Dados

Para popular a base de dados com dados iniciais:

```bash
npm run seed
```

### 🔑 Credenciais Padrão

Após executar o seed, você pode fazer login com:
- **Email:** `admin@sistema.com`
- **Senha:** `admin123`

### 📋 Dados Criados pelo Seed

O script de seed cria:
- ✅ 1 usuário administrador
- ✅ 4 operadores de exemplo
- ✅ 5 máquinas de exemplo
- ✅ 6 tipos de parada
- ✅ 5 tipos de perda de material
- ✅ 3 ordens de produção de exemplo

## 🏃‍♂️ Executar o Servidor

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor estará disponível em `http://localhost:5000`

## 📚 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Dados do usuário logado

### Perfis
- `GET /api/profiles` - Listar perfis
- `POST /api/profiles` - Criar perfil
- `PUT /api/profiles/:id` - Atualizar perfil
- `DELETE /api/profiles/:id` - Deletar perfil

### Máquinas
- `GET /api/machines` - Listar máquinas
- `POST /api/machines` - Criar máquina
- `PUT /api/machines/:id` - Atualizar máquina
- `DELETE /api/machines/:id` - Deletar máquina

### Operadores
- `GET /api/operators` - Listar operadores
- `POST /api/operators` - Criar operador
- `PUT /api/operators/:id` - Atualizar operador
- `DELETE /api/operators/:id` - Deletar operador

### Ordens de Produção
- `GET /api/production-orders` - Listar ordens
- `POST /api/production-orders` - Criar ordem
- `PUT /api/production-orders/:id` - Atualizar ordem
- `DELETE /api/production-orders/:id` - Deletar ordem

### Registros de Produção
- `GET /api/production-records` - Listar registros
- `POST /api/production-records` - Criar registro
- `PUT /api/production-records/:id` - Atualizar registro
- `DELETE /api/production-records/:id` - Deletar registro

### Tipos de Parada
- `GET /api/downtime-types` - Listar tipos
- `POST /api/downtime-types` - Criar tipo
- `PUT /api/downtime-types/:id` - Atualizar tipo
- `DELETE /api/downtime-types/:id` - Deletar tipo

### Tipos de Perda
- `GET /api/loss-types` - Listar tipos
- `POST /api/loss-types` - Criar tipo
- `PUT /api/loss-types/:id` - Atualizar tipo
- `DELETE /api/loss-types/:id` - Deletar tipo

### Perdas de Material
- `GET /api/material-losses` - Listar perdas
- `POST /api/material-losses` - Criar perda
- `PUT /api/material-losses/:id` - Atualizar perda
- `DELETE /api/material-losses/:id` - Deletar perda

### Relatórios
- `GET /api/reports` - Listar relatórios
- `POST /api/reports` - Gerar relatório
- `PUT /api/reports/:id` - Atualizar relatório
- `DELETE /api/reports/:id` - Deletar relatório

## 🔒 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer <seu-jwt-token>
```

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Helmet** - Segurança HTTP
- **CORS** - Cross-Origin Resource Sharing