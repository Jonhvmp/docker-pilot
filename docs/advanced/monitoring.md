# Monitoring

Docker Pilot offers a complete monitoring system to track the health, performance and status of your services in real time.

## Overview

The monitoring system includes:

- **Real-time dashboard**
- **Performance metrics**
- **Automated health checks**
- **Alert system**
- **Centralized logs**
- **Relatórios e analytics**

## Dashboard

### Acessando o Dashboard

```bash
# Iniciar dashboard
docker-pilot monitor dashboard

# Dashboard com porta específica
docker-pilot monitor dashboard --port 8080

# Dashboard com autenticação
docker-pilot monitor dashboard --auth
```

### Configuração do Dashboard

```yaml
# docker-pilot.yml
monitoring:
  dashboard:
    enabled: true
    port: 3030
    host: "0.0.0.0"

    # Autenticação
    auth:
      enabled: true
      username: "${DASHBOARD_USER}"
      password: "${DASHBOARD_PASS}"

    # Configurações visuais
    theme: "dark"  # dark, light, auto
    refresh_interval: 5000  # ms

    # Seções habilitadas
    sections:
      - "overview"
      - "services"
      - "metrics"
      - "logs"
      - "alerts"

    # Personalização
    title: "Docker Pilot - ${PROJECT_NAME}"
    logo: "./assets/logo.png"
```

### Interface do Dashboard

O dashboard apresenta:

```
┌─────────────────────────────────────────────────┐
│              Docker Pilot Monitor               │
├─────────────────────────────────────────────────┤
│ 📊 Overview                                     │
│   • Services: 5 (4 running, 1 stopped)        │
│   • CPU: 45%  Memory: 2.1GB/8GB  Disk: 67%    │
│   • Network I/O: ↑125MB ↓89MB                  │
│                                                 │
│ 🚀 Services Status                              │
│   ✅ api         (2 replicas)  CPU: 12%  Mem: 256MB │
│   ✅ database    (1 replica)   CPU: 8%   Mem: 512MB │
│   ✅ redis       (1 replica)   CPU: 2%   Mem: 64MB  │
│   ✅ frontend    (1 replica)   CPU: 15%  Mem: 128MB │
│   ❌ worker      (stopped)     -         -          │
│                                                 │
│ 📈 Metrics (Last 1h)                           │
│   [CPU Usage Graph]                             │
│   [Memory Usage Graph]                          │
│   [Network I/O Graph]                           │
│                                                 │
│ 🚨 Recent Alerts                                │
│   • High CPU usage on api (15:30)              │
│   • Disk space warning (14:45)                 │
└─────────────────────────────────────────────────┘
```

## Métricas

### Tipos de Métricas

```yaml
# docker-pilot.yml
monitoring:
  metrics:
    # Métricas de sistema
    system:
      - cpu_usage
      - memory_usage
      - disk_usage
      - network_io
      - load_average

    # Métricas de contêiner
    container:
      - cpu_percent
      - memory_usage
      - memory_limit
      - network_rx_bytes
      - network_tx_bytes
      - block_io_read
      - block_io_write

    # Métricas customizadas
    custom:
      - name: "response_time"
        url: "http://localhost:3000/metrics"
        path: "response_time_ms"

      - name: "active_connections"
        command: "netstat -an | grep ESTABLISHED | wc -l"
```

### Coleta de Métricas

```bash
# Ver métricas atuais
docker-pilot metrics

# Métricas em formato JSON
docker-pilot metrics --format json

# Métricas de serviço específico
docker-pilot metrics api

# Métricas históricas
docker-pilot metrics --since "1h"
docker-pilot metrics --range "2023-01-01" "2023-01-31"

# Exportar métricas
docker-pilot metrics --export ./metrics.json
```

### Métricas Personalizadas

