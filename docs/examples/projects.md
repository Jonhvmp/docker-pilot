# Project Examples

This section presents complete projects using Docker Pilot, from simple applications to complex architectures.

## Personal Blog (WordPress + MySQL)

### Project Structure

```
personal-blog/
├── docker-pilot.yml
├── .env.example
├── wordpress/
│   ├── themes/
│   └── plugins/
├── mysql/
│   └── init/
└── nginx/
    └── nginx.conf
```

### Main Configuration

```yaml
# docker-pilot.yml
version: "1.0"

project:
  name: "personal-blog"
  description: "Personal blog with WordPress and MySQL"

services:
  wordpress:
    image: wordpress:6.3-php8.1-fpm
    environment:
      - WORDPRESS_DB_HOST=mysql
      - WORDPRESS_DB_NAME=wordpress
      - WORDPRESS_DB_USER=wp_user
      - WORDPRESS_DB_PASSWORD=${WP_DB_PASSWORD}
      - WORDPRESS_TABLE_PREFIX=wp_
    volumes:
      - wordpress_data:/var/www/html
      - ./wordpress/themes:/var/www/html/wp-content/themes
      - ./wordpress/plugins:/var/www/html/wp-content/plugins
    depends_on:
      - mysql
    networks:
      - backend

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=wordpress
      - MYSQL_USER=wp_user
      - MYSQL_PASSWORD=${WP_DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d
    networks:
      - backend
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 30s
      timeout: 10s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - wordpress_data:/var/www/html
    depends_on:
      - wordpress
    networks:
      - backend

  backup:
    image: mysql:8.0
    profiles:
      - backup
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backups:/backups
    networks:
      - backend
    command: /bin/bash -c "sleep infinity"

volumes:
  wordpress_data:
  mysql_data:

networks:
  backend:

# Comandos personalizados
custom_commands:
  backup-db:
    description: "Backup do banco de dados"
    script: |
      TIMESTAMP=$(date +%Y%m%d_%H%M%S)
      docker-pilot exec mysql mysqldump -u wp_user -p${WP_DB_PASSWORD} wordpress > ./backups/wordpress_${TIMESTAMP}.sql
      echo "Backup criado: wordpress_${TIMESTAMP}.sql"

  restore-db:
    description: "Restaurar banco de dados"
    options:
      backup_file:
        type: "string"
        required: true
        description: "Nome do arquivo de backup"
    script: |
      docker-pilot exec mysql mysql -u wp_user -p${WP_DB_PASSWORD} wordpress < ./backups/${BACKUP_FILE}
      echo "Banco restaurado de: ${BACKUP_FILE}"

  install-plugin:
    description: "Instalar plugin WordPress"
    options:
      plugin_name:
        type: "string"
        required: true
        description: "Nome do plugin"
    script: |
      docker-pilot exec wordpress wp plugin install ${PLUGIN_NAME} --activate
      echo "Plugin ${PLUGIN_NAME} instalado e ativado"

  update-all:
    description: "Atualizar WordPress e plugins"
    script: |
      docker-pilot exec wordpress wp core update
      docker-pilot exec wordpress wp plugin update --all
      docker-pilot exec wordpress wp theme update --all
      echo "Atualizações concluídas"

# Workflows
workflows:
  setup:
    description: "Setup inicial do blog"
    steps:
      - name: "Start database"
        commands:
          - "docker-pilot start mysql"
          - "sleep 30"

      - name: "Start WordPress"
        commands:
          - "docker-pilot start wordpress"
          - "sleep 15"

      - name: "Start Nginx"
        commands:
          - "docker-pilot start nginx"

      - name: "Install WP-CLI"
        commands:
          - "docker-pilot exec wordpress curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/v2.8.1/phar/wp-cli.phar"
          - "docker-pilot exec wordpress chmod +x wp-cli.phar"
          - "docker-pilot exec wordpress mv wp-cli.phar /usr/local/bin/wp"

  backup-full:
    description: "Backup completo (DB + arquivos)"
    steps:
      - name: "Backup database"
        commands:
          - "docker-pilot run backup-db"

      - name: "Backup files"
        script: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          tar -czf ./backups/wordpress_files_${TIMESTAMP}.tar.gz -C /var/lib/docker/volumes/blog-pessoal_wordpress_data/_data .
          echo "Backup de arquivos criado: wordpress_files_${TIMESTAMP}.tar.gz"

# Monitoramento
monitoring:
  enabled: true
  health_checks:
    - name: "wordpress_health"
      url: "http://localhost/wp-admin/admin-ajax.php?action=heartbeat"
      interval: 60s

    - name: "mysql_health"
      command: "docker-pilot exec mysql mysqladmin ping"
      interval: 30s

# Automação
automation:
  scheduled_tasks:
    - name: "daily_backup"
      schedule: "0 2 * * *"
      command: "docker-pilot workflow run backup-full"

    - name: "weekly_update"
      schedule: "0 3 * * 0"
      command: "docker-pilot run update-all"
```

