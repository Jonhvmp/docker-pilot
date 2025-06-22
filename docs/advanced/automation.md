# Automation

Docker Pilot offers advanced automation features to streamline workflows, CI/CD and routine operations.

## Overview

Automation in Docker Pilot includes:

- **Automated scripts**: Execution of complex tasks
- **Lifecycle hooks**: Automatic actions on specific events
- **Workflows**: Sequências organizadas de comandos
- **Scheduling**: Execução programada de tarefas
- **Integração CI/CD**: Automação em pipelines

## Hooks de Ciclo de Vida

### Hooks Disponíveis

```yaml
# docker-pilot.yml
hooks:
  # Hooks de inicialização
  before_start:
    - "echo 'Preparando para iniciar serviços...'"
    - "npm run build"
    - "chmod +x scripts/setup.sh && ./scripts/setup.sh"

  after_start:
    - "echo 'Serviços iniciados com sucesso!'"
    - "curl -f http://localhost:3000/health || exit 1"
    - "npm run test:smoke"

  # Hooks de parada
  before_stop:
    - "echo 'Salvando estado antes de parar...'"
    - "npm run backup"

  after_stop:
    - "echo 'Serviços parados.'"
    - "docker system prune -f"

  # Hooks de restart
  before_restart:
    - "npm run pre-restart-checks"

  after_restart:
    - "npm run post-restart-validation"

  # Hooks de deploy
  before_deploy:
    - "npm run lint"
    - "npm test"
    - "docker-pilot build --no-cache"

  after_deploy:
    - "kubectl rollout status deployment/api"
    - "npm run test:integration"
    - "slack-notify 'Deploy concluído!'"

  # Hooks de erro
  on_error:
    - "echo 'Erro detectado, executando recovery...'"
    - "docker-pilot logs --tail 100 > error.log"
    - "npm run notify-error"

  # Hooks de limpeza
  on_cleanup:
    - "docker system prune -af"
    - "rm -rf temp/"
```

### Hooks Condicionais

```yaml
hooks:
  before_start:
    - condition: "test -f package.json"
      command: "npm install"
      description: "Instalar dependências Node.js se package.json existe"

    - condition: "[ \"$NODE_ENV\" = \"development\" ]"
      command: "npm run db:seed"
      description: "Seed do banco apenas em desenvolvimento"

    - condition: "docker ps | grep -q redis"
      command: "echo 'Redis já está rodando'"
      else: "docker run -d --name redis redis:alpine"
      description: "Iniciar Redis se não estiver rodando"
```

### Hooks por Serviço

```yaml
services:
  api:
    image: "myapp/api"
    hooks:
      before_start:
        - "npm run build"
      after_start:
        - "curl -f http://localhost:3000/health"
      before_stop:
        - "npm run graceful-shutdown"

  database:
    image: "postgres:13"
    hooks:
      after_start:
        - "sleep 10"  # Aguardar inicialização
        - "npm run db:migrate"
      before_stop:
        - "pg_dump myapp > backup.sql"
```

## Workflows Automatizados

### Definição de Workflows

```yaml
# docker-pilot.yml
workflows:
  development:
    description: "Setup completo para desenvolvimento"
    steps:
      - name: "Preparar ambiente"
        commands:
          - "npm install"
          - "composer install"

      - name: "Configurar banco de dados"
        commands:
          - "docker-pilot start database"
          - "sleep 5"
          - "npm run db:create"
          - "npm run db:migrate"

      - name: "Iniciar serviços"
        commands:
          - "docker-pilot start api frontend"
        parallel: true

      - name: "Executar testes"
        commands:
          - "npm run test:smoke"
        continue_on_error: true

  production-deploy:
    description: "Deploy para produção"
    confirmation: true
    steps:
      - name: "Validações pré-deploy"
        commands:
          - "npm run lint"
          - "npm test"
          - "docker-pilot config validate"

      - name: "Build e push"
        commands:
          - "docker-pilot build --no-cache"
          - "docker-pilot push"

      - name: "Deploy"
        commands:
          - "kubectl apply -f k8s/"
          - "kubectl rollout status deployment/api"

      - name: "Testes pós-deploy"
        commands:
          - "npm run test:integration"
        rollback_on_error: true
```

### Execução de Workflows

```bash
# Executar workflow
docker-pilot workflow run development
docker-pilot workflow run production-deploy

# Listar workflows
docker-pilot workflow list

# Executar com confirmação
docker-pilot workflow run production-deploy --confirm

# Executar em modo dry-run
docker-pilot workflow run development --dry-run
```