```yaml
# docker-pilot.yml
monitoring:
  custom_metrics:
    # Métrica HTTP
    api_response_time:
      type: "http"
      url: "http://localhost:3000/health"
      timeout: 5s
      interval: 30s
      extract:
        response_time: "$.response_time"
        status_code: "$.status"

    # Métrica de comando
    queue_size:
      type: "command"
      command: "redis-cli llen myqueue"
      interval: 60s
      parser: "integer"

    # Métrica de arquivo
    log_errors:
      type: "file"
      path: "./logs/app.log"
      pattern: "ERROR"
      interval: 300s
      action: "count"
```

## Health Checks

### Configuração de Health Checks

```yaml
# docker-pilot.yml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    # Health check personalizado
    custom_health_checks:
      - name: "database_connection"
        command: "npm run health:db"
        interval: 60s
        timeout: 15s

      - name: "external_api"
        url: "https://api.external.com/health"
        method: "GET"
        timeout: 5s
        expected_status: 200
```

### Health Check Avançado

```yaml
monitoring:
  health_checks:
    # Health check de URL
    - name: "api_health"
      type: "http"
      url: "http://localhost:3000/health"
      method: "GET"
      timeout: 5s
      interval: 30s
      headers:
        Authorization: "Bearer ${API_TOKEN}"
      expected:
        status: 200
        body_contains: "ok"

    # Health check de TCP
    - name: "database_port"
      type: "tcp"
      host: "localhost"
      port: 5432
      timeout: 3s
      interval: 60s

    # Health check de comando
    - name: "disk_space"
      type: "command"
      command: "df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1"
      interval: 300s
      condition: "< 90"

    # Health check de processo
    - name: "nginx_process"
      type: "process"
      process: "nginx"
      interval: 60s
```

### Comandos de Health Check

```bash
# Verificar saúde de todos os serviços
docker-pilot health

# Verificar serviço específico
docker-pilot health api

# Health check contínuo
docker-pilot health --watch

# Health check com timeout
docker-pilot health --timeout 30s

# Exportar status de saúde
docker-pilot health --format json > health.json
```

## Sistema de Alertas

### Configuração de Alertas

```yaml
# docker-pilot.yml
monitoring:
  alerts:
    # Alerta de CPU
    - name: "high_cpu"
      condition: "cpu_usage > 80"
      for: "5m"  # Condição deve persistir por 5 minutos
      severity: "warning"
      message: "Alto uso de CPU detectado: {{.value}}%"
      actions:
        - "email"
        - "slack"

    # Alerta de memória
    - name: "high_memory"
      condition: "memory_usage > 85"
      for: "2m"
      severity: "critical"
      message: "Alto uso de memória: {{.value}}%"
      actions:
        - "email"
        - "slack"
        - "restart_service"

    # Alerta de serviço parado
    - name: "service_down"
      condition: "service_status == 'stopped'"
      for: "30s"
      severity: "critical"
      message: "Serviço {{.service}} está parado"
      actions:
        - "restart_service"
        - "pagerduty"

    # Alerta customizado
    - name: "queue_backlog"
      condition: "custom.queue_size > 1000"
      for: "10m"
      severity: "warning"
      message: "Fila com muitos itens: {{.value}}"
      actions:
        - "scale_workers"
```

### Canais de Notificação

```yaml
monitoring:
  notifications:
    # Email
    email:
      enabled: true
      smtp_server: "smtp.gmail.com"
      smtp_port: 587
      username: "${EMAIL_USER}"
      password: "${EMAIL_PASS}"
      from: "noreply@company.com"
      to:
        - "ops@company.com"
        - "dev@company.com"

    # Slack
    slack:
      enabled: true
      webhook_url: "${SLACK_WEBHOOK}"
      channel: "#alerts"
      username: "docker-pilot"
      icon_emoji: ":warning:"

    # Discord
    discord:
      enabled: true
      webhook_url: "${DISCORD_WEBHOOK}"
      username: "Docker Pilot"

    # PagerDuty
    pagerduty:
      enabled: true
      integration_key: "${PAGERDUTY_KEY}"
      severity_mapping:
        warning: "warning"
        critical: "error"

    # Teams
    teams:
      enabled: true
      webhook_url: "${TEAMS_WEBHOOK}"

    # Custom webhook
    webhook:
      enabled: true
      url: "${CUSTOM_WEBHOOK_URL}"
      method: "POST"
      headers:
        Authorization: "Bearer ${WEBHOOK_TOKEN}"
```

