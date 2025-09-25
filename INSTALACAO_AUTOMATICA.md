# 🚀 Instalação Automática - planing-ita.com

Este documento contém as instruções para configurar automaticamente o deploy da aplicação no VPS com o domínio `https://planing-ita.com`.

## 📋 Informações do Servidor

- **Domínio**: `https://planing-ita.com/`
- **Repositório**: `git@github.com:odouglasrocha/projeto-plano.git`
- **VPS**: `ssh root@85.209.92.96`

## 🎯 Instalação Automática (Recomendado)

### Opção 1: Script de Instalação Completa

Execute este comando no VPS para configurar tudo automaticamente:

```bash
# Conectar ao VPS
ssh root@85.209.92.96

# Executar script de instalação automática
curl -sSL https://raw.githubusercontent.com/odouglasrocha/projeto-plano/main/setup-vps.sh | bash
```

### Opção 2: Instalação Manual Passo a Passo

Se preferir fazer a instalação manual, siga os passos abaixo:

#### 1. Preparação do Servidor

```bash
# Conectar ao VPS
ssh root@85.209.92.96

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências básicas
apt install -y curl wget git unzip software-properties-common

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Instalar Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Instalar Certbot para SSL
apt install -y certbot python3-certbot-nginx
```

#### 2. Configurar Chave SSH para GitHub

```bash
# Gerar chave SSH
ssh-keygen -t rsa -b 4096 -C "admin@planing-ita.com" -f /root/.ssh/id_rsa -N ""

# Mostrar chave pública
cat /root/.ssh/id_rsa.pub

# Adicionar GitHub aos known_hosts
ssh-keyscan -H github.com >> /root/.ssh/known_hosts
```

**IMPORTANTE**: Copie a chave pública e adicione às Deploy Keys do repositório:
- Acesse: GitHub → Repositório → Settings → Deploy keys → Add deploy key
- Cole a chave pública
- Marque "Allow write access" se necessário

#### 3. Clonar e Configurar Projeto

```bash
# Criar diretórios
mkdir -p /var/www/html
mkdir -p /var/backups/projeto-plano

# Clonar repositório
cd /var/www/html
git clone git@github.com:odouglasrocha/projeto-plano.git projeto-plano
cd projeto-plano

# Instalar dependências
npm ci --production=false

# Fazer build
npm run build:prod

# Configurar permissões
chown -R www-data:www-data /var/www/html/projeto-plano
chmod -R 755 /var/www/html/projeto-plano
```

#### 4. Configurar Nginx

```bash
# Copiar configuração
cp nginx.conf /etc/nginx/sites-available/planing-ita.com
ln -sf /etc/nginx/sites-available/planing-ita.com /etc/nginx/sites-enabled/planing-ita.com

# Remover configuração padrão
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Recarregar nginx
systemctl reload nginx
```

#### 5. Configurar SSL

```bash
# Obter certificado SSL
certbot --nginx -d planing-ita.com -d www.planing-ita.com --non-interactive --agree-tos --email admin@planing-ita.com --redirect

# Configurar renovação automática
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
```

## 🔄 Deploy Automático com GitHub Actions

### Configurar Secrets no GitHub

Acesse: GitHub → Repositório → Settings → Secrets and variables → Actions

Adicione os seguintes secrets:

```
VPS_HOST: 85.209.92.96
VPS_USERNAME: root
VPS_SSH_KEY: [conteúdo da chave privada SSH do VPS]
```

Para obter a chave privada SSH:

```bash
# No VPS, execute:
cat /root/.ssh/id_rsa
```

### Como Funciona o Deploy Automático

1. **Trigger**: Push para a branch `main` ou execução manual
2. **Build**: Aplicação é buildada no GitHub Actions
3. **Deploy**: Código é enviado para o VPS via SSH
4. **Atualização**: Nginx é recarregado automaticamente

### Deploy Manual

Para fazer deploy manual no VPS:

```bash
# Executar script de deploy
cd /var/www/html/projeto-plano
./deploy.sh

# Ou usar o comando global (após instalação automática)
deploy-planing
```

## 🔍 Verificação e Monitoramento

### Verificar Status dos Serviços

```bash
# Status do Nginx
systemctl status nginx

# Status do SSL
certbot certificates

# Logs do Nginx
tail -f /var/log/nginx/planing-ita.com.access.log
tail -f /var/log/nginx/planing-ita.com.error.log

# Testar site
curl -I https://planing-ita.com
```

### Estrutura de Arquivos no VPS

```
/var/www/html/projeto-plano/          # Código da aplicação
├── dist/                             # Build de produção
├── nginx.conf                        # Configuração do Nginx
├── deploy.sh                         # Script de deploy
└── ...

/etc/nginx/sites-available/           # Configurações do Nginx
├── planing-ita.com                   # Configuração do site

/var/backups/projeto-plano/           # Backups automáticos
├── backup_20240124_120000.tar.gz
└── ...

/var/log/nginx/                       # Logs do Nginx
├── planing-ita.com.access.log
├── planing-ita.com.error.log
└── ...
```

## 🛠️ Comandos Úteis

### Deploy e Manutenção

```bash
# Deploy manual
deploy-planing

# Verificar logs em tempo real
tail -f /var/log/nginx/planing-ita.com.error.log

# Recarregar Nginx
systemctl reload nginx

# Renovar SSL manualmente
certbot renew

# Verificar espaço em disco
df -h

# Limpar backups antigos
find /var/backups/projeto-plano -name "backup_*.tar.gz" -mtime +30 -delete
```

### Troubleshooting

```bash
# Verificar configuração do Nginx
nginx -t

# Verificar portas em uso
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Verificar DNS
nslookup planing-ita.com
dig planing-ita.com

# Testar conectividade
curl -I https://planing-ita.com
```

## 🔒 Segurança

### Configurações de Segurança Implementadas

- ✅ SSL/TLS com Let's Encrypt
- ✅ Redirecionamento HTTP → HTTPS
- ✅ Headers de segurança (HSTS, CSP, etc.)
- ✅ Firewall configurado (UFW)
- ✅ Usuário não-root para aplicação
- ✅ Permissões adequadas nos arquivos

### Backup Automático

- Backups são criados automaticamente a cada deploy
- Mantém os últimos 5 backups
- Localização: `/var/backups/projeto-plano/`

## 📞 Suporte

### Logs Importantes

```bash
# Logs da aplicação
tail -f /var/log/nginx/planing-ita.com.access.log
tail -f /var/log/nginx/planing-ita.com.error.log

# Logs do sistema
journalctl -u nginx -f
journalctl -u certbot -f
```

### Contatos

- **Domínio**: https://planing-ita.com
- **Repositório**: https://github.com/odouglasrocha/projeto-plano
- **Email**: admin@planing-ita.com

---

## 🎉 Conclusão

Após seguir este guia, você terá:

- ✅ VPS completamente configurado
- ✅ Deploy automático via GitHub Actions
- ✅ SSL/HTTPS configurado
- ✅ Backups automáticos
- ✅ Monitoramento e logs
- ✅ Site disponível em https://planing-ita.com

Para qualquer problema, verifique os logs e execute os comandos de troubleshooting listados acima.