## Automação por Eventos

### Watchers de Arquivo

```yaml
# docker-pilot.yml
automation:
  file_watchers:
    # Rebuild automático em mudanças de código
    - pattern: "./src/**/*.js"
      command: "docker-pilot restart api"
      debounce: 2000  # ms
      description: "Reiniciar API quando código JS mudar"

    # Reiniciar frontend em mudanças de CSS
    - pattern: "./frontend/src/**/*.css"
      command: "docker-pilot exec frontend npm run build:css"
      description: "Rebuild CSS quando arquivos mudarem"

    # Recarregar configuração
    - pattern: "./docker-pilot.yml"
      command: "docker-pilot config reload"
      description: "Recarregar configuração quando docker-pilot.yml mudar"
```

### Webhooks

```yaml
automation:
  webhooks:
    # Deploy automático via webhook
    - endpoint: "/webhook/deploy"
      secret: "${WEBHOOK_SECRET}"
      commands:
        - "git pull origin main"
        - "docker-pilot workflow run production-deploy"
      conditions:
        - "branch == 'main'"
        - "repository == 'company/myapp'"

    # Notificação de status
    - endpoint: "/webhook/status"
      commands:
        - "docker-pilot status --format json > status.json"
        - "curl -X POST $MONITORING_URL -d @status.json"
```

## Scheduling (Tarefas Programadas)

### Configuração de Schedule

```yaml
# docker-pilot.yml
automation:
  scheduled_tasks:
    # Backup diário
    - name: "daily-backup"
      schedule: "0 2 * * *"  # 2:00 AM todos os dias
      command: "docker-pilot run backup"
      description: "Backup diário do banco de dados"

    # Limpeza semanal
    - name: "weekly-cleanup"
      schedule: "0 0 * * 0"  # Domingo à meia-noite
      commands:
        - "docker system prune -af"
        - "docker volume prune -f"
      description: "Limpeza semanal do Docker"

    # Health check de hora em hora
    - name: "hourly-health-check"
      schedule: "0 * * * *"
      command: "docker-pilot health --all"
      on_failure:
        - "docker-pilot restart --all"
        - "slack-notify 'Serviços reiniciados após falha no health check'"

    # Atualização de imagens (mensal)
    - name: "monthly-update"
      schedule: "0 3 1 * *"  # 3:00 AM do primeiro dia do mês
      commands:
        - "docker-pilot pull --all"
        - "docker-pilot restart --all"
      confirmation: true
```

### Gerenciamento de Tasks

```bash
# Listar tarefas programadas
docker-pilot schedule list

# Executar tarefa manualmente
docker-pilot schedule run daily-backup

# Habilitar/desabilitar tarefa
docker-pilot schedule enable daily-backup
docker-pilot schedule disable daily-backup

# Ver próximas execuções
docker-pilot schedule next

# Ver histórico de execuções
docker-pilot schedule history daily-backup
```

## Integração CI/CD

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Docker Pilot
        run: |
          curl -fsSL https://get.docker-pilot.com | sh
          docker-pilot --version

      - name: Run tests
        run: |
          docker-pilot workflow run test

      - name: Build images
        run: |
          docker-pilot build --parallel
    deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          docker-pilot workflow run production-deploy
        env:
          KUBECONFIG: ${ { secrets.KUBECONFIG } }
          DOCKER_REGISTRY_TOKEN: ${ { secrets.REGISTRY_TOKEN } }
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_PILOT_VERSION: "latest"

before_script:
  - curl -fsSL https://get.docker-pilot.com | sh
  - docker-pilot config validate

test:
  stage: test
  script:
    - docker-pilot workflow run test
  coverage: '/Coverage: \d+\.\d+%/'

build:
  stage: build
  script:
    - docker-pilot build --no-cache
    - docker-pilot push
  only:
    - main
    - develop

deploy_staging:
  stage: deploy
  script:
    - docker-pilot workflow run staging-deploy
  environment:
    name: staging
    url: https://staging.myapp.com
  only:
    - develop

