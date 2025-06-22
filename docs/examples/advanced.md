# Advanced Examples

This section presents more complex examples and advanced use cases of Docker Pilot.

## Microservices with Docker Pilot

### Microservices Architecture

```yaml
# docker-pilot.yml
version: "1.0"

project:
  name: "ecommerce-microservices"
  description: "E-commerce system with microservices architecture"

services:
  # API Gateway
  gateway:
    build: ./gateway
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - auth-service
      - product-service
      - order-service
    networks:
      - frontend
      - backend

  # Authentication Service
  auth-service:
    build: ./services/auth
    environment:
      - DB_HOST=auth-db
      - REDIS_URL=redis://auth-cache:6379
    depends_on:
      - auth-db
      - auth-cache
    networks:
      - backend
    deploy:
      replicas: 2

  # Auth service database
  auth-db:
    image: postgres:13
    environment:
      - POSTGRES_DB=auth
      - POSTGRES_USER=auth_user
      - POSTGRES_PASSWORD=${AUTH_DB_PASSWORD}
    volumes:
      - auth_data:/var/lib/postgresql/data
    networks:
      - backend

  # Cache do serviço de auth
  auth-cache:
    image: redis:alpine
    networks:
      - backend

  # Serviço de Produtos
  product-service:
    build: ./services/products
    environment:
      - DB_HOST=product-db
      - ELASTIC_URL=http://elasticsearch:9200
    depends_on:
      - product-db
      - elasticsearch
    networks:
      - backend
    deploy:
      replicas: 3

  # Banco do serviço de produtos
  product-db:
    image: postgres:13
    environment:
      - POSTGRES_DB=products
      - POSTGRES_USER=product_user
      - POSTGRES_PASSWORD=${PRODUCT_DB_PASSWORD}
    volumes:
      - product_data:/var/lib/postgresql/data
    networks:
      - backend

  # Serviço de Pedidos
  order-service:
    build: ./services/orders
    environment:
      - DB_HOST=order-db
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - order-db
      - rabbitmq
    networks:
      - backend
    deploy:
      replicas: 2

  # Banco do serviço de pedidos
  order-db:
    image: postgres:13
    environment:
      - POSTGRES_DB=orders
      - POSTGRES_USER=order_user
      - POSTGRES_PASSWORD=${ORDER_DB_PASSWORD}
    volumes:
      - order_data:/var/lib/postgresql/data
    networks:
      - backend

  # Message Broker
  rabbitmq:
    image: rabbitmq:3-management
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=${RABBITMQ_PASSWORD}
    ports:
      - "15672:15672"  # Management UI
    networks:
      - backend

  # Search Engine
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elastic_data:/usr/share/elasticsearch/data
    networks:
      - backend

  # Monitoramento
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - backend

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - backend

volumes:
  auth_data:
  product_data:
  order_data:
  elastic_data:
  prometheus_data:
  grafana_data:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge

# Workflows para microserviços
workflows:
  full-deploy:
    description: "Deploy completo de todos os microserviços"
    steps:
      - name: "Build all services"
        commands:
          - "docker-pilot build --parallel"

      - name: "Start infrastructure"
        commands:
          - "docker-pilot start auth-db product-db order-db"
          - "docker-pilot start rabbitmq elasticsearch redis"
          - "sleep 30"

      - name: "Run migrations"
        commands:
          - "docker-pilot exec auth-service npm run migrate"
          - "docker-pilot exec product-service npm run migrate"
          - "docker-pilot exec order-service npm run migrate"

      - name: "Start services"
        commands:
          - "docker-pilot start auth-service product-service order-service"
          - "sleep 15"

      - name: "Start gateway"
        commands:
          - "docker-pilot start gateway"

      - name: "Health checks"
        commands:
          - "docker-pilot health --all"

  dev-setup:
    description: "Setup ambiente de desenvolvimento"
    steps:
      - name: "Install dependencies"
        commands:
          - "npm install"
          - "cd services/auth && npm install"
          - "cd services/products && npm install"
          - "cd services/orders && npm install"

      - name: "Start dev environment"
        commands:
          - "docker-pilot start auth-db product-db order-db --detach"
          - "sleep 10"
          - "docker-pilot run migrate-all"
          - "docker-pilot start auth-service product-service order-service"

# Comandos personalizados
custom_commands:
  migrate-all:
    description: "Executar migrações de todos os serviços"
    parallel:
      - name: "Auth migrations"
        command: "docker-pilot exec auth-service npm run migrate"
      - name: "Product migrations"
        command: "docker-pilot exec product-service npm run migrate"
      - name: "Order migrations"
        command: "docker-pilot exec order-service npm run migrate"

  seed-data:
    description: "Popular dados de teste"
    steps:
      - "docker-pilot exec auth-service npm run seed"
      - "docker-pilot exec product-service npm run seed"
      - "docker-pilot exec order-service npm run seed"

  load-test:
    description: "Executar testes de carga"
    script: |
      echo "Iniciando testes de carga..."

      # Teste de autenticação
      ab -n 1000 -c 10 http://localhost/auth/login

      # Teste de listagem de produtos
      ab -n 2000 -c 20 http://localhost/products

      # Teste de criação de pedidos
      ab -n 500 -c 5 -p order.json -T application/json http://localhost/orders

# Monitoramento
monitoring:
  enabled: true
  dashboard:
    port: 8080

  metrics:
    - cpu_usage
    - memory_usage
    - request_count
    - response_time

  alerts:
    - name: "high_cpu"
      condition: "cpu_usage > 80"
      actions: ["email", "slack"]

    - name: "service_down"
      condition: "service_status == 'stopped'"
      actions: ["restart_service", "pagerduty"]
```

