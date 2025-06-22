# Docker Integration

Docker Pilot offers deep integration with Docker Engine and Docker Compose, providing advanced features for container management and orchestration.

## Overview

Docker integration includes:

- **Advanced container management**
- **Intelligent orchestration with Docker Compose**
- **Custom networking**
- **Gestão de volumes**
- **Monitoramento de recursos**
- **Integração com Docker Registry**

## Configuração Docker

### Configuração Básica

```yaml
# docker-pilot.yml
docker:
  # Configuração do daemon
  daemon:
    host: "unix:///var/run/docker.sock"
    version: "auto"
    timeout: 60

  # Configuração de build
  build:
    context: "."
    cache: true
    parallel: true
    max_parallel: 4

  # Configuração de registry
  registry:
    default: "docker.io"
    mirrors:
      - "mirror.gcr.io"
      - "registry-1.docker.io"

  # Configuração de rede
  network:
    driver: "bridge"
    ipam:
      driver: "default"
      config:
        - subnet: "172.20.0.0/16"
          gateway: "172.20.0.1"
```

### Configuração Avançada

```yaml
docker:
  # Configurações de recursos
  resources:
    default_limits:
      memory: "512m"
      cpus: "0.5"

    default_reservations:
      memory: "256m"
      cpus: "0.25"

  # Configurações de log
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"

  # Configurações de security
  security:
    no_new_privileges: true
    read_only_root_filesystem: false
    user: "1000:1000"
    cap_drop:
      - "ALL"
    cap_add:
      - "NET_BIND_SERVICE"

  # Labels padrão
  labels:
    maintainer: "team@company.com"
    version: "${APP_VERSION}"
    environment: "${ENVIRONMENT}"
```

## Gerenciamento de Contêineres

### Operações Básicas

```bash
# Listar contêineres
docker-pilot ps
docker-pilot ps --all
docker-pilot ps --format table

# Inspecionar contêiner
docker-pilot inspect api
docker-pilot inspect api --format json

# Executar comandos
docker-pilot exec api bash
docker-pilot exec api npm run migrate
docker-pilot exec -it api /bin/sh

# Copiar arquivos
docker-pilot cp ./config.json api:/app/config.json
docker-pilot cp api:/app/logs ./logs
```

### Operações Avançadas

```bash
# Estatísticas de recursos
docker-pilot stats
docker-pilot stats --stream
docker-pilot stats api database

# Processos em execução
docker-pilot top api
docker-pilot top --all

# Informações do sistema
docker-pilot system info
docker-pilot system df
docker-pilot system events --filter container=api
```

## Docker Compose Integration

### Configuração Compose

```yaml
# docker-pilot.yml
version: "3.8"

services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile.prod
      args:
        NODE_ENV: production
        BUILD_VERSION: "${BUILD_VERSION}"
      cache_from:
        - "${REGISTRY}/api:cache"
      target: production

    image: "${REGISTRY}/api:${VERSION}"

    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@database:5432/myapp
      - REDIS_URL=redis://redis:6379

    ports:
      - "3000:3000"

    volumes:
      - api_data:/app/data
      - ./logs:/app/logs:rw

    networks:
      - backend
      - frontend

    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_started

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    restart: unless-stopped

    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.example.com`)"
      - "traefik.http.services.api.loadbalancer.server.port=3000"

networks:
  backend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

  frontend:
    driver: bridge
    attachable: true

volumes:
  api_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data

  db_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./db_data
```

### Profiles e Environments

```yaml
# docker-pilot.yml
services:
  # Serviço base
  api:
    build: ./api
    profiles:
      - web
      - api
    environment:
      - NODE_ENV=${NODE_ENV:-development}

  # Serviço de desenvolvimento
  api-dev:
    extends:
      service: api
    profiles:
      - development
    volumes:
      - ./api:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=*
    command: npm run dev

  # Serviço de produção
  api-prod:
    extends:
      service: api
    profiles:
      - production
    environment:
      - NODE_ENV=production
    command: npm start

  # Serviços opcionais
  redis:
    image: redis:alpine
    profiles:
      - cache
      - development

  monitoring:
    image: prom/prometheus
    profiles:
      - monitoring
      - production