deploy_production:
  stage: deploy
  script:
    - docker-pilot workflow run production-deploy
  environment:
    name: production
    url: https://myapp.com
  when: manual
  only:
    - main
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        DOCKER_PILOT_CONFIG = credentials('docker-pilot-config')
    }

    stages {
        stage('Setup') {
            steps {
                sh 'curl -fsSL https://get.docker-pilot.com | sh'
                sh 'docker-pilot --version'
            }
        }

        stage('Test') {
            steps {
                sh 'docker-pilot workflow run test'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results.xml'
                }
            }
        }

        stage('Build') {
            steps {
                sh 'docker-pilot build --parallel'
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?'
                sh 'docker-pilot workflow run production-deploy'
            }
        }
    }

    post {
        failure {
            sh 'docker-pilot run notify-failure'
        }
        success {
            sh 'docker-pilot run notify-success'
        }
    }
}
```

## Scripts de Automação

### Scripts Bash

```bash
#!/bin/bash
# scripts/auto-deploy.sh

set -e

echo "🚀 Iniciando deploy automático..."

# Verificar se há mudanças
if ! git diff --quiet HEAD~1; then
    echo "📝 Mudanças detectadas, prosseguindo com deploy"
else
    echo "ℹ️ Nenhuma mudança detectada, pulando deploy"
    exit 0
fi

# Executar testes
echo "🧪 Executando testes..."
if docker-pilot workflow run test; then
    echo "✅ Testes passaram"
else
    echo "❌ Testes falharam, cancelando deploy"
    exit 1
fi

# Deploy
echo "🚢 Fazendo deploy..."
docker-pilot workflow run production-deploy

# Verificação pós-deploy
echo "🔍 Verificando deploy..."
sleep 30
if curl -f https://myapp.com/health; then
    echo "✅ Deploy bem-sucedido!"
    docker-pilot run notify-success
else
    echo "❌ Deploy falhou, fazendo rollback..."
    docker-pilot run rollback
    docker-pilot run notify-failure
    exit 1
fi
```

### Scripts Python

```python
#!/usr/bin/env python3
# scripts/auto-scaling.py

import subprocess
import time
import requests
import json