### Configuração de Desenvolvimento

```yaml
# docker-pilot.dev.yml
extends:
  file: docker-pilot.yml

services:
  # Override para desenvolvimento
  auth-service:
    volumes:
      - ./services/auth:/app
      - /app/node_modules
    command: npm run dev
    environment:
      - NODE_ENV=development
      - DEBUG=*

  product-service:
    volumes:
      - ./services/products:/app
      - /app/node_modules
    command: npm run dev
    environment:
      - NODE_ENV=development
      - DEBUG=*

  order-service:
    volumes:
      - ./services/orders:/app
      - /app/node_modules
    command: npm run dev
    environment:
      - NODE_ENV=development
      - DEBUG=*

# Automação específica para dev
automation:
  file_watchers:
    - pattern: "./services/auth/src/**/*.js"
      command: "docker-pilot restart auth-service"
      debounce: 2000

    - pattern: "./services/products/src/**/*.js"
      command: "docker-pilot restart product-service"
      debounce: 2000

    - pattern: "./services/orders/src/**/*.js"
      command: "docker-pilot restart order-service"
      debounce: 2000
```

## Aplicação Full-Stack

### Stack MEAN/MERN

```yaml
# docker-pilot.yml
version: "1.0"

project:
  name: "fullstack-app"
  description: "Aplicação full-stack com React, Node.js, MongoDB"

services:
  # Frontend React
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:3001
      - REACT_APP_WS_URL=ws://localhost:3001
    depends_on:
      - backend
    networks:
      - frontend

  # Backend Node.js
  backend:
    build: ./backend
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URL=mongodb://mongodb:27017/myapp
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
      - redis
    networks:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Banco MongoDB
  mongodb:
    image: mongo:5
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
      - MONGO_INITDB_DATABASE=myapp
    volumes:
      - mongo_data:/data/db
      - ./mongo-init:/docker-entrypoint-initdb.d
    networks:
      - backend

  # Cache Redis
  redis:
    image: redis:alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - backend

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - frontend

  # Worker para tarefas assíncronas
  worker:
    build: ./backend
    command: npm run worker
    environment:
      - NODE_ENV=production
      - MONGODB_URL=mongodb://mongodb:27017/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    networks:
      - backend
    deploy:
      replicas: 2

volumes:
  mongo_data:
  redis_data:

networks:
  frontend:
  backend:

# Ambiente de desenvolvimento
environments:
  development:
    services:
      frontend:
        build:
          target: development
        volumes:
          - ./frontend:/app
          - /app/node_modules
        command: npm start
        environment:
          - REACT_APP_API_URL=http://localhost:3001
          - CHOKIDAR_USEPOLLING=true

      backend:
        volumes:
          - ./backend:/app
          - /app/node_modules
        command: npm run dev
        environment:
          - NODE_ENV=development
          - DEBUG=*

# Workflows
workflows:
  dev-setup:
    description: "Setup para desenvolvimento"
    steps:
      - name: "Install dependencies"
        commands:
          - "cd frontend && npm install"
          - "cd backend && npm install"

      - name: "Start infrastructure"
        commands:
          - "docker-pilot start mongodb redis"
          - "sleep 10"

      - name: "Initialize database"
        commands:
          - "docker-pilot exec backend npm run db:migrate"
          - "docker-pilot exec backend npm run db:seed"

      - name: "Start application"
        commands:
          - "docker-pilot start backend worker"
          - "docker-pilot start frontend"

  production-deploy:
    description: "Deploy para produção"
    confirmation: true
    steps:
      - name: "Build images"
        commands:
          - "docker-pilot build --no-cache"

      - name: "Run tests"
        commands:
          - "docker-pilot run test-all"

      - name: "Deploy"
        commands:
          - "docker-pilot push"
          - "docker-pilot start --all"

      - name: "Health check"
        commands:
          - "sleep 30"
          - "docker-pilot health --all"

# Comandos personalizados
custom_commands:
  test-all:
    description: "Executar todos os testes"
    parallel:
      - name: "Frontend tests"
        command: "cd frontend && npm test -- --coverage --watchAll=false"
      - name: "Backend tests"
        command: "cd backend && npm test -- --coverage"

  db-backup:
    description: "Backup do banco de dados"
    script: |
      TIMESTAMP=$(date +%Y%m%d_%H%M%S)
      docker-pilot exec mongodb mongodump --out /backup/dump_$TIMESTAMP
      echo "Backup criado: dump_$TIMESTAMP"

  db-restore:
    description: "Restaurar banco de dados"
    options:
      backup_name:
        type: "string"
        required: true
        description: "Nome do backup para restaurar"
    script: |
      docker-pilot exec mongodb mongorestore /backup/$BACKUP_NAME
      echo "Banco restaurado de: $BACKUP_NAME"
```