```

## Networking Avançado

### Configuração de Redes

```yaml
# docker-pilot.yml
networks:
  # Rede frontend
  frontend:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: "dp-frontend"
    ipam:
      driver: default
      config:
        - subnet: "172.20.0.0/24"
          gateway: "172.20.0.1"
          ip_range: "172.20.0.0/25"

    labels:
      description: "Frontend network"
      environment: "${ENVIRONMENT}"

  # Rede backend
  backend:
    driver: bridge
    internal: true  # Sem acesso à internet
    ipam:
      config:
        - subnet: "172.21.0.0/24"

  # Rede externa
  external-net:
    external: true
    name: "shared-network"
```

### Configuração de Serviços

```yaml
services:
  api:
    networks:
      frontend:
        ipv4_address: 172.20.0.10
        aliases:
          - api.local
      backend:
        aliases:
          - api-backend

  database:
    networks:
      backend:
        ipv4_address: 172.21.0.10
```

### Comandos de Rede

```bash
# Listar redes
docker-pilot network ls

# Criar rede
docker-pilot network create frontend --driver bridge

# Inspecionar rede
docker-pilot network inspect frontend

# Conectar serviço à rede
docker-pilot network connect frontend api

# Desconectar serviço da rede
docker-pilot network disconnect frontend api

# Remover rede
docker-pilot network rm frontend
```

## Gerenciamento de Volumes

### Tipos de Volumes

```yaml
# docker-pilot.yml
volumes:
  # Volume nomeado
  app_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data

    labels:
      backup: "daily"
      retention: "30d"

  # Volume com driver específico
  logs:
    driver: local
    driver_opts:
      type: tmpfs
      device: tmpfs
      o: "size=100m,uid=1000"

  # Volume NFS
  shared_storage:
    driver: local
    driver_opts:
      type: nfs
      o: "addr=10.0.0.1,rw"
      device: ":/shared"

  # Volume externo
  external_data:
    external: true
    name: "project-data"
```

### Comandos de Volume

```bash
# Listar volumes
docker-pilot volume ls

# Criar volume
docker-pilot volume create app_data

# Inspecionar volume
docker-pilot volume inspect app_data

# Backup de volume
docker-pilot volume backup app_data ./backup.tar.gz

# Restore de volume
docker-pilot volume restore app_data ./backup.tar.gz

# Remover volume
docker-pilot volume rm app_data

# Limpeza de volumes órfãos
docker-pilot volume prune
```

## Registry Integration

### Configuração de Registry

```yaml
# docker-pilot.yml
registries:
  # Registry padrão
  default:
    url: "docker.io"
    username: "${DOCKER_USERNAME}"
    password: "${DOCKER_PASSWORD}"

  # Registry privado
  private:
    url: "registry.company.com"
    username: "${PRIVATE_REGISTRY_USER}"
    password: "${PRIVATE_REGISTRY_PASS}"
    secure: true
    ca_cert: "./certs/registry-ca.crt"

  # Amazon ECR
  ecr:
    url: "123456789012.dkr.ecr.us-east-1.amazonaws.com"
    auth_type: "ecr"
    region: "us-east-1"

  # Google Container Registry
  gcr:
    url: "gcr.io/my-project"
    auth_type: "gcr"
    key_file: "./service-account.json"
```

### Operações de Registry

```bash
# Login em registry
docker-pilot registry login private

# Push de imagens
docker-pilot push api
docker-pilot push --all
docker-pilot push api --registry private

# Pull de imagens
docker-pilot pull api
docker-pilot pull --all
docker-pilot pull api --registry private

# Tag de imagens
docker-pilot tag api:latest api:v1.0.0
docker-pilot tag api:latest registry.company.com/api:v1.0.0

