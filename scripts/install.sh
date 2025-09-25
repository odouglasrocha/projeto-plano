#!/bin/bash

# Script de instalação rápida para planing-ita.com
# Execute: curl -sSL https://raw.githubusercontent.com/odouglasrocha/projeto-plano/main/scripts/install.sh | bash

set -e

# Configurações
DOMAIN="planing-ita.com"
VPS_IP="85.209.92.96"
REPO_URL="https://github.com/odouglasrocha/projeto-plano.git"
PROJECT_DIR="/var/www/html/projeto-plano"
EMAIL="admin@planing-ita.com"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }
warning() { echo -e "${YELLOW}[WARNING] $1${NC}"; }

# Verificar root
[[ $EUID -ne 0 ]] && error "Execute como root: sudo bash"

log "🚀 Instalando planing-ita.com no VPS $VPS_IP"

# 1. Atualizar sistema
log "📦 Atualizando sistema..."
apt update -y && apt upgrade -y

# 2. Instalar dependências
log "🔧 Instalando dependências..."
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw

# 3. Instalar Node.js 18
log "📦 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 4. Configurar firewall
log "🔒 Configurando firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 5. Clonar projeto
log "📥 Clonando projeto..."
mkdir -p /var/www/html
rm -rf "$PROJECT_DIR"
git clone "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"

# 6. Instalar dependências e build
log "🏗️ Instalando dependências e fazendo build..."
npm ci
npm run build:prod

# 7. Configurar permissões
log "🔐 Configurando permissões..."
chown -R www-data:www-data "$PROJECT_DIR"
chmod -R 755 "$PROJECT_DIR"

# 8. Configurar Nginx
log "🌐 Configurando Nginx..."
cp nginx.conf "/etc/nginx/sites-available/$DOMAIN"
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 9. Configurar SSL
log "🔐 Configurando SSL..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect

# 10. Configurar renovação SSL
log "🔄 Configurando renovação automática SSL..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# 11. Criar diretórios de backup
mkdir -p /var/backups/projeto-plano

# 12. Tornar deploy.sh executável
chmod +x "$PROJECT_DIR/deploy.sh"
cp "$PROJECT_DIR/deploy.sh" /usr/local/bin/deploy-planing
chmod +x /usr/local/bin/deploy-planing

# 13. Verificar instalação
log "🔍 Verificando instalação..."
sleep 3
if curl -f -s "https://$DOMAIN" > /dev/null; then
    log "✅ Instalação concluída com sucesso!"
    log "🌐 Site: https://$DOMAIN"
    log "💻 Deploy manual: deploy-planing"
else
    warning "⚠️ Verifique se o domínio aponta para $VPS_IP"
fi

log "🎉 Instalação finalizada!"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Configure GitHub Actions secrets:"
echo "   VPS_HOST: $VPS_IP"
echo "   VPS_USERNAME: root"
echo "   VPS_SSH_KEY: [sua chave SSH privada]"
echo "2. Faça push para main para testar deploy automático"
echo "3. Acesse: https://$DOMAIN"