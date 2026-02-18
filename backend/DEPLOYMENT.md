# Guía de Deployment - Vora Backend

## Opciones de Deployment

1. Railway (Recomendado)
2. Docker
3. Render
4. Fly.io
5. AWS/GCP/Azure

## 1. Railway (Recomendado)

### Pre-requisitos

- Cuenta en Railway.app
- Railway CLI instalado (opcional)

### Deployment Automático

El proyecto incluye `railway.json` configurado:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Deploy
railway up
```

### Variables de Entorno en Railway

Configura en Railway Dashboard:

```env
ENVIRONMENT=production
DEBUG=false
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_MAPS_API_KEY=AIza...
SUPABASE_URL=https://...
SUPABASE_KEY=eyJ...
SECRET_KEY=your-production-secret
ALLOWED_ORIGINS=["https://your-frontend.com"]
```

### Configuración de Railway

1. Conecta tu repositorio GitHub
2. Railway detecta automáticamente Python
3. Configura variables de entorno
4. Deploy automático en cada push

## 2. Docker

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando de inicio
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env.local
    environment:
      - ENVIRONMENT=production
    restart: unless-stopped
```

### Comandos Docker

```bash
# Build
docker build -t vora-backend .

# Run
docker run -p 8000:8000 --env-file .env.local vora-backend

# Con Docker Compose
docker-compose up -d
```

## 3. Render

### render.yaml

```yaml
services:
  - type: web
    name: vora-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: OPENAI_API_KEY
        sync: false
      - key: GOOGLE_PLACES_API_KEY
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_KEY
        sync: false
```

### Deployment en Render

1. Conecta repositorio en Render.com
2. Selecciona "Web Service"
3. Configura variables de entorno
4. Deploy automático

## 4. Fly.io

### fly.toml

```toml
app = "vora-backend"
primary_region = "mia"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8000"
  ENVIRONMENT = "production"

[[services]]
  http_checks = []
  internal_port = 8000
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

### Comandos Fly.io

```bash
# Instalar Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Inicializar
fly launch

# Deploy
fly deploy

# Configurar secrets
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set GOOGLE_PLACES_API_KEY=AIza...
```

## 5. AWS (EC2 + Nginx)

### Setup en EC2

```bash
# Conectar a EC2
ssh -i key.pem ubuntu@ec2-instance

# Instalar Python y dependencias
sudo apt update
sudo apt install python3.11 python3-pip nginx

# Clonar repositorio
git clone https://github.com/your-repo/vora.git
cd vora/backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar .env.local
nano .env.local
```

### Systemd Service

```ini
# /etc/systemd/system/vora-backend.service
[Unit]
Description=Vora Backend API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/vora/backend
Environment="PATH=/home/ubuntu/vora/backend/venv/bin"
ExecStart=/home/ubuntu/vora/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### Nginx Config

```nginx
# /etc/nginx/sites-available/vora-backend
server {
    listen 80;
    server_name api.vora.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Comandos

```bash
# Habilitar servicio
sudo systemctl enable vora-backend
sudo systemctl start vora-backend

# Habilitar Nginx
sudo ln -s /etc/nginx/sites-available/vora-backend /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# SSL con Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.vora.com
```

## Configuración de Producción

### Variables de Entorno

```env
# Producción
ENVIRONMENT=production
DEBUG=false

# Security
SECRET_KEY=<generate-strong-key>
ALLOWED_ORIGINS=["https://vora.com","https://www.vora.com"]

# Rate Limiting
RATE_LIMIT_PER_MINUTE=30

# APIs
OPENAI_API_KEY=sk-...
GOOGLE_PLACES_API_KEY=AIza...
SUPABASE_URL=https://...
SUPABASE_KEY=eyJ...
```

### Generar SECRET_KEY

```python
import secrets
print(secrets.token_urlsafe(32))
```

## Monitoreo y Logs

### Railway

```bash
railway logs
```

### Docker

```bash
docker logs -f container-name
```

### Systemd

```bash
sudo journalctl -u vora-backend -f
```

## Health Checks

### Endpoint

```bash
curl https://api.vora.com/health
```

### Respuesta Esperada

```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

## Backup y Recuperación

### Base de Datos (Supabase)

- Backups automáticos en Supabase
- Exportar manualmente desde Dashboard

### Código

- Git como fuente de verdad
- Tags para releases: `git tag v1.0.0`

## Escalabilidad

### Horizontal Scaling

- Railway: Auto-scaling disponible
- Docker: Usar Kubernetes o Docker Swarm
- AWS: Auto Scaling Groups

### Vertical Scaling

- Aumentar recursos de instancia
- Optimizar queries de base de datos
- Implementar caché (Redis)

## Seguridad

### Checklist

- [ ] HTTPS habilitado
- [ ] Secrets en variables de entorno
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente
- [ ] Firewall configurado
- [ ] Logs de seguridad habilitados
- [ ] Actualizaciones de seguridad automáticas

### Hardening

```bash
# Firewall (UFW)
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Troubleshooting

### Error: Port already in use

```bash
# Encontrar proceso
lsof -i :8000

# Matar proceso
kill -9 <PID>
```

### Error: Permission denied

```bash
# Dar permisos
chmod +x script.sh

# Cambiar owner
sudo chown -R user:user /path
```

### Error: Out of memory

- Aumentar recursos de instancia
- Optimizar código
- Implementar caché

## Rollback

### Railway

```bash
railway rollback
```

### Docker

```bash
docker pull vora-backend:previous-tag
docker-compose up -d
```

### Git

```bash
git revert HEAD
git push
```

## Contacto y Soporte

- Documentación: `/docs`
- Health Check: `/health`
- Logs: Según plataforma

## Checklist de Deployment

- [ ] Variables de entorno configuradas
- [ ] Secrets seguros
- [ ] HTTPS habilitado
- [ ] Health check funcionando
- [ ] Logs configurados
- [ ] Monitoreo activo
- [ ] Backup configurado
- [ ] Rollback plan definido
- [ ] Documentación actualizada
