# API Proxy Server

CORS proxy server that forwards requests to external API through HTTPS proxy.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Start server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `API_BASE_URL` - External API base URL
- `PROXY_URL` - HTTPS proxy URL with credentials

## Usage

The proxy server accepts requests at `/api/*` and forwards them to the external API.

Example:
- Request: `http://localhost:3001/api/agencies`
- Forwards to: `https://api.stefanmars.nl/agencies`

Health check:
- `http://localhost:3001/health`

## Deployment

### Option 1: PM2 (recommended for production)

```bash
npm install -g pm2
pm2 start server.js --name api-proxy
pm2 save
pm2 startup
```

### Option 2: systemd service

Create `/etc/systemd/system/api-proxy.service`:

```ini
[Unit]
Description=API Proxy Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/proxy-server
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable api-proxy
sudo systemctl start api-proxy
```

### Option 3: Docker

```bash
docker build -t api-proxy .
docker run -d -p 3001:3001 --env-file .env api-proxy
```