## Projeto Multi-tenant

### Configuração Multi-tenant

```yaml
# docker-pilot.yml
version: "1.0"

project:
  name: "saas-platform"
  description: "Plataforma SaaS multi-tenant"

services:
  # Load Balancer
  haproxy:
    image: haproxy:2.4
    ports:
      - "80:80"
      - "443:443"
      - "8404:8404"  # Stats
    volumes:
      - ./haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg
    depends_on:
      - app-tenant1
      - app-tenant2
      - app-tenant3
    networks:
      - frontend

  # Aplicação Tenant 1
  app-tenant1:
    build: ./app
    environment:
      - TENANT_ID=tenant1
      - DB_HOST=db-tenant1
      - DB_NAME=tenant1_db
      - REDIS_URL=redis://redis-tenant1:6379
    depends_on:
      - db-tenant1
      - redis-tenant1
    networks:
      - frontend
      - tenant1-backend
    labels:
      - "tenant=tenant1"

  db-tenant1:
    image: postgres:13
    environment:
      - POSTGRES_DB=tenant1_db
      - POSTGRES_USER=tenant1_user
      - POSTGRES_PASSWORD=${TENANT1_DB_PASSWORD}
    volumes:
      - tenant1_data:/var/lib/postgresql/data
    networks:
      - tenant1-backend

  redis-tenant1:
    image: redis:alpine
    volumes:
      - tenant1_redis:/data
    networks:
      - tenant1-backend

  # Aplicação Tenant 2
  app-tenant2:
    build: ./app
    environment:
      - TENANT_ID=tenant2
      - DB_HOST=db-tenant2
      - DB_NAME=tenant2_db
      - REDIS_URL=redis://redis-tenant2:6379
    depends_on:
      - db-tenant2
      - redis-tenant2
    networks:
      - frontend
      - tenant2-backend
    labels:
      - "tenant=tenant2"

  db-tenant2:
    image: postgres:13
    environment:
      - POSTGRES_DB=tenant2_db
      - POSTGRES_USER=tenant2_user
      - POSTGRES_PASSWORD=${TENANT2_DB_PASSWORD}
    volumes:
      - tenant2_data:/var/lib/postgresql/data
    networks:
      - tenant2-backend

  redis-tenant2:
    image: redis:alpine
    volumes:
      - tenant2_redis:/data
    networks:
      - tenant2-backend

  # Aplicação Tenant 3
  app-tenant3:
    build: ./app
    environment:
      - TENANT_ID=tenant3
      - DB_HOST=db-tenant3
      - DB_NAME=tenant3_db
      - REDIS_URL=redis://redis-tenant3:6379
    depends_on:
      - db-tenant3
      - redis-tenant3
    networks:
      - frontend
      - tenant3-backend
    labels:
      - "tenant=tenant3"

  db-tenant3:
    image: postgres:13
    environment:
      - POSTGRES_DB=tenant3_db
      - POSTGRES_USER=tenant3_user
      - POSTGRES_PASSWORD=${TENANT3_DB_PASSWORD}
    volumes:
      - tenant3_data:/var/lib/postgresql/data
    networks:
      - tenant3-backend

  redis-tenant3:
    image: redis:alpine
    volumes:
      - tenant3_redis:/data
    networks:
      - tenant3-backend

  # Serviços compartilhados
  shared-auth:
    build: ./auth-service
    environment:
      - DB_HOST=shared-db
      - DB_NAME=auth_db
    depends_on:
      - shared-db
    networks:
      - frontend
      - shared-backend

  shared-db:
    image: postgres:13
    environment:
      - POSTGRES_DB=auth_db
      - POSTGRES_USER=auth_user
      - POSTGRES_PASSWORD=${SHARED_DB_PASSWORD}
    volumes:
      - shared_data:/var/lib/postgresql/data
    networks:
      - shared-backend

  # Monitoramento centralizado
  monitoring:
    build: ./monitoring
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/config:/etc/monitoring
    networks:
      - frontend
      - tenant1-backend
      - tenant2-backend
      - tenant3-backend
      - shared-backend

volumes:
  tenant1_data:
  tenant1_redis:
  tenant2_data:
  tenant2_redis:
  tenant3_data:
  tenant3_redis:
  shared_data:

networks:
  frontend:
  tenant1-backend:
  tenant2-backend:
  tenant3-backend:
  shared-backend:

# Comandos para gestão de tenants
custom_commands:
  create-tenant:
    description: "Criar novo tenant"
    options:
      tenant_id:
        type: "string"
        required: true
        description: "ID do tenant"
      db_password:
        type: "string"
        required: true
        description: "Senha do banco de dados"
    script: |
      TENANT_ID=$TENANT_ID
      DB_PASSWORD=$DB_PASSWORD

      echo "Criando tenant: $TENANT_ID"

      # Criar rede do tenant
      docker network create ${TENANT_ID}-backend

      # Criar volumes
      docker volume create ${TENANT_ID}_data
      docker volume create ${TENANT_ID}_redis

      # Atualizar docker-pilot.yml com novo tenant
      echo "Tenant $TENANT_ID criado com sucesso!"

  scale-tenant:
    description: "Escalar serviços de um tenant"
    options:
      tenant_id:
        type: "string"
        required: true
        description: "ID do tenant"
      replicas:
        type: "number"
        default: 2
        description: "Número de réplicas"
    script: |
      docker-pilot scale app-$TENANT_ID $REPLICAS
      echo "Tenant $TENANT_ID escalado para $REPLICAS réplicas"

  backup-tenant:
    description: "Backup de um tenant específico"
    options:
      tenant_id:
        type: "string"
        required: true
        description: "ID do tenant"
    script: |
      TIMESTAMP=$(date +%Y%m%d_%H%M%S)

      # Backup do banco
      docker-pilot exec db-$TENANT_ID pg_dump -U ${TENANT_ID}_user ${TENANT_ID}_db > backup_${TENANT_ID}_${TIMESTAMP}.sql

      # Backup do Redis
      docker-pilot exec redis-$TENANT_ID redis-cli BGSAVE
      docker cp redis-$TENANT_ID:/data/dump.rdb backup_${TENANT_ID}_redis_${TIMESTAMP}.rdb

      echo "Backup do tenant $TENANT_ID concluído: ${TIMESTAMP}"

# Workflows específicos
workflows:
  deploy-all-tenants:
    description: "Deploy de todos os tenants"
    steps:
      - name: "Build aplicação"
        commands:
          - "docker-pilot build app"

      - name: "Deploy tenant 1"
        commands:
          - "docker-pilot start db-tenant1 redis-tenant1"
          - "sleep 10"
          - "docker-pilot start app-tenant1"

      - name: "Deploy tenant 2"
        commands:
          - "docker-pilot start db-tenant2 redis-tenant2"
          - "sleep 10"
          - "docker-pilot start app-tenant2"

      - name: "Deploy tenant 3"
        commands:
          - "docker-pilot start db-tenant3 redis-tenant3"
          - "sleep 10"
          - "docker-pilot start app-tenant3"

      - name: "Start load balancer"
        commands:
          - "docker-pilot start haproxy"

# Monitoramento por tenant
monitoring:
  enabled: true

  alerts:
    - name: "tenant_high_cpu"
      condition: "cpu_usage > 80"
      labels: ["tenant"]
      actions: ["scale_tenant"]

    - name: "tenant_down"
      condition: "service_status == 'stopped'"
      labels: ["tenant"]
      actions: ["restart_tenant", "notify_admin"]

# Automação
automation:
  scheduled_tasks:
    - name: "backup-all-tenants"
      schedule: "0 2 * * *"  # 2:00 AM diário
      commands:
        - "docker-pilot run backup-tenant --tenant_id tenant1"
        - "docker-pilot run backup-tenant --tenant_id tenant2"
        - "docker-pilot run backup-tenant --tenant_id tenant3"
```

