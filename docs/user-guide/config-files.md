# Configuration Files

Docker Pilot uses different types of configuration files to manage projects, services, and system behaviors.

## Configuration Structure

### File Hierarchy

Docker Pilot searches for configuration files in the following order:

1. `docker-pilot.yml` (project root)
2. `docker-pilot.json` (project root)
3. `.docker-pilot/config.yml` (configuration directory)
4. `~/.docker-pilot/config.yml` (user global configuration)

### Main File: docker-pilot.yml

```yaml
# docker-pilot.yml
version: "1.0"

project:
  name: "my-project"
  version: "1.0.0"

services:
  database:
    image: postgres:13
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - backend

volumes:
  db_data:
    driver: local

networks:
  default:
    driver: bridge
```

## Configuration Sections

### Project Section

Defines general project information:

```yaml
project:
  name: "project-name"              # Project name
  version: "1.0.0"                  # Project version
  description: "Project description" # Optional description
  maintainer: "your@email.com"     # Maintainer email
  tags: ["web", "api", "database"]  # Project tags
```

### Services Section

Defines project services:

```yaml
services:
  service-name:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
    networks:
      - frontend
    environment:
      - ENV=production
    depends_on:
      - database
    restart: unless-stopped
```

### Volumes Section

Defines project volumes:

```yaml
volumes:
  # Named volume
  app_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /host/path

  # Simple volume
  db_data:
```

### Networks Section

Defines project networks:

```yaml
networks:
  # Default network
  default:
    driver: bridge

  # Custom network
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

  backend:
    driver: bridge
    internal: true
```

## Docker Pilot Specific Settings

### Settings Section

Docker Pilot specific configurations:

```yaml
settings:
  # Log configurations
  logging:
    level: info              # debug, info, warn, error
    format: pretty          # json, text, pretty
    file: ./logs/pilot.log  # Log file path

  # Performance settings
  performance:
    parallel_operations: 4   # Max parallel operations
    timeout: 30             # Default timeout in seconds
    retry_attempts: 3       # Retry attempts for failed operations

  # UI preferences
  ui:
    theme: default          # UI theme
    colors: true           # Enable colors
    animations: true       # Enable animations
    language: auto         # Language (auto, en, pt-br)
```

### Hooks Section

Defines hooks for events:

```yaml
hooks:
  # Before starting
  before_start:
    - echo "Preparing to start services..."
    - npm run build

  # After starting
  after_start:
    - echo "Services started successfully!"
    - curl -f http://localhost:3000/health

  # Before stopping
  before_stop:
    - echo "Saving state before stopping..."
    - npm run backup

  # After stopping
  after_stop:
    - echo "Services stopped."
    - docker system prune -f
```

### Environments Section

Defines different environments:

```yaml
environments:
  development:
    services:
      api:
        build: .
        environment:
          NODE_ENV: development
          DEBUG: "true"
        volumes:
          - .:/app
          - /app/node_modules

  production:
    services:
      api:
        image: myapp:latest
        environment:
          NODE_ENV: production
          DEBUG: "false"
        restart: always
```

## Global Configuration

### Global Configuration File

Located at `~/.docker-pilot/config.yml`:

```yaml
# User global configuration
user:
  name: "Your Name"
  email: "your@email.com"

preferences:
  default_editor: "code"
  telemetry: false
  auto_update: true

theme:
  name: "default"
  colors: true
  animations: true

docker:
  host: "unix:///var/run/docker.sock"
  version: "auto"

registry:
  default: "docker.io"
  credentials:
    docker.io:
      username: "your-username"
      # Password stored securely

plugins:
  registry: "https://plugins.docker-pilot.com"
  auto_update: true
  enabled:
    - backup
    - monitoring

notifications:
  email:
    enabled: false
    smtp_host: "smtp.gmail.com"
    smtp_port: 587
    username: "your@email.com"

  slack:
    enabled: false
    webhook_url: "https://hooks.slack.com/..."

  discord:
    enabled: false
    webhook_url: "https://discord.com/api/webhooks/..."
```

## Environment Files

### .env

Environment variables file:

```bash
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-here
API_KEY=your-api-key-here
```

### .env.example

Environment variables template:

```bash
# .env.example
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-here
API_KEY=your-api-key-here
```

## CI/CD Configuration

### .docker-pilot/ci.yml

CI/CD configuration:

```yaml
# .docker-pilot/ci.yml
pipelines:
  test:
    stages:
      - name: "Test"
        commands:
          - docker-pilot build --no-cache
          - docker-pilot test

  deploy:
    stages:
      - name: "Build"
        commands:
          - docker-pilot build --production
      - name: "Deploy"
        commands:
          - docker-pilot deploy --environment production
        when:
          branch: main
```

## Configuration Validation

### JSON Schema

Docker Pilot supports validation via JSON Schema:

```json
{
  "$schema": "https://docker-pilot.dev/schema/config.json",
  "version": "1.0",
  "project": {
    "name": "my-project"
  }
}
```

### Validation Commands

```bash
# Validate configuration
docker-pilot config validate

# Validate specific file
docker-pilot config validate --file docker-pilot.yml

# Show configuration schema
docker-pilot config schema

# Test configuration
docker-pilot config test
```

## Configuration Tips

### Best Practices

1. **Use version control**: Always version your configuration files
2. **Environment separation**: Use different files for different environments
3. **Secret management**: Never commit secrets, use environment variables
4. **Documentation**: Comment your configuration files
5. **Validation**: Always validate before deploying

### Common Patterns

```yaml
# Conditional configurations
services:
  web:
    image: nginx:${NGINX_VERSION:-latest}
    environment:
      - ENV=${NODE_ENV:-development}
    ports:
      - "${WEB_PORT:-80}:80"

# Service dependencies
services:
  api:
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_started
```

For more information about specific configuration options, see the [commands reference](commands.md).