### Arquivo de Configuração Nginx

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /var/www/html;
        index index.php index.html index.htm;

        location / {
            try_files $uri $uri/ /index.php?$args;
        }

        location ~ \.php$ {
            fastcgi_pass wordpress:9000;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## E-commerce (Magento + MySQL + Redis)

### Estrutura do Projeto

```
ecommerce/
├── docker-pilot.yml
├── docker-pilot.prod.yml
├── .env.example
├── magento/
│   ├── app/
│   ├── var/
│   └── pub/
├── mysql/
│   └── init/
├── redis/
│   └── redis.conf
└── nginx/
    ├── nginx.conf
    └── ssl/
```

### Configuração Principal

```yaml
# docker-pilot.yml
version: "1.0"

project:
  name: "ecommerce-magento"
  description: "Loja virtual com Magento 2"

services:
  magento:
    image: magento/magento-cloud-docker-php:8.1-fpm
    environment:
      - MAGENTO_CLOUD_VARIABLES={"ADMIN_EMAIL":"admin@example.com"}
      - MAGENTO_CLOUD_RELATIONSHIPS={"database":"mysql","redis":"redis"}
      - MAGENTO_CLOUD_ROUTES={"http://localhost/":"magento"}
    volumes:
      - magento_data:/var/www/html
      - ./magento/app:/var/www/html/app
      - ./magento/var:/var/www/html/var
      - ./magento/pub:/var/www/html/pub
    depends_on:
      - mysql
      - redis
      - elasticsearch
    networks:
      - backend

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=magento
      - MYSQL_USER=magento_user
      - MYSQL_PASSWORD=${MAGENTO_DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d
    networks:
      - backend
    command: --default-authentication-plugin=mysql_native_password

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
    networks:
      - backend
    command: redis-server /usr/local/etc/redis/redis.conf

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - magento_data:/var/www/html
    depends_on:
      - magento
    networks:
      - backend

  mailhog:
    image: mailhog/mailhog
    ports:
      - "8025:8025"
    networks:
      - backend

  varnish:
    image: varnish:7.0
    ports:
      - "8080:80"
    volumes:
      - ./varnish/default.vcl:/etc/varnish/default.vcl
    depends_on:
      - nginx
    networks:
      - backend
    command: varnishd -F -f /etc/varnish/default.vcl -a :80 -T :6082

volumes:
  magento_data:
  mysql_data:
  redis_data:
  elasticsearch_data:

networks:
  backend:

# Comandos personalizados
custom_commands:
  magento-install:
    description: "Instalar Magento"
    script: |
      docker-pilot exec magento bin/magento setup:install \
        --base-url=http://localhost/ \
        --db-host=mysql \
        --db-name=magento \
        --db-user=magento_user \
        --db-password=${MAGENTO_DB_PASSWORD} \
        --admin-firstname=Admin \
        --admin-lastname=User \
        --admin-email=admin@example.com \
        --admin-user=admin \
        --admin-password=${ADMIN_PASSWORD} \
        --language=pt_BR \
        --currency=BRL \
        --timezone=America/Sao_Paulo \
        --use-rewrites=1 \
        --search-engine=elasticsearch7 \
        --elasticsearch-host=elasticsearch \
        --elasticsearch-port=9200

  magento-cache:
    description: "Gerenciar cache do Magento"
    options:
      action:
        type: "string"
        choices: ["clean", "flush", "status", "enable", "disable"]
        default: "clean"
        description: "Ação do cache"
    script: |
      case $ACTION in
        "clean")
          docker-pilot exec magento bin/magento cache:clean
          ;;
        "flush")
          docker-pilot exec magento bin/magento cache:flush
          ;;
        "status")
          docker-pilot exec magento bin/magento cache:status
          ;;
        "enable")
          docker-pilot exec magento bin/magento cache:enable
          ;;
        "disable")
          docker-pilot exec magento bin/magento cache:disable
          ;;
      esac

  magento-reindex:
    description: "Reindexar Magento"
    script: |
      docker-pilot exec magento bin/magento indexer:reindex
      echo "Reindexação concluída"

  magento-deploy:
    description: "Deploy de arquivos estáticos"
    options:
      mode:
        type: "string"
        choices: ["developer", "production"]
        default: "developer"
        description: "Modo de deploy"
    script: |
      docker-pilot exec magento bin/magento deploy:mode:set $MODE
      docker-pilot exec magento bin/magento setup:static-content:deploy pt_BR
      docker-pilot exec magento bin/magento setup:di:compile

  import-products:
    description: "Importar produtos"
    options:
      csv_file:
        type: "string"
        required: true
        description: "Arquivo CSV com produtos"
    script: |
      docker cp ${CSV_FILE} magento:/var/www/html/var/import/products.csv
      docker-pilot exec magento bin/magento import:run products

# Workflows
workflows:
  setup-complete:
    description: "Setup completo do e-commerce"
    steps:
      - name: "Start infrastructure"
        commands:
          - "docker-pilot start mysql redis elasticsearch"
          - "sleep 60"

      - name: "Start Magento"
        commands:
          - "docker-pilot start magento"
          - "sleep 30"

      - name: "Install Magento"
        commands:
          - "docker-pilot run magento-install"

      - name: "Configure Magento"
        commands:
          - "docker-pilot run magento-cache --action enable"
          - "docker-pilot run magento-reindex"
          - "docker-pilot run magento-deploy --mode production"

      - name: "Start web services"
        commands:
          - "docker-pilot start nginx varnish mailhog"

  production-deploy:
    description: "Deploy para produção"
    confirmation: true
    steps:
      - name: "Maintenance mode"
        commands:
          - "docker-pilot exec magento bin/magento maintenance:enable"

      - name: "Update code"
        commands:
          - "git pull origin main"
          - "docker-pilot exec magento composer install --no-dev --optimize-autoloader"

      - name: "Deploy"
        commands:
          - "docker-pilot run magento-deploy --mode production"
          - "docker-pilot run magento-reindex"
          - "docker-pilot run magento-cache --action flush"

      - name: "Disable maintenance"
        commands:
          - "docker-pilot exec magento bin/magento maintenance:disable"

# Monitoramento
monitoring:
  enabled: true
  health_checks:
    - name: "magento_health"
      url: "http://localhost/health_check.php"
      interval: 60s

    - name: "mysql_health"
      command: "docker-pilot exec mysql mysqladmin ping"
      interval: 30s

    - name: "elasticsearch_health"
      url: "http://elasticsearch:9200/_cluster/health"
      interval: 60s

  alerts:
    - name: "high_response_time"
      condition: "response_time > 5000"
      actions: ["email", "slack"]

    - name: "low_disk_space"
      condition: "disk_usage > 85"
      actions: ["email", "cleanup"]
```

## Sistema de Chat (Node.js + Redis + MongoDB)

### Estrutura do Projeto

```
chat-system/
├── docker-pilot.yml
├── docker-pilot.dev.yml
├── .env.example
├── backend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
└── monitoring/
    ├── prometheus.yml
    └── grafana/
```

### Configuração Principal

```yaml
# docker-pilot.yml
version: "1.0"

project:
  name: "chat-system"
  description: "Sistema de chat em tempo real"

services:
  # Backend API
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - MONGODB_URL=mongodb://mongodb:27017/chat
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - PORT=3000
    depends_on:
      - mongodb
      - redis
    networks:
      - backend
    deploy:
      replicas: 3
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build: ./frontend
    environment:
      - REACT_APP_API_URL=http://localhost/api
      - REACT_APP_WS_URL=ws://localhost/ws
    networks:
      - frontend

  # Banco de dados
  mongodb:
    image: mongo:6.0
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
      - MONGO_INITDB_DATABASE=chat
    volumes:
      - mongodb_data:/data/db
      - ./mongodb/init:/docker-entrypoint-initdb.d
    networks:
      - backend

  # Cache e pub/sub
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - backend

  # Load balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    networks:
      - frontend
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
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    networks:
      - backend

  # Workers para processamento
  message-processor:
    build: ./backend
    command: npm run worker:messages
    environment:
      - NODE_ENV=production
      - MONGODB_URL=mongodb://mongodb:27017/chat
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    networks:
      - backend
    deploy:
      replicas: 2

  notification-service:
    build: ./backend
    command: npm run worker:notifications
    environment:
      - NODE_ENV=production
      - MONGODB_URL=mongodb://mongodb:27017/chat
      - REDIS_URL=redis://redis:6379
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    depends_on:
      - mongodb
      - redis
    networks:
      - backend

volumes:
  mongodb_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  frontend:
  backend:

# Comandos personalizados
custom_commands:
  db-seed:
    description: "Popular banco com dados de teste"
    script: |
      docker-pilot exec backend npm run db:seed
      echo "Banco populado com dados de teste"

  create-room:
    description: "Criar sala de chat"
    options:
      name:
        type: "string"
        required: true
        description: "Nome da sala"
      description:
        type: "string"
        description: "Descrição da sala"
    script: |
      docker-pilot exec backend node scripts/create-room.js --name "$NAME" --description "$DESCRIPTION"
      echo "Sala '$NAME' criada com sucesso"

  stats:
    description: "Estatísticas do sistema"
    script: |
      echo "=== Estatísticas do Chat ==="
      echo "Usuários online: $(docker-pilot exec backend node scripts/stats.js --metric online-users)"
      echo "Mensagens hoje: $(docker-pilot exec backend node scripts/stats.js --metric messages-today)"
      echo "Salas ativas: $(docker-pilot exec backend node scripts/stats.js --metric active-rooms)"

  load-test:
    description: "Teste de carga"
    options:
      concurrent_users:
        type: "number"
        default: 100
        description: "Número de usuários simultâneos"
      duration:
        type: "string"
        default: "5m"
        description: "Duração do teste"
    script: |
      docker run --rm --network chat-system_backend \
        loadimpact/k6 run \
        --vus $CONCURRENT_USERS \
        --duration $DURATION \
        /scripts/load-test.js

  backup-messages:
    description: "Backup das mensagens"
    script: |
      TIMESTAMP=$(date +%Y%m%d_%H%M%S)
      docker-pilot exec mongodb mongodump --db chat --collection messages --out /backup/messages_$TIMESTAMP
      echo "Backup das mensagens: messages_$TIMESTAMP"

# Workflows
workflows:
  dev-setup:
    description: "Setup ambiente de desenvolvimento"
    steps:
      - name: "Start infrastructure"
        commands:
          - "docker-pilot start mongodb redis"
          - "sleep 15"

      - name: "Run migrations"
        commands:
          - "docker-pilot exec backend npm run db:migrate"

      - name: "Seed database"
        commands:
          - "docker-pilot run db-seed"

      - name: "Start services"
        commands:
          - "docker-pilot start backend message-processor notification-service"
          - "docker-pilot start frontend nginx"

  production-deploy:
    description: "Deploy para produção"
    confirmation: true
    steps:
      - name: "Pre-deploy checks"
        commands:
          - "docker-pilot run load-test --concurrent_users 50 --duration 1m"
          - "docker-pilot health --all"

      - name: "Backup data"
        commands:
          - "docker-pilot run backup-messages"

      - name: "Rolling deployment"
        commands:
          - "docker-pilot deploy rolling --batch-size 1"
          - "docker-pilot health --timeout 300s"

      - name: "Post-deploy verification"
        commands:
          - "docker-pilot run stats"
          - "docker-pilot run load-test --concurrent_users 10 --duration 30s"

  scale-up:
    description: "Escalar sistema para alta demanda"
    steps:
      - name: "Scale backend"
        commands:
          - "docker-pilot scale backend 5"

      - name: "Scale workers"
        commands:
          - "docker-pilot scale message-processor 3"
          - "docker-pilot scale notification-service 2"

      - name: "Update load balancer"
        commands:
          - "docker-pilot restart nginx"

# Monitoramento
monitoring:
  enabled: true

  metrics:
    - name: "active_connections"
      command: "docker-pilot exec backend node scripts/metrics.js --metric connections"
      interval: 30s

    - name: "messages_per_minute"
      command: "docker-pilot exec backend node scripts/metrics.js --metric messages-rate"
      interval: 60s

    - name: "redis_memory"
      command: "docker-pilot exec redis redis-cli info memory | grep used_memory_human"
      interval: 60s

  alerts:
    - name: "high_connections"
      condition: "active_connections > 1000"
      actions: ["scale_backend", "slack"]

    - name: "high_message_rate"
      condition: "messages_per_minute > 10000"
      actions: ["scale_workers", "email"]

    - name: "redis_memory_high"
      condition: "redis_memory > 1GB"
      actions: ["cleanup_redis", "email"]

# Automação
automation:
  scheduled_tasks:
    - name: "daily_backup"
      schedule: "0 2 * * *"
      command: "docker-pilot run backup-messages"

    - name: "weekly_stats"
      schedule: "0 9 * * 1"
      command: "docker-pilot run stats"

    - name: "cleanup_old_messages"
      schedule: "0 3 * * *"
      command: "docker-pilot exec backend node scripts/cleanup-old-messages.js"

  file_watchers:
    - pattern: "./backend/src/**/*.js"
      command: "docker-pilot restart backend"
      debounce: 2000

    - pattern: "./frontend/src/**/*.js"
      command: "docker-pilot restart frontend"
      debounce: 2000
```

### Configuração de Desenvolvimento

```yaml
# docker-pilot.dev.yml
extends:
  file: docker-pilot.yml

services:
  backend:
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev
    environment:
      - NODE_ENV=development
      - DEBUG=*
    ports:
      - "3000:3000"

  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm start
    environment:
      - CHOKIDAR_USEPOLLING=true
    ports:
      - "3001:3000"

  # Remover nginx em desenvolvimento
  nginx:
    profiles:
      - production

# Comandos específicos para dev
custom_commands:
  dev-logs:
    description: "Logs de desenvolvimento"
    script: |
      docker-pilot logs backend frontend --follow --merge

  dev-test:
    description: "Executar testes em desenvolvimento"
    script: |
      docker-pilot exec backend npm test -- --watch
```

## Sistema de Análise de Dados (Python + Jupyter + PostgreSQL)

### Estrutura do Projeto

```
data-analytics/
├── docker-pilot.yml
├── .env.example
├── notebooks/
│   ├── exploratory/
│   └── reports/
├── scripts/
│   ├── etl/
│   └── analysis/
├── data/
│   ├── raw/
│   └── processed/
└── postgres/
    └── init/
```

### Configuração Principal

```yaml
# docker-pilot.yml
version: "1.0"

project:
  name: "data-analytics"
  description: "Sistema de análise de dados"

services:
  # Jupyter Lab
  jupyter:
    image: jupyter/datascience-notebook:latest
    ports:
      - "8888:8888"
    environment:
      - JUPYTER_ENABLE_LAB=yes
      - JUPYTER_TOKEN=${JUPYTER_TOKEN}
    volumes:
      - ./notebooks:/home/jovyan/work/notebooks
      - ./data:/home/jovyan/work/data
      - ./scripts:/home/jovyan/work/scripts
    networks:
      - analytics

  # PostgreSQL
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=analytics
      - POSTGRES_USER=analyst
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d
      - ./data:/data
    networks:
      - analytics
    ports:
      - "5432:5432"

  # Apache Airflow
  airflow-webserver:
    image: apache/airflow:2.7.0
    environment:
      - AIRFLOW__CORE__EXECUTOR=LocalExecutor
      - AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://airflow:airflow@postgres:5432/airflow
      - AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION=true
      - AIRFLOW__CORE__LOAD_EXAMPLES=false
    volumes:
      - ./airflow/dags:/opt/airflow/dags
      - ./airflow/logs:/opt/airflow/logs
      - ./airflow/plugins:/opt/airflow/plugins
      - ./data:/data
    ports:
      - "8080:8080"
    networks:
      - analytics
    depends_on:
      - postgres
    command: webserver

  airflow-scheduler:
    image: apache/airflow:2.7.0
    environment:
      - AIRFLOW__CORE__EXECUTOR=LocalExecutor
      - AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://airflow:airflow@postgres:5432/airflow
    volumes:
      - ./airflow/dags:/opt/airflow/dags
      - ./airflow/logs:/opt/airflow/logs
      - ./airflow/plugins:/opt/airflow/plugins
      - ./data:/data
    networks:
      - analytics
    depends_on:
      - postgres
    command: scheduler

  # Apache Superset
  superset:
    image: apache/superset:latest
    ports:
      - "8088:8088"
    environment:
      - SUPERSET_SECRET_KEY=${SUPERSET_SECRET_KEY}
    volumes:
      - superset_data:/app/superset_home
    networks:
      - analytics
    depends_on:
      - postgres

  # MinIO (S3 compatible)
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
    volumes:
      - minio_data:/data
    networks:
      - analytics
    command: server /data --console-address ":9001"

  # Redis para cache
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - analytics

  # Metabase
  metabase:
    image: metabase/metabase:latest
    ports:
      - "3000:3000"
    environment:
      - MB_DB_TYPE=postgres
      - MB_DB_DBNAME=metabase
      - MB_DB_PORT=5432
      - MB_DB_USER=metabase
      - MB_DB_PASS=${METABASE_DB_PASSWORD}
      - MB_DB_HOST=postgres
    networks:
      - analytics
    depends_on:
      - postgres

volumes:
  postgres_data:
  superset_data:
  minio_data:
  redis_data:

networks:
  analytics:

# Comandos personalizados
custom_commands:
  run-analysis:
    description: "Executar análise específica"
    options:
      notebook:
        type: "string"
        required: true
        description: "Nome do notebook"
    script: |
      docker-pilot exec jupyter jupyter nbconvert --execute --to notebook --inplace /home/jovyan/work/notebooks/${NOTEBOOK}.ipynb
      echo "Análise executada: ${NOTEBOOK}"

  export-data:
    description: "Exportar dados do PostgreSQL"
    options:
      table:
        type: "string"
        required: true
        description: "Nome da tabela"
      format:
        type: "string"
        choices: ["csv", "json", "parquet"]
        default: "csv"
        description: "Formato de exportação"
    script: |
      case $FORMAT in
        "csv")
          docker-pilot exec postgres psql -U analyst -d analytics -c "\copy ${TABLE} TO '/data/exports/${TABLE}.csv' DELIMITER ',' CSV HEADER"
          ;;
        "json")
          docker-pilot exec postgres psql -U analyst -d analytics -c "SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM ${TABLE}) t" -t -o /data/exports/${TABLE}.json
          ;;
        "parquet")
          docker-pilot exec jupyter python -c "
import pandas as pd
import psycopg2
conn = psycopg2.connect(host='postgres', database='analytics', user='analyst', password='${POSTGRES_PASSWORD}')
df = pd.read_sql('SELECT * FROM ${TABLE}', conn)
df.to_parquet('/home/jovyan/work/data/exports/${TABLE}.parquet')
"
          ;;
      esac
      echo "Dados exportados: ${TABLE}.${FORMAT}"

  run-etl:
    description: "Executar pipeline ETL"
    options:
      pipeline:
        type: "string"
        required: true
        description: "Nome do pipeline"
    script: |
      docker-pilot exec jupyter python /home/jovyan/work/scripts/etl/${PIPELINE}.py
      echo "ETL executado: ${PIPELINE}"

  generate-report:
    description: "Gerar relatório"
    options:
      report_type:
        type: "string"
        choices: ["daily", "weekly", "monthly"]
        required: true
        description: "Tipo de relatório"
    script: |
      TIMESTAMP=$(date +%Y%m%d_%H%M%S)
      docker-pilot exec jupyter jupyter nbconvert --execute --to html /home/jovyan/work/notebooks/reports/${REPORT_TYPE}_report.ipynb --output /home/jovyan/work/data/reports/${REPORT_TYPE}_report_${TIMESTAMP}.html
      echo "Relatório gerado: ${REPORT_TYPE}_report_${TIMESTAMP}.html"

  backup-data:
    description: "Backup completo dos dados"
    script: |
      TIMESTAMP=$(date +%Y%m%d_%H%M%S)

      # Backup PostgreSQL
      docker-pilot exec postgres pg_dump -U analyst analytics > ./backups/postgres_${TIMESTAMP}.sql

      # Backup MinIO
      docker-pilot exec minio mc mirror /data ./backups/minio_${TIMESTAMP}/

      # Backup notebooks
      tar -czf ./backups/notebooks_${TIMESTAMP}.tar.gz notebooks/

      echo "Backup completo criado: ${TIMESTAMP}"

# Workflows
workflows:
  setup-environment:
    description: "Setup completo do ambiente de análise"
    steps:
      - name: "Start infrastructure"
        commands:
          - "docker-pilot start postgres redis minio"
          - "sleep 30"

      - name: "Initialize databases"
        commands:
          - "docker-pilot exec postgres createdb -U analyst metabase"
          - "docker-pilot exec postgres createdb -U analyst airflow"

      - name: "Start Airflow"
        commands:
          - "docker-pilot exec airflow-webserver airflow db init"
          - "docker-pilot start airflow-webserver airflow-scheduler"

      - name: "Start analysis tools"
        commands:
          - "docker-pilot start jupyter superset metabase"

      - name: "Setup MinIO buckets"
        commands:
          - "docker-pilot exec minio mc config host add local http://localhost:9000 ${MINIO_USER} ${MINIO_PASSWORD}"
          - "docker-pilot exec minio mc mb local/raw-data"
          - "docker-pilot exec minio mc mb local/processed-data"

  daily-analysis:
    description: "Análise diária automatizada"
    steps:
      - name: "Extract data"
        commands:
          - "docker-pilot run run-etl --pipeline daily_extract"

      - name: "Process data"
        commands:
          - "docker-pilot run run-analysis --notebook daily_processing"

      - name: "Generate reports"
        commands:
          - "docker-pilot run generate-report --report_type daily"

      - name: "Update dashboards"
        commands:
          - "docker-pilot exec superset superset refresh-dashboards"

# Monitoramento
monitoring:
  enabled: true

  metrics:
    - name: "postgres_connections"
      command: "docker-pilot exec postgres psql -U analyst -d analytics -c 'SELECT count(*) FROM pg_stat_activity' -t"
      interval: 60s

    - name: "disk_usage"
      command: "df -h /data | tail -1 | awk '{print $5}' | sed 's/%//'"
      interval: 300s

  alerts:
    - name: "high_disk_usage"
      condition: "disk_usage > 85"
      actions: ["cleanup", "email"]

    - name: "postgres_overload"
      condition: "postgres_connections > 50"
      actions: ["email", "slack"]

# Automação
automation:
  scheduled_tasks:
    - name: "daily_analysis"
      schedule: "0 6 * * *"
      command: "docker-pilot workflow run daily-analysis"

    - name: "weekly_backup"
      schedule: "0 2 * * 0"
      command: "docker-pilot run backup-data"

    - name: "monthly_report"
      schedule: "0 9 1 * *"
      command: "docker-pilot run generate-report --report_type monthly"
```

## Veja Também

- [Exemplos Básicos](basic.md)
- [Exemplos Avançados](advanced.md)
- [Plugins](plugins.md)
- [Configuração](../user-guide/config-files.md)