### Gerenciamento de Alertas

```bash
# Listar alertas ativos
docker-pilot alerts list

# Ver histórico de alertas
docker-pilot alerts history

# Silenciar alerta
docker-pilot alerts silence high_cpu --duration 1h

# Testar notificações
docker-pilot alerts test slack
docker-pilot alerts test email

# Configurar alert rule
docker-pilot alerts add --name "disk_full" --condition "disk_usage > 95"
```

## Logs Centralizados

### Configuração de Logs

```yaml
# docker-pilot.yml
monitoring:
  logging:
    # Agregação de logs
    aggregation:
      enabled: true
      format: "json"

    # Rotação de logs
    rotation:
      max_size: "100MB"
      max_files: 10
      compress: true

    # Filtros de log
    filters:
      - level: "error"
        action: "alert"
      - pattern: "FATAL"
        action: "alert"
        severity: "critical"
      - source: "api"
        level: "debug"
        action: "ignore"

    # Exportadores
    exporters:
      # Elasticsearch
      elasticsearch:
        enabled: true
        hosts: ["http://elasticsearch:9200"]
        index: "docker-pilot-logs"

      # Fluentd
      fluentd:
        enabled: false
        host: "fluentd"
        port: 24224

      # File
      file:
        enabled: true
        path: "./logs/aggregated.log"
```

### Visualização de Logs

```bash
# Ver logs em tempo real
docker-pilot logs --follow

# Logs de múltiplos serviços
docker-pilot logs api database --merge

# Filtrar logs
docker-pilot logs --level error
docker-pilot logs --grep "exception"
docker-pilot logs --since "1h"

# Buscar em logs
docker-pilot logs search "database connection"
docker-pilot logs search --regex "error.*timeout"

# Exportar logs
docker-pilot logs --export ./logs.json
docker-pilot logs --export ./logs.csv --format csv
```

## Relatórios e Analytics

### Configuração de Relatórios

```yaml
# docker-pilot.yml
monitoring:
  reports:
    # Relatório diário
    daily:
      enabled: true
      schedule: "0 9 * * *"  # 9:00 AM todos os dias
      format: "html"
      sections:
        - "summary"
        - "performance"
        - "alerts"
        - "resources"
      recipients:
        - "team@company.com"

    # Relatório semanal
    weekly:
      enabled: true
      schedule: "0 9 * * 1"  # Segunda-feira 9:00 AM
      format: "pdf"
      detailed: true
      include_graphs: true

    # Relatório mensal
    monthly:
      enabled: true
      schedule: "0 9 1 * *"  # Primeiro dia do mês
      format: "json"
      export_path: "./reports/"
```

### Geração de Relatórios

```bash
# Gerar relatório manual
docker-pilot report generate daily
docker-pilot report generate --format pdf --output report.pdf

# Ver relatórios anteriores
docker-pilot report list
docker-pilot report view "2023-12-01-daily"

# Configurar relatório
docker-pilot report config --add-section "custom_metrics"
```

## Integração com Ferramentas Externas

### Prometheus

```yaml
# docker-pilot.yml
monitoring:
  exporters:
    prometheus:
      enabled: true
      port: 9090
      path: "/metrics"
      interval: 15s

      # Métricas customizadas
      custom_metrics:
        - name: "docker_pilot_services_total"
          type: "gauge"
          help: "Total number of services"
          value: "count(services)"

        - name: "docker_pilot_cpu_usage"
          type: "gauge"
          help: "CPU usage percentage"
          labels: ["service"]
          value: "cpu_percent"
```