## Pipeline CI/CD Avançado

### Configuração para GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - build
  - security
  - deploy-staging
  - integration-tests
  - deploy-production

variables:
  DOCKER_PILOT_VERSION: "1.0.0"
  IMAGE_TAG: $CI_COMMIT_SHA

before_script:
  - curl -fsSL https://get.docker-pilot.com | sh
  - docker-pilot --version

# Validação
validate-config:
  stage: validate
  script:
    - docker-pilot config validate
    - docker-pilot config lint
  only:
    - merge_requests
    - main

validate-dockerfile:
  stage: validate
  script:
    - docker run --rm -i hadolint/hadolint < Dockerfile
    - docker-pilot build --dry-run
  only:
    - merge_requests
    - main

# Testes
unit-tests:
  stage: test
  services:
    - postgres:13
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_password
  script:
    - docker-pilot workflow run test-unit
  coverage: '/Coverage: \d+\.\d+%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

integration-tests:
  stage: test
  script:
    - docker-pilot workflow run test-integration
  artifacts:
    reports:
      junit: test-results.xml

# Build
build-images:
  stage: build
  script:
    - docker-pilot build --parallel --tag $IMAGE_TAG
    - docker-pilot push --tag $IMAGE_TAG --registry $CI_REGISTRY
  only:
    - main
    - develop

