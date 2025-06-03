# 🚀 Toala.at VPS Deployment Guide

## Quick Deployment (Ubuntu VPS)

Deploy your complete toala.at equipment lending marketplace in minutes!

### Prerequisites

- Ubuntu 20.04+ VPS with sudo access
- At least 2GB RAM and 20GB storage
- Domain name (optional, for SSL)

### One-Command Deployment

```bash
# Clone or upload the application to your VPS
git clone <your-repo-url> toala-at
# OR upload the application files to your VPS

cd toala-at
chmod +x deploy.sh
./deploy.sh
```

The deployment script will automatically:
- ✅ Install Docker and Docker Compose
- ✅ Configure firewall (UFW)
- ✅ Set up production environment
- ✅ Build and deploy all services
- ✅ Create management scripts
- ✅ Optional SSL setup with Let's Encrypt

## Manual Step-by-Step Deployment

If you prefer manual control:

### 1. Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.production .env

# Edit environment variables
nano .env

# Generate secure JWT secret
openssl rand -hex 32
# Replace JWT_SECRET in .env with generated value
```

### 3. Deploy Application

```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## Configuration Options

### Environment Variables (.env)

```bash
# Security
JWT_SECRET=your_secure_random_string_here

# Database
MONGO_URL=mongodb://mongodb:27017
DB_NAME=toala_database

# Application
ENVIRONMENT=production
DEBUG=false

# Domain (for SSL)
DOMAIN=your-domain.com
SSL_EMAIL=your-email@domain.com
```

### SSL Setup (Optional)

For production with custom domain:

```bash
# Update .env with your domain
DOMAIN=toala.example.com
SSL_EMAIL=admin@example.com

# The deploy script will create SSL configuration
# After deployment, obtain certificates:
sudo certbot certonly --webroot -w /var/www/certbot -d your-domain.com

# Restart frontend to load certificates
docker-compose restart frontend
```

## Management Commands

The deployment creates helpful management scripts:

```bash
# Start application
./start.sh

# Stop application
./stop.sh

# Restart application
./restart.sh

# View logs (all services)
./logs.sh

# View logs (specific service)
./logs.sh backend
./logs.sh frontend
./logs.sh mongodb

# Create backup
./backup.sh

# Update application
./update.sh
```

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    MongoDB      │
│   (React)       │    │   (FastAPI)     │    │   (Database)    │
│   Port: 80/443  │────│   Port: 8001    │────│   Port: 27017   │
│   Nginx         │    │   Python        │    │   NoSQL         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Firewall Configuration

The deployment automatically configures UFW:

```bash
# Allow SSH (important!)
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check all services
docker-compose ps

# Check application health
curl http://localhost/          # Frontend
curl http://localhost/api/docs  # Backend API
```

### Log Management

```bash
# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Limit log output
docker-compose logs --tail=100 backend
```

### Database Management

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh

# Create database backup
docker-compose exec mongodb mongodump --archive | gzip > backup.gz

# Restore from backup
gunzip < backup.gz | docker-compose exec -T mongodb mongorestore --archive
```

### Updates and Maintenance

```bash
# Update application (if using git)
git pull
docker-compose build --no-cache
docker-compose down
docker-compose up -d

# Clean up unused Docker resources
docker system prune -a

# Update base images
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker-compose logs

# Check system resources
df -h
free -m

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

**Can't access application:**
```bash
# Check firewall
sudo ufw status

# Check if services are running
docker-compose ps

# Check ports
netstat -tlnp | grep -E '80|443|8001'
```

**Database connection issues:**
```bash
# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check backend logs
docker-compose logs backend

# Restart services
docker-compose restart
```

### Performance Optimization

```bash
# Increase Docker memory limits (if needed)
# Edit /etc/docker/daemon.json:
{
  "default-ulimits": {
    "memlock": {
      "Hard": -1,
      "Name": "memlock",
      "Soft": -1
    }
  }
}

# Restart Docker
sudo systemctl restart docker
```

## Security Best Practices

1. **Change default passwords** in .env
2. **Use strong JWT secret** (32+ random characters)
3. **Enable SSL** for production domains
4. **Regular backups** with ./backup.sh
5. **Keep system updated** with apt update
6. **Monitor logs** for suspicious activity
7. **Use non-root user** for deployment

## Backup and Recovery

### Automatic Backups

```bash
# Create daily backup cron job
echo "0 2 * * * cd /path/to/toala-at && ./backup.sh" | crontab -

# List current cron jobs
crontab -l
```

### Manual Backup

```bash
# Create backup
./backup.sh

# Backups are stored in ./backups/ directory
ls -la backups/
```

### Recovery

```bash
# Stop application
docker-compose down

# Restore database
gunzip < backups/mongodb_YYYYMMDD_HHMMSS.gz | docker-compose exec -T mongodb mongorestore --archive

# Start application
docker-compose up -d
```

## Production Checklist

- [ ] Environment variables configured (.env)
- [ ] Firewall properly configured
- [ ] SSL certificates obtained (if using domain)
- [ ] Backup strategy implemented
- [ ] Monitoring set up
- [ ] Performance testing completed
- [ ] Security review completed

## Support

For issues and support:
- Check logs: `docker-compose logs`
- Review this documentation
- Check GitHub issues
- Community support forums

---

**🎉 Your toala.at equipment marketplace is now running!**

Access your application at: `http://your-server-ip`