def get_metrics():
    """Obter métricas dos serviços"""
    result = subprocess.run(
        ['docker-pilot', 'metrics', '--format', 'json'],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

def scale_service(service, replicas):
    """Escalar serviço"""
    subprocess.run([
        'docker-pilot', 'scale', service, str(replicas)
    ])
    print(f"Serviço {service} escalado para {replicas} réplicas")

def auto_scale():
    """Lógica de auto-scaling"""
    metrics = get_metrics()

    for service, data in metrics.items():
        cpu_usage = data.get('cpu_percent', 0)
        current_replicas = data.get('replicas', 1)

        if cpu_usage > 80 and current_replicas < 5:
            # Escalar para cima
            new_replicas = min(current_replicas + 1, 5)
            scale_service(service, new_replicas)
        elif cpu_usage < 20 and current_replicas > 1:
            # Escalar para baixo
            new_replicas = max(current_replicas - 1, 1)
            scale_service(service, new_replicas)

if __name__ == "__main__":
    while True:
        try:
            auto_scale()
        except Exception as e:
            print(f"Erro no auto-scaling: {e}")

        time.sleep(60)  # Verificar a cada minuto
```

## Automação de Monitoramento

### Health Checks Automatizados

```yaml
# docker-pilot.yml
automation:
  health_checks:
    - name: "api-health"
      url: "http://localhost:3000/health"
      interval: 30  # segundos
      timeout: 5
      retries: 3
      on_failure:
        - "docker-pilot restart api"
        - "slack-notify 'API reiniciada após falha no health check'"

    - name: "database-health"
      command: "docker-pilot exec database pg_isready -U postgres"
      interval: 60
      on_failure:
        - "docker-pilot restart database"
        - "sleep 30"
        - "docker-pilot exec api npm run db:migrate"
```

### Alertas Automatizados

```yaml
automation:
  alerts:
    # Alerta de uso de CPU
    - name: "high-cpu"
      condition: "cpu_usage > 80"
      actions:
        - "docker-pilot scale api +1"
        - "slack-notify 'Alto uso de CPU detectado, escalando API'"

    # Alerta de uso de memória
    - name: "high-memory"
      condition: "memory_usage > 85"
      actions:
        - "docker-pilot restart api"
        - "email-notify 'Reiniciando API devido a alto uso de memória'"

    # Alerta de espaço em disco
    - name: "low-disk"
      condition: "disk_usage > 90"
      actions:
        - "docker system prune -af"
        - "docker-pilot run cleanup"
```

## Rollback Automático

### Configuração de Rollback

```yaml
# docker-pilot.yml
automation:
  rollback:
    enabled: true
    triggers:
      - "health_check_failure"
      - "high_error_rate"
      - "deployment_timeout"

    strategy: "previous_version"
    timeout: 300  # segundos

    post_rollback:
      - "docker-pilot run notify-rollback"
      - "kubectl annotate deployment api rollback.reason='$ROLLBACK_REASON'"
```

### Script de Rollback

```bash
#!/bin/bash
# scripts/auto-rollback.sh

HEALTH_CHECK_URL="https://myapp.com/health"
MAX_FAILURES=3
CURRENT_FAILURES=0

echo "🔍 Monitorando saúde da aplicação..."

while true; do
    if curl -f -s $HEALTH_CHECK_URL > /dev/null; then
        CURRENT_FAILURES=0
        echo "✅ Health check OK"
    else
        CURRENT_FAILURES=$((CURRENT_FAILURES + 1))
        echo "❌ Health check falhou ($CURRENT_FAILURES/$MAX_FAILURES)"

        if [ $CURRENT_FAILURES -ge $MAX_FAILURES ]; then
            echo "🔄 Iniciando rollback automático..."
            docker-pilot run rollback
            docker-pilot run notify-rollback
            exit 1
        fi
    fi

    sleep 30
done
```

## Ferramentas de Automação

### Make Integration

```makefile
# Makefile
.PHONY: install dev test build deploy clean

install:
	docker-pilot workflow run install

dev:
	docker-pilot workflow run development

test:
	docker-pilot workflow run test

build:
	docker-pilot build --parallel

deploy:
	docker-pilot workflow run production-deploy

clean:
	docker-pilot run cleanup
	docker system prune -af

# Auto-deploy com verificações
auto-deploy:
	@echo "Verificando mudanças..."
	@git fetch origin
	@if ! git diff --quiet HEAD origin/main; then \
		echo "Mudanças detectadas, fazendo deploy..."; \
		make test && make build && make deploy; \
	else \
		echo "Nenhuma mudança detectada"; \
	fi
```

### Yarn/NPM Scripts

```json
{
  "scripts": {
    "docker:dev": "docker-pilot workflow run development",
    "docker:test": "docker-pilot workflow run test",
    "docker:build": "docker-pilot build --parallel",
    "docker:deploy": "docker-pilot workflow run production-deploy",
    "docker:clean": "docker-pilot run cleanup",
    "precommit": "docker-pilot workflow run test",
    "postinstall": "docker-pilot pull --if-newer"
  }
}
```

## Monitoramento de Automação

### Logs de Automação

```yaml
# docker-pilot.yml
automation:
  logging:
    enabled: true
    level: "info"
    file: "./logs/automation.log"
    rotate: true
    max_size: "10MB"
    max_files: 5

    # Log structured data
    structured: true
    fields:
      - "timestamp"
      - "event"
      - "service"
      - "duration"
      - "status"
```

### Dashboard de Automação

```bash
# Iniciar dashboard
docker-pilot automation dashboard

# Ver status das automações
docker-pilot automation status

# Histórico de execuções
docker-pilot automation history

# Métricas de automação
docker-pilot automation metrics
```

## Boas Práticas

### 1. Idempotência

```yaml
hooks:
  before_start:
    # ❌ Não idempotente
    - "npm install"

    # ✅ Idempotente
    - condition: "[ ! -d node_modules ]"
      command: "npm install"
```

### 2. Error Handling

```yaml
workflows:
  deploy:
    steps:
      - name: "Deploy"
        commands:
          - "kubectl apply -f k8s/"
        rollback_on_error:
          - "kubectl rollout undo deployment/api"
        timeout: 300
```

### 3. Testing

```bash
# Testar automações em ambiente seguro
docker-pilot workflow run production-deploy --dry-run
docker-pilot automation test --all
```

### 4. Monitoramento

```yaml
automation:
  notifications:
    on_success:
      - "slack-notify 'Automação concluída com sucesso'"
    on_failure:
      - "email-notify 'Falha na automação'"
      - "pagerduty-alert 'Automação crítica falhou'"
```

## Resolução de Problemas

### Debug de Automações

```bash
# Ver logs detalhados
docker-pilot automation logs --verbose

# Testar hooks individualmente
docker-pilot hook test before_start

# Validar workflows
docker-pilot workflow validate production-deploy
```

### Problemas Comuns

1. **Timeouts**: Ajustar valores de timeout
2. **Dependências**: Verificar ordem de execução
3. **Permissões**: Validar acesso a recursos
4. **Race conditions**: Adicionar delays ou locks

## Veja Também

- [Comandos Personalizados](custom-commands.md)
- [Plugins](plugins.md)
- [Monitoramento](monitoring.md)
- [Integração Docker](docker-integration.md)