# Listar imagens
docker-pilot images
docker-pilot images --filter dangling=true
```

## Build Avançado

### Multi-stage Builds

```dockerfile
# Dockerfile
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:16-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM builder AS production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

```yaml
# docker-pilot.yml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production  # ou development
      args:
        NODE_ENV: production
        BUILD_VERSION: "${BUILD_VERSION}"
```

### Build com Cache

```yaml
# docker-pilot.yml
services:
  api:
    build:
      context: .
      cache_from:
        - "${REGISTRY}/api:cache"
        - "${REGISTRY}/api:latest"
      cache_to:
        - "type=registry,ref=${REGISTRY}/api:cache"
```

### Comandos de Build

```bash
# Build básico
docker-pilot build api

# Build com cache
docker-pilot build api --cache

# Build sem cache
docker-pilot build api --no-cache

# Build paralelo
docker-pilot build --parallel

# Build com argumentos
docker-pilot build api --build-arg NODE_ENV=production

# Build com target específico
docker-pilot build api --target production
```

## Monitoramento e Logs

### Configuração de Logs

```yaml
# docker-pilot.yml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

  database:
    logging:
      driver: "syslog"
      options:
        syslog-address: "tcp://192.168.0.1:514"
        tag: "database"
```

### Comandos de Log

```bash
# Ver logs
docker-pilot logs api
docker-pilot logs api --follow
docker-pilot logs api --tail 100
docker-pilot logs api --since "2023-01-01"

# Logs de múltiplos serviços
docker-pilot logs api database
docker-pilot logs --all

# Exportar logs
docker-pilot logs api > api.log
```

### Monitoramento de Recursos

```bash
# Estatísticas em tempo real
docker-pilot stats
docker-pilot stats --stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Uso de recursos
docker-pilot system df
docker-pilot system events --filter container=api

# Health checks
docker-pilot health
docker-pilot health api --timeout 30s
```

## Troubleshooting

### Debugging de Contêineres

```bash
# Inspecionar contêiner
docker-pilot inspect api --format json

# Verificar processos
docker-pilot top api

# Verificar rede
docker-pilot exec api netstat -tulpn
docker-pilot exec api nslookup database

# Verificar volumes
docker-pilot exec api df -h
docker-pilot exec api ls -la /app/data
```

### Logs de Debug

```yaml
# docker-pilot.yml
services:
  api:
    environment:
      - DEBUG=*
      - LOG_LEVEL=debug
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
```

### Comandos de Limpeza

```bash
# Limpeza geral
docker-pilot system prune
docker-pilot system prune --all

# Limpeza específica
docker-pilot image prune
docker-pilot volume prune
docker-pilot network prune

# Limpeza forçada
docker-pilot system prune --force --volumes
```

## Performance Optimization

### Otimização de Builds

```dockerfile
# Dockerfile otimizado
FROM node:16-alpine AS base
WORKDIR /app

# Instalar dependências primeiro (cache layer)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código (layer que muda mais)
COPY . .

# Multi-stage para reduzir tamanho
FROM base AS production
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Otimização de Resources

```yaml
# docker-pilot.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

    # Configurações de performance
    ulimits:
      nofile:
        soft: 65536
        hard: 65536

    # Configurações de kernel
    sysctls:
      net.core.somaxconn: 1024
```

## Integração com Orquestradores

### Docker Swarm

```yaml
# docker-pilot.yml
services:
  api:
    deploy:
      mode: replicated
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      placement:
        constraints:
          - node.role == worker
          - node.labels.environment == production
```

### Kubernetes Export

```bash
# Gerar manifests Kubernetes
docker-pilot k8s generate
docker-pilot k8s generate --output ./k8s

# Aplicar no cluster
docker-pilot k8s apply
docker-pilot k8s apply --namespace production
```

## Veja Também

- [Configuração](../user-guide/config-files.md)
- [Monitoramento](monitoring.md)
- [Plugins](plugins.md)
- [Automação](automation.md)