# Segurança
security-scan:
  stage: security
  script:
    - docker run --rm -v /var/run/docker.sock:/var/run/docker.sock
      aquasec/trivy image myapp:$IMAGE_TAG
    - docker-pilot security scan --all
  only:
    - main

# Deploy Staging
deploy-staging:
  stage: deploy-staging
  environment:
    name: staging
    url: https://staging.myapp.com
  script:
    - docker-pilot config set environment staging
    - docker-pilot workflow run deploy-staging
    - docker-pilot health --timeout 300s
  only:
    - develop

# Testes de integração em staging
staging-integration-tests:
  stage: integration-tests
  script:
    - docker-pilot run e2e-tests --environment staging
  only:
    - develop
  needs: ["deploy-staging"]

# Deploy Produção
deploy-production:
  stage: deploy-production
  environment:
    name: production
    url: https://myapp.com
  script:
    - docker-pilot config set environment production
    - docker-pilot workflow run deploy-production
    - docker-pilot health --timeout 600s
  when: manual
  only:
    - main
  needs: ["deploy-staging", "staging-integration-tests"]

# Jobs de cleanup
cleanup:
  stage: deploy-production
  script:
    - docker-pilot system prune --force
    - docker-pilot volume prune --force
  when: always
```

### Configuração de Workflows

```yaml
# docker-pilot.yml (workflows avançados)
workflows:
  test-unit:
    description: "Testes unitários"
    steps:
      - name: "Prepare test environment"
        commands:
          - "docker-pilot start test-db"
          - "sleep 5"

      - name: "Run unit tests"
        commands:
          - "npm test -- --coverage"

      - name: "Generate reports"
        commands:
          - "npm run test:report"

  test-integration:
    description: "Testes de integração"
    steps:
      - name: "Start test stack"
        commands:
          - "docker-pilot start --profile test"
          - "sleep 30"

      - name: "Run migrations"
        commands:
          - "docker-pilot exec api npm run migrate"

      - name: "Run integration tests"
        commands:
          - "npm run test:integration"

      - name: "Cleanup"
        commands:
          - "docker-pilot stop --all"
        on_failure: true

  deploy-staging:
    description: "Deploy para staging"
    steps:
      - name: "Pre-deploy checks"
        commands:
          - "docker-pilot health --environment staging"
          - "docker-pilot config validate --environment staging"

      - name: "Blue-green deployment"
        commands:
          - "docker-pilot deploy blue --environment staging"
          - "docker-pilot health --timeout 300s blue"
          - "docker-pilot switch blue green --environment staging"

      - name: "Post-deploy verification"
        commands:
          - "docker-pilot run smoke-tests --environment staging"
          - "docker-pilot monitor start --environment staging"

  deploy-production:
    description: "Deploy para produção"
    confirmation: true
    steps:
      - name: "Pre-production checks"
        commands:
          - "docker-pilot security scan --all"
          - "docker-pilot config validate --environment production"
          - "docker-pilot backup --all"

      - name: "Rolling deployment"
        commands:
          - "docker-pilot deploy rolling --environment production --batch-size 2"
          - "docker-pilot health --timeout 600s"

      - name: "Post-deployment"
        commands:
          - "docker-pilot run smoke-tests --environment production"
          - "docker-pilot notify 'Production deployment successful'"
        rollback_on_error:
          - "docker-pilot rollback --environment production"
          - "docker-pilot notify 'Production deployment failed - rolled back'"

  e2e-tests:
    description: "Testes end-to-end"
    options:
      environment:
        type: "string"
        default: "staging"
        choices: ["staging", "production"]
    steps:
      - name: "Setup E2E environment"
        commands:
          - "docker-pilot run setup-e2e-data --environment $ENVIRONMENT"

      - name: "Run E2E tests"
        commands:
          - "cypress run --env environment=$ENVIRONMENT"

      - name: "Generate E2E reports"
        commands:
          - "npm run e2e:report"
        on_failure: true
```

## Veja Também

- [Exemplos Básicos](basic.md)
- [Projetos](projects.md)
- [Plugins](plugins.md)
- [Configuração](../user-guide/config-files.md)
