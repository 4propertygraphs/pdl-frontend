# Deployment Guide

Tento projekt se skládá ze dvou částí:
1. **Frontend** - React aplikace (složka `/`)
2. **Proxy Server** - Node.js server (složka `/proxy-server`)

## Přehled architektury

```
[Browser] -> [Frontend App] -> [Proxy Server] -> [gate.decodo.com proxy] -> [api.stefanmars.nl]
                              |
                              -> [Supabase Database]
```

## 1. Deployment Proxy Serveru

Proxy server MUSÍ běžet na vašem serveru, protože používá `https-proxy-agent` který nefunguje v browseru.

### Možnost A: PM2 (doporučeno pro produkci)

```bash
cd proxy-server
npm install
npm install -g pm2

# Nakonfigurujte .env
cp .env.example .env
nano .env

# Spusťte server
pm2 start server.js --name api-proxy
pm2 save
pm2 startup
```

### Možnost B: systemd service

```bash
cd proxy-server
npm install

# Vytvořte systemd service
sudo nano /etc/systemd/system/api-proxy.service
```

Vložte:
```ini
[Unit]
Description=API Proxy Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/cesta/k/proxy-server
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment="PORT=3001"
Environment="API_BASE_URL=https://api.stefanmars.nl"
Environment="PROXY_URL=http://splnv0r8uf:fVpo8l~6phsiX6Vg2A@gate.decodo.com:7000"

[Install]
WantedBy=multi-user.target
```

Spusťte:
```bash
sudo systemctl enable api-proxy
sudo systemctl start api-proxy
sudo systemctl status api-proxy
```

### Možnost C: Docker

```bash
cd proxy-server
docker build -t api-proxy .
docker run -d -p 3001:3001 --env-file .env --name api-proxy api-proxy
```

### Konfigurace Proxy Serveru

V souboru `proxy-server/.env`:

```env
PORT=3001
API_BASE_URL=https://api.stefanmars.nl
PROXY_URL=http://splnv0r8uf:fVpo8l~6phsiX6Vg2A@gate.decodo.com:7000
```

**DŮLEŽITÉ:** Pokud proxy server běží na jiném portu nebo URL, musíte upravit frontend konfiguraci.

## 2. Deployment Frontendu

### Krok 1: Build aplikace

```bash
npm install
npm run build
```

Tímto se vytvoří složka `dist/` s produkční verzí aplikace.

### Krok 2: Nakonfigurujte environment proměnné

Vytvořte `.env` pro produkci:

```env
VITE_SUPABASE_URL=https://vase-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=vase-supabase-anon-key
VITE_PROXY_URL=https://vase-domena.com/api
```

**KLÍČOVÉ:** `VITE_PROXY_URL` MUSÍ ukazovat na vaší proxy server!

Příklady:
- Pokud je proxy na stejném serveru: `https://vase-domena.com:3001/api`
- Pokud je proxy na subdoméně: `https://api.vase-domena.com/api`
- Pro vývoj: `http://localhost:3001/api`

### Krok 3: Nahrání na server

#### Možnost A: Apache/nginx hosting

```bash
# Build s produkcními env proměnnými
npm run build

# Nahrát obsah složky dist/ na server
rsync -avz dist/ user@server:/var/www/html/
```

#### Nginx konfigurace (doporučeno):

```nginx
server {
    listen 80;
    server_name vase-domena.com;

    root /var/www/html;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy server
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Apache konfigurace (.htaccess):

```apache
# Frontend routing
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Proxy
ProxyPass /api http://localhost:3001/api
ProxyPassReverse /api http://localhost:3001/api
```

## 3. Testování

### Test proxy serveru:

```bash
curl http://localhost:3001/health
```

Měli byste dostat:
```json
{
  "status": "ok",
  "proxy": "enabled",
  "apiBase": "https://api.stefanmars.nl"
}
```

### Test API přes proxy:

```bash
curl -H "token: your-token-here" http://localhost:3001/api/agencies
```

### Test frontendu:

1. Otevřete aplikaci v prohlížeči
2. Zkuste se přihlásit
3. Zkontrolujte Network tab v DevTools - requesty by měly jít na vaši proxy URL

## 4. Troubleshooting

### Problém: CORS chyby

**Řešení:** Zkontrolujte že proxy server běží a `VITE_PROXY_URL` je správně nastavená.

### Problém: 502 Bad Gateway

**Řešení:** Proxy server neběží nebo není dostupný. Zkontrolujte:
```bash
pm2 status
# nebo
sudo systemctl status api-proxy
```

### Problém: Network Error v browseru

**Řešení:**
1. Zkontrolujte že proxy server běží
2. Zkontrolujte že `VITE_PROXY_URL` v `.env` odpovídá skutečné URL
3. Rebuild frontend: `npm run build`

### Problém: Proxy timeout

**Řešení:** Zkontrolujte že `gate.decodo.com:7000` je dostupné z vašeho serveru:
```bash
curl -x http://splnv0r8uf:fVpo8l~6phsiX6Vg2A@gate.decodo.com:7000 https://ip.decodo.com/json
```

## 5. Bezpečnost

1. **NIKDY** necommitujte `.env` soubory do git
2. Proxy credentials by měly být v `.env`, ne v kódu
3. Používejte HTTPS pro produkci
4. Zvažte přidání rate limitingu do proxy serveru

## 6. Monitoring

### Logy proxy serveru:

PM2:
```bash
pm2 logs api-proxy
```

systemd:
```bash
sudo journalctl -u api-proxy -f
```

Docker:
```bash
docker logs -f api-proxy
```

## Shrnutí kroků pro deployment:

1. ✅ Nainstalujte proxy server na váš server
2. ✅ Nakonfigurujte `.env` pro proxy server
3. ✅ Spusťte proxy server (PM2/systemd/Docker)
4. ✅ Nakonfigurujte frontend `.env` s URL proxy serveru
5. ✅ Build frontend: `npm run build`
6. ✅ Nahrať `dist/` na webhosting
7. ✅ Nakonfigurujte nginx/Apache pro routing
8. ✅ Testujte!