### Grafana

```yaml
monitoring:
  grafana:
    enabled: true
    dashboards:
      - name: "Docker Pilot Overview"
        file: "./dashboards/overview.json"
      - name: "Service Metrics"
        file: "./dashboards/services.json"

    datasources:
      - name: "Docker Pilot"
        type: "prometheus"
        url: "http://localhost:9090"
```

### ELK Stack

```yaml
monitoring:
  elk:
    elasticsearch:
      host: "http://elasticsearch:9200"
      index: "docker-pilot"

    logstash:
      host: "logstash"
      port: 5044

    kibana:
      dashboards:
        - "./kibana/docker-pilot-dashboard.json"
```

## Performance Monitoring

### Benchmarks

```bash
# Benchmark de performance
docker-pilot benchmark

# Benchmark de serviço específico
docker-pilot benchmark api

# Benchmark com carga
docker-pilot benchmark api --requests 1000 --concurrency 10

# Benchmark contínuo
docker-pilot benchmark --continuous --interval 60s
```

### Profiling

```yaml
# docker-pilot.yml
monitoring:
  profiling:
    enabled: true
    services:
      - api
      - worker

    intervals:
      cpu: 30s
      memory: 60s
      network: 15s

    storage:
      type: "file"
      path: "./profiles/"
      retention: "7d"
```

## Troubleshooting

### Debug de Monitoramento

```bash
# Verificar status do monitoramento
docker-pilot monitor status

# Debug de métricas
docker-pilot monitor debug metrics

# Testar health checks
docker-pilot monitor debug health

# Verificar configuração
docker-pilot monitor config validate
```

### Problemas Comuns

1. **Métricas não coletadas**:
```bash
# Verificar configuração
docker-pilot monitor config show

# Verificar conectividade
docker-pilot monitor test-connection
```

2. **Alertas não funcionando**:
```bash
# Testar notificações
docker-pilot alerts test-all

# Verificar regras
docker-pilot alerts rules validate
```

3. **Dashboard não carregando**:
```bash
# Verificar logs
docker-pilot monitor logs

# Reiniciar dashboard
docker-pilot monitor dashboard restart
```

## Configuração de Segurança

### Autenticação

```yaml
# docker-pilot.yml
monitoring:
  security:
    # Autenticação básica
    auth:
      type: "basic"
      username: "${MONITOR_USER}"
      password: "${MONITOR_PASS}"

    # JWT
    jwt:
      enabled: true
      secret: "${JWT_SECRET}"
      expiry: "24h"

    # HTTPS
    tls:
      enabled: true
      cert_file: "./certs/monitor.crt"
      key_file: "./certs/monitor.key"
```

### Permissões

```yaml
monitoring:
  rbac:
    enabled: true
    roles:
      viewer:
        permissions:
          - "read:metrics"
          - "read:logs"

      admin:
        permissions:
          - "read:*"
          - "write:*"
          - "admin:*"

    users:
      - username: "dev"
        role: "viewer"
      - username: "ops"
        role: "admin"
```

## APIs de Monitoramento

### REST API

```bash
# Métricas via API
curl http://localhost:3030/api/metrics

# Status de serviços
curl http://localhost:3030/api/services/status

# Alertas ativos
curl http://localhost:3030/api/alerts/active

# Health checks
curl http://localhost:3030/api/health
```

### WebSocket API

```javascript
// Cliente WebSocket
const ws = new WebSocket('ws://localhost:3030/api/ws');

ws.on('open', () => {
  // Subscrever a métricas
  ws.send(JSON.stringify({
    type: 'subscribe',
    topic: 'metrics'
  }));
});

ws.on('message', (data) => {
  const metrics = JSON.parse(data);
  console.log('Métricas:', metrics);
});
```

## Veja Também

- [Docker Integration](docker-integration.md)
- [Alertas](../user-guide/commands.md#docker-pilot-monitor)
- [Plugins](plugins.md)
- [Automação](automation.md)
