# 🚀 VPS Deployment Guide for Toala.at

Deploy toala.at on your Ubuntu VPS alongside other containers with different domains.

## 📋 Prerequisites

- Ubuntu VPS with Docker and Docker Compose installed
- Existing reverse proxy setup (Traefik or nginx-proxy)
- Domain name pointing to your VPS
- SSH access to your VPS
- **Node.js 20+ required** (for React Router DOM v7 compatibility)

> **Note:** The Docker containers automatically use Node.js 20, so this requirement is handled automatically during deployment.

## 🔧 Supported Reverse Proxy Configurations

### 1. Traefik (Recommended)
- Automatic SSL certificate management
- Clean routing rules
- Built-in dashboard

### 2. nginx-proxy + letsencrypt-nginx-proxy-companion
- Widely used combination
- Reliable SSL automation
- Simple configuration

### 3. Custom/Manual Setup
- Works with any reverse proxy
- Manual configuration required

## 🚀 Quick VPS Deployment

### Step 1: Upload Files to VPS

```bash
# Upload project to your VPS
scp -r toala-at/ user@your-vps-ip:~/

# SSH to your VPS
ssh user@your-vps-ip
cd toala-at
```

### Step 2: Run VPS Deployment Script

```bash
# Make script executable
chmod +x deploy-vps.sh

# Run deployment (interactive)
./deploy-vps.sh
```

The script will:
- ✅ Detect your reverse proxy setup automatically
- ✅ Configure domain and SSL settings
- ✅ Create optimized Docker Compose configuration
- ✅ Deploy all services with proper network configuration
- ✅ Create VPS-specific management scripts

### Step 3: Access Your Application

Visit: `https://your-domain.com`

## 📝 Manual Configuration

If you prefer manual setup:

### For Traefik Users

```bash
# Copy environment template
cp .env.vps .env

# Edit with your domain
nano .env

# Deploy with Traefik configuration
docker-compose -f docker-compose.traefik.yml up -d
```

### For nginx-proxy Users

```bash
# Copy environment template
cp .env.vps .env

# Edit with your domain
nano .env

# Deploy with nginx-proxy configuration
docker-compose -f docker-compose.nginx-proxy.yml up -d
```

### For Custom Reverse Proxy

```bash
# Copy environment template
cp .env.vps .env

# Edit configuration
nano .env

# Deploy with production configuration
docker-compose -f docker-compose.prod.yml up -d
```

## 🌐 Domain Configuration

### DNS Records Required

Point your domain to your VPS:

```
Type: A
Name: toala (or your subdomain)
Value: YOUR_VPS_IP_ADDRESS
TTL: 300 (or default)
```

### Example Domain Configurations

**Option 1: Subdomain**
- Domain: `toala.yourdomain.com`
- API: `toala.yourdomain.com/api`

**Option 2: Separate API subdomain (nginx-proxy only)**
- Frontend: `toala.yourdomain.com`
- API: `api.toala.yourdomain.com`

## 🔧 Environment Variables

Update `.env` file with your settings:

```bash
# Domain Configuration
DOMAIN=toala.yourdomain.com
SSL_EMAIL=admin@yourdomain.com

# Security
JWT_SECRET=your_generated_secure_secret

# Database
MONGO_URL=mongodb://mongodb:27017
DB_NAME=toala_database

# Reverse Proxy
PROXY_TYPE=traefik
PROXY_NETWORK=traefik
```

## 🐳 Docker Networks

The application uses two networks:

1. **Internal Network** (`toala_internal`):
   - Backend ↔ MongoDB communication
   - Not accessible from outside

2. **Proxy Network** (`traefik`/`nginx-proxy`):
   - Frontend and Backend exposed to reverse proxy
   - External access through reverse proxy only

## 📊 Service Architecture

```
Internet → Reverse Proxy → Frontend (Port 80)
              ↓
              └────────→ Backend (Port 8001) → MongoDB (Port 27017)
```

## 🛠️ Management Commands

After deployment, use these VPS-specific commands:

```bash
# Start application
./start-vps.sh

# Stop application
./stop-vps.sh

# Restart application
./restart-vps.sh

# View logs
./logs-vps.sh            # All services
./logs-vps.sh backend    # Specific service

# Update application
./update-vps.sh
```

## 🔍 Monitoring and Health Checks

### Check Service Status

```bash
# View running containers
docker-compose -f docker-compose.*.yml ps

# Check logs
docker-compose -f docker-compose.*.yml logs -f

# Check resource usage
docker stats
```

### Health Check Endpoints

- Frontend: `https://yourdomain.com/health`
- Backend: `https://yourdomain.com/api/docs`

### Monitor SSL Certificates

```bash
# Check certificate expiry (Traefik)
docker logs traefik 2>&1 | grep -i cert

# Check certificate expiry (nginx-proxy)
docker logs nginx-proxy-letsencrypt 2>&1 | grep -i cert
```

## 🚨 Troubleshooting

### Common Issues

**1. Node.js Version Compatibility Error**

```
Error: react-router-dom@7.5.1: the engine "node" is incompatible with this module. Expected version ">=20.0.0" got "18.x.x"
```

**Solution:**
```bash
# Run the fix script
./fix-nodejs.sh

# Or manually update Dockerfiles
find . -name "Dockerfile*" -exec sed -i 's/node:18-alpine/node:20-alpine/g' {} \;

# Rebuild containers
docker-compose build --no-cache
```

**2. Service Not Accessible**

```bash
# Check if domain resolves to your VPS
nslookup yourdomain.com

# Check if reverse proxy is running
docker ps | grep -E 'traefik|nginx-proxy'

# Check proxy network
docker network ls | grep proxy
```

**2. SSL Certificate Issues**

```bash
# For Traefik - check certificate resolver
docker logs traefik 2>&1 | grep -i "unable to obtain ACME certificate"

# For nginx-proxy - check letsencrypt companion
docker logs letsencrypt-nginx-proxy-companion
```

**3. Backend API Not Working**

```bash
# Check backend logs
./logs-vps.sh backend

# Test backend directly
docker exec -it toala_backend curl http://localhost:8001/docs

# Check MongoDB connection
docker exec -it toala_mongodb mongosh --eval "db.adminCommand('ping')"
```

**4. Database Issues**

```bash
# Check MongoDB logs
./logs-vps.sh mongodb

# Check database size
docker exec -it toala_mongodb mongosh --eval "db.stats()"

# Backup database
./backup-vps.sh
```

### Logs and Debugging

```bash
# Application logs
docker-compose logs -f

# System logs
journalctl -u docker -f

# Resource usage
htop
df -h
```

## 🔄 Updates and Maintenance

### Regular Updates

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull

# Update application
./update-vps.sh
```

### Backup Strategy

```bash
# Manual backup
./backup-vps.sh

# Automated backups (add to crontab)
0 2 * * * cd /path/to/toala-at && ./backup-vps.sh
```

## 🔐 Security Best Practices

1. **Firewall Configuration**:
   ```bash
   ufw allow ssh
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

2. **Regular Updates**:
   - Keep Docker and Docker Compose updated
   - Update base images regularly
   - Monitor security advisories

3. **SSL/TLS**:
   - Use strong cipher suites
   - Ensure HTTPS redirects are working
   - Monitor certificate expiry

4. **Database Security**:
   - MongoDB runs on internal network only
   - Regular backups
   - Strong JWT secrets

## 📈 Performance Optimization

### Resource Allocation

```yaml
# Add to docker-compose file for resource limits
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Monitoring

```bash
# Monitor resource usage
docker stats

# Monitor application performance
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com
```

## 🎯 Production Checklist

- [ ] Domain DNS configured
- [ ] Reverse proxy running
- [ ] SSL certificates obtained
- [ ] Environment variables set
- [ ] Firewall configured
- [ ] Backup strategy implemented
- [ ] Monitoring set up
- [ ] Health checks working
- [ ] Log rotation configured

Your toala.at marketplace is now ready for production! 🇦🇹