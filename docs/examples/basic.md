# Basic Examples

Learn Docker Pilot through practical examples.

## Example 1: Simple Web Application

### Project Structure

```
simple-web-app/
├── docker-compose.yml
├── src/
│   └── index.html
└── nginx.conf
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./src:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    restart: unless-stopped
```

### Using Docker Pilot

```bash
# Navigate to project
cd simple-web-app

# Start Docker Pilot (interactive mode)
docker-pilot

# Or use CLI commands
docker-pilot up          # Start the web server
docker-pilot status      # Check if it's running
docker-pilot logs        # View nginx logs
docker-pilot down        # Stop the server
```

### Expected Output

```bash
$ docker-pilot up
✅ Starting services...
✅ Service web started successfully
🌐 Web server available at http://localhost:8080

$ docker-pilot status
📊 Service Status:
✅ web: running (healthy) - 0.0.0.0:8080->80/tcp
```

---

## Example 2: Full-Stack Application

### Project Structure

```
fullstack-app/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
└── database/
    └── init.sql
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@database:5432/app
    depends_on:
      - database

  database:
    image: postgres:13
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=app
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Development Workflow

```bash
# Start all services
docker-pilot up --build

# Check status
docker-pilot status

# View logs for all services
docker-pilot logs --follow

# View logs for specific service
docker-pilot logs backend

# Open shell in backend for debugging
docker-pilot shell backend

# Restart frontend after code changes
docker-pilot restart frontend

# Stop everything
docker-pilot down
```

### Service Management

```bash
# Start only database
docker-pilot up database

# Start backend and its dependencies
docker-pilot up backend

# Scale frontend to 3 instances
docker-pilot scale frontend=3

# Update all images
docker-pilot pull
docker-pilot up
```

---

## Example 3: Microservices Architecture

### Project Structure

```
microservices-app/
├── docker-compose.yml
├── docker-compose.override.yml
├── services/
│   ├── user-service/
│   ├── order-service/
│   ├── payment-service/
│   └── notification-service/
├── gateway/
├── shared/
└── monitoring/
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  # API Gateway
  gateway:
    build: ./gateway
    ports:
      - "80:80"
    depends_on:
      - user-service
      - order-service
      - payment-service

  # User Service
  user-service:
    build: ./services/user-service
    ports:
      - "8001:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@user-db:5432/users
    depends_on:
      - user-db
      - redis

  # Order Service
  order-service:
    build: ./services/order-service
    ports:
      - "8002:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@order-db:5432/orders
      - USER_SERVICE_URL=http://user-service:8000
    depends_on:
      - order-db
      - redis

  # Payment Service
  payment-service:
    build: ./services/payment-service
    ports:
      - "8003:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@payment-db:5432/payments
    depends_on:
      - payment-db
      - redis

  # Notification Service
  notification-service:
    build: ./services/notification-service
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  # Databases
  user-db:
    image: postgres:13
    environment:
      - POSTGRES_DB=users
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - user_data:/var/lib/postgresql/data

  order-db:
    image: postgres:13
    environment:
      - POSTGRES_DB=orders
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - order_data:/var/lib/postgresql/data

  payment-db:
    image: postgres:13
    environment:
      - POSTGRES_DB=payments
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - payment_data:/var/lib/postgresql/data

  # Cache & Message Queue
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

volumes:
  user_data:
  order_data:
  payment_data:
```

### Docker Pilot Configuration

Docker Pilot auto-generates this configuration:

```json
{
  "projectName": "microservices-app",
  "language": "en",
  "services": {
    "redis": { "priority": 1 },
    "user-db": { "priority": 2 },
    "order-db": { "priority": 2 },
    "payment-db": { "priority": 2 },
    "user-service": { "priority": 3 },
    "order-service": { "priority": 4 },
    "payment-service": { "priority": 4 },
    "notification-service": { "priority": 4 },
    "gateway": { "priority": 5 }
  }
}
```

### Complex Operations

```bash
# Start infrastructure first
docker-pilot up redis user-db order-db payment-db

# Start core services
docker-pilot up user-service

# Start dependent services
docker-pilot up order-service payment-service notification-service

# Start gateway
docker-pilot up gateway

# Or start everything at once (Docker Pilot handles order)
docker-pilot up

# Monitor all services
docker-pilot status --detailed

# Check health of all services
docker-pilot exec gateway curl http://user-service:8000/health
docker-pilot exec gateway curl http://order-service:8000/health

# View aggregated logs
docker-pilot logs --follow

# Debug specific service
docker-pilot shell user-service
docker-pilot logs user-service --tail 100

# Scale services based on load
docker-pilot scale user-service=3 order-service=2

# Update and restart services
docker-pilot pull
docker-pilot build --no-cache
docker-pilot up
```

---

## Example 4: WordPress with Docker Pilot

### docker-compose.yml

```yaml
version: '3.8'

services:
  wordpress:
    image: wordpress:latest
    ports:
      - "8080:80"
    environment:
      - WORDPRESS_DB_HOST=mysql
      - WORDPRESS_DB_USER=wordpress
      - WORDPRESS_DB_PASSWORD=wordpress
      - WORDPRESS_DB_NAME=wordpress
    volumes:
      - wordpress_data:/var/www/html
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=wordpress
      - MYSQL_USER=wordpress
      - MYSQL_PASSWORD=wordpress
      - MYSQL_ROOT_PASSWORD=rootpassword
    volumes:
      - mysql_data:/var/lib/mysql

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    ports:
      - "8081:80"
    environment:
      - PMA_HOST=mysql
      - MYSQL_ROOT_PASSWORD=rootpassword
    depends_on:
      - mysql

volumes:
  wordpress_data:
  mysql_data:
```

### WordPress Management

```bash
# Start WordPress environment
docker-pilot up

# Check everything is running
docker-pilot status

# Access WordPress: http://localhost:8080
# Access phpMyAdmin: http://localhost:8081

# View WordPress logs
docker-pilot logs wordpress

# Backup database
docker-pilot exec mysql mysqldump -u root -prootpassword wordpress > backup.sql

# Restart after configuration changes
docker-pilot restart wordpress

# Update WordPress
docker-pilot pull wordpress
docker-pilot up wordpress
```

---

## Example 5: Development Environment

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://dev:dev@postgres:5432/devdb
    depends_on:
      - postgres
      - redis
    command: npm run dev

  postgres:
    image: postgres:13
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=devdb
      - POSTGRES_USER=dev
      - POSTGRES_PASSWORD=dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # Web UI

volumes:
  postgres_data:
```

### Daily Development

```bash
# Start development environment
docker-pilot up

# Install new npm package
docker-pilot exec app npm install lodash

# Run database migrations
docker-pilot exec app npm run migrate

# Run tests
docker-pilot exec app npm test

# View application logs
docker-pilot logs app --follow

# Access database for debugging
docker-pilot shell postgres
# psql -U dev -d devdb

# View emails (MailHog): http://localhost:8025

# Clean restart after big changes
docker-pilot down --volumes
docker-pilot up --build
```

---

## Common Patterns

### Pattern 1: Health Checks

```bash
# Check if services are healthy
docker-pilot status --filter health=healthy

# Wait for services to be ready
while ! docker-pilot status --quiet; do
  echo "Waiting for services..."
  sleep 2
done
```

### Pattern 2: Environment-Specific Startup

```bash
# Development
docker-pilot --config docker-pilot.dev.json up

# Testing
docker-pilot --config docker-pilot.test.json up --build

# Production
docker-pilot --config docker-pilot.prod.json up --detach
```

### Pattern 3: Maintenance Scripts

```bash
#!/bin/bash
# maintenance.sh

echo "🧹 Starting maintenance..."

# Stop services
docker-pilot down

# Clean up
docker-pilot clean --all

# Update images
docker-pilot pull

# Restart
docker-pilot up --build

echo "✅ Maintenance complete!"
```

### Pattern 4: Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker-pilot exec database pg_dump -U user myapp > "backup_${DATE}.sql"

# Backup volumes
docker run --rm -v myapp_data:/data -v $(pwd):/backup alpine tar czf /backup/volumes_${DATE}.tar.gz /data

echo "✅ Backup completed: backup_${DATE}.*"
```

## Tips for Success

### 1. Use Descriptive Service Names

```yaml
# Good
services:
  web-frontend:
  api-backend:
  postgres-database:

# Avoid
services:
  app1:
  app2:
  db:
```

### 2. Set Up Health Checks

```yaml
services:
  web:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3. Use Environment Files

```bash
# .env
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypass
API_PORT=8000
```

```yaml
# docker-compose.yml
services:
  api:
    env_file: .env
    ports:
      - "${API_PORT}:8000"
```

### 4. Document Your Setup

Create a `README.md` with Docker Pilot commands:

```markdown
# My Project

## Quick Start

```bash
# Start everything
docker-pilot up

# View status
docker-pilot status

# View logs
docker-pilot logs --follow
```

## Development

```bash
# Run tests
docker-pilot exec app npm test

# Database shell
docker-pilot shell database
```
```

## What's Next?

- 🚀 Try [Advanced Examples](advanced.md)
- 🏗️ Learn about [Real-world Projects](projects.md)
- 🔌 Explore [Plugin Examples](plugins.md)
- 🎮 Master the [Interactive Menu](../user-guide/interactive-menu.md)

---

!!! success "Ready for More"
    These examples show the power and flexibility of Docker Pilot. Start with simple examples and gradually work your way up to more complex architectures!
