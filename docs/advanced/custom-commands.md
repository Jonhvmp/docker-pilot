# Custom Commands

Docker Pilot allows you to create and configure custom commands to automate specific tasks for your project.

## Overview

Custom commands offer a flexible way to:

- Automate specific workflows
- Create shortcuts for command sequences
- Integrate with external tools
- Personalizar comportamentos por projeto
- Compartilhar scripts entre equipes

## Configuração Básica

### Definindo Comandos Personalizados

```yaml
# docker-pilot.yml
custom_commands:
  # Comando simples
  setup:
    description: "Configurar ambiente de desenvolvimento"
    command: "npm install && npm run db:migrate"

  # Comando com múltiplas etapas
  deploy:
    description: "Deploy para produção"
    steps:
      - "docker-pilot build --no-cache"
      - "docker-pilot push"
      - "kubectl apply -f k8s/"
      - "kubectl rollout status deployment/api"

  # Comando com opções
  test:
    description: "Executar testes"
    command: "npm test"
    options:
      watch:
        type: "boolean"
        description: "Executar em modo watch"
        default: false
    script: |
      if [ "$WATCH" = "true" ]; then
        npm run test:watch
      else
        npm test
      fi

  # Comando com contexto Docker
  db-backup:
    description: "Backup do banco de dados"
    service: "database"
    command: "pg_dump -U postgres myapp > /backup/backup-$(date +%Y%m%d).sql"
    volumes:
      - "./backups:/backup"
```

### Executando Comandos Personalizados

```bash
# Executar comando personalizado
docker-pilot run setup
docker-pilot run deploy
docker-pilot run test
docker-pilot run test --watch

# Listar comandos disponíveis
docker-pilot commands list

# Mostrar ajuda de um comando
docker-pilot run test --help
```

## Tipos de Comandos

### 1. Comandos Shell Simples

```yaml
custom_commands:
  install-deps:
    description: "Instalar dependências"
    command: "npm install && composer install"

  clear-cache:
    description: "Limpar cache"
    command: "redis-cli flushall && rm -rf var/cache/*"
```

### 2. Comandos Multi-etapa

```yaml
custom_commands:
  full-setup:
    description: "Setup completo do projeto"
    steps:
      - name: "Instalar dependências"
        command: "npm install"
      - name: "Configurar banco"
        command: "npm run db:create && npm run db:migrate"
      - name: "Seed inicial"
        command: "npm run db:seed"
      - name: "Iniciar serviços"
        command: "docker-pilot start --all"
```

### 3. Comandos com Scripts

```yaml
custom_commands:
  deploy-staging:
    description: "Deploy para staging"
    script: |
      #!/bin/bash
      set -e

      echo "🚀 Iniciando deploy para staging..."

      # Build das imagens
      docker-pilot build --parallel

      # Tag das imagens
      docker tag myapp/api:latest myapp/api:staging-$(git rev-parse --short HEAD)

      # Push para registry
      docker push myapp/api:staging-$(git rev-parse --short HEAD)

      # Deploy
      kubectl set image deployment/api api=myapp/api:staging-$(git rev-parse --short HEAD)
      kubectl rollout status deployment/api

      echo "✅ Deploy concluído!"
```

### 4. Comandos com Contexto Docker

```yaml
custom_commands:
  db-shell:
    description: "Acessar shell do banco de dados"
    service: "database"
    command: "psql -U postgres myapp"
    interactive: true

  api-logs:
    description: "Ver logs da API em tempo real"
    service: "api"
    command: "tail -f /var/log/app.log"
    tty: true
```

### 5. Comandos Condicionais

```yaml
custom_commands:
  test-and-deploy:
    description: "Testar e fazer deploy se passou"
    script: |
      #!/bin/bash

      echo "Executando testes..."
      if npm test; then
        echo "✅ Testes passaram, fazendo deploy..."
        docker-pilot run deploy
      else
        echo "❌ Testes falharam, cancelando deploy"
        exit 1
      fi
```

## Configuração Avançada

### Opções de Comandos

```yaml
custom_commands:
  migrate:
    description: "Executar migrações"
    options:
      rollback:
        type: "boolean"
        description: "Fazer rollback da última migração"
        default: false
      steps:
        type: "number"
        description: "Número de passos para rollback"
        default: 1
      env:
        type: "string"
        description: "Ambiente alvo"
        choices: ["development", "staging", "production"]
        default: "development"
    script: |
      if [ "$ROLLBACK" = "true" ]; then
        npm run db:rollback -- --steps=$STEPS --env=$ENV
      else
        npm run db:migrate -- --env=$ENV
      fi
```

### Variáveis de Ambiente

```yaml
custom_commands:
  backup:
    description: "Backup com timestamp"
    environment:
      BACKUP_DIR: "./backups"
      TIMESTAMP: "$(date +%Y%m%d_%H%M%S)"
    script: |
      mkdir -p $BACKUP_DIR
      docker-pilot exec database pg_dump -U postgres myapp > $BACKUP_DIR/backup_$TIMESTAMP.sql
      echo "Backup salvo em: $BACKUP_DIR/backup_$TIMESTAMP.sql"
```

### Pré e Pós Comandos

```yaml
custom_commands:
  deploy:
    description: "Deploy com validações"
    before:
      - "npm run lint"
      - "npm test"
      - "docker-pilot config validate"
    command: "kubectl apply -f k8s/"
    after:
      - "kubectl rollout status deployment/api"
      - "docker-pilot run health-check"
    on_error:
      - "kubectl rollout undo deployment/api"
      - "docker-pilot notify 'Deploy falhou!'"
```

### Comandos Paralelos

```yaml
custom_commands:
  build-all:
    description: "Build paralelo de todos os serviços"
    parallel:
      - name: "Build API"
        command: "docker build -t myapp/api ./api"
      - name: "Build Frontend"
        command: "docker build -t myapp/frontend ./frontend"
      - name: "Build Worker"
        command: "docker build -t myapp/worker ./worker"
```

## Templates de Comandos

### Template de Deploy

```yaml
custom_commands:
  deploy-template:
    description: "Template de deploy parametrizável"
    options:
      environment:
        type: "string"
        required: true
        choices: ["staging", "production"]
      version:
        type: "string"
        description: "Versão para deploy"
        default: "latest"
      dry_run:
        type: "boolean"
        description: "Simular deploy sem executar"
        default: false

    script: |
      ENV=$ENVIRONMENT
      VERSION=$VERSION
      DRY_RUN=$DRY_RUN

      echo "🚀 Deploy para $ENV (versão: $VERSION)"

      if [ "$DRY_RUN" = "true" ]; then
        echo "🔍 Modo dry-run ativado"
        kubectl diff -f k8s/overlays/$ENV/
      else
        # Build com tag específica
        docker build -t myapp/api:$VERSION ./api

        # Push para registry
        docker push myapp/api:$VERSION

        # Update deployment
        kubectl set image deployment/api api=myapp/api:$VERSION -n $ENV
        kubectl rollout status deployment/api -n $ENV

        echo "✅ Deploy concluído!"
      fi
```

### Template de Teste

```yaml
custom_commands:
  test-template:
    description: "Template de testes configurável"
    options:
      type:
        type: "string"
        choices: ["unit", "integration", "e2e", "all"]
        default: "all"
      coverage:
        type: "boolean"
        description: "Gerar relatório de cobertura"
        default: false
      watch:
        type: "boolean"
        description: "Executar em modo watch"
        default: false

    script: |
      TYPE=$TYPE
      COVERAGE=$COVERAGE
      WATCH=$WATCH

      # Configurar comandos baseado no tipo
      case $TYPE in
        "unit")
          CMD="npm run test:unit"
          ;;
        "integration")
          CMD="npm run test:integration"
          ;;
        "e2e")
          CMD="npm run test:e2e"
          ;;
        "all")
          CMD="npm test"
          ;;
      esac

      # Adicionar flags
      if [ "$COVERAGE" = "true" ]; then
        CMD="$CMD -- --coverage"
      fi

      if [ "$WATCH" = "true" ]; then
        CMD="$CMD -- --watch"
      fi

      echo "Executando: $CMD"
      eval $CMD
```

## Comandos por Ambiente

### Configuração por Ambiente

```yaml
# docker-pilot.dev.yml
custom_commands:
  start:
    description: "Iniciar ambiente de desenvolvimento"
    command: "docker-pilot start --build database api"
    environment:
      NODE_ENV: "development"
      DEBUG: "true"

# docker-pilot.prod.yml
custom_commands:
  start:
    description: "Iniciar ambiente de produção"
    steps:
      - "docker-pilot pull --all"
      - "docker-pilot start --all"
    environment:
      NODE_ENV: "production"
```

### Comandos Específicos

```yaml
custom_commands:
  # Desenvolvimento
  dev-setup:
    description: "Setup para desenvolvimento"
    environments: ["development"]
    script: |
      npm install
      npm run db:reset
      npm run db:seed:dev
      docker-pilot start database api

  # Produção
  prod-deploy:
    description: "Deploy para produção"
    environments: ["production"]
    confirmation: true
    script: |
      echo "⚠️  Deploy para PRODUÇÃO!"
      read -p "Confirma deploy? (y/N): " confirm
      if [ "$confirm" = "y" ]; then
        kubectl apply -f k8s/prod/
      else
        echo "Deploy cancelado"
        exit 1
      fi
```

## Integração com CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Docker Pilot
        run: npm install -g @docker-pilot/cli

      - name: Run deploy command
        run: docker-pilot run deploy --environment production
```

### GitLab CI

```yaml
# .gitlab-ci.yml
deploy:
  stage: deploy
  script:
    - docker-pilot run deploy --environment production
  only:
    - main
```

## Comandos Interativos

### Menu de Seleção

```yaml
custom_commands:
  interactive-deploy:
    description: "Deploy interativo"
    script: |
      echo "Selecione o ambiente:"
      echo "1) Development"
      echo "2) Staging"
      echo "3) Production"
      read -p "Opção: " choice

      case $choice in
        1) ENV="development" ;;
        2) ENV="staging" ;;
        3) ENV="production" ;;
        *) echo "Opção inválida"; exit 1 ;;
      esac

      docker-pilot run deploy --environment $ENV
```

### Confirmação de Ações

```yaml
custom_commands:
  destructive-action:
    description: "Ação destrutiva com confirmação"
    confirmation: true
    confirmation_message: "Esta ação irá deletar todos os dados. Confirma?"
    script: |
      echo "Executando ação destrutiva..."
      docker-pilot exec database psql -c "DROP DATABASE IF EXISTS myapp;"
      echo "Dados deletados!"
```

## Comandos com Dependências

### Verificação de Dependências

```yaml
custom_commands:
  deploy:
    description: "Deploy com verificação de dependências"
    requires:
      - "docker"
      - "kubectl"
      - "git"
    before:
      - name: "Verificar cluster"
        command: "kubectl cluster-info"
      - name: "Verificar registry"
        command: "docker info"
    script: |
      echo "Todas as dependências verificadas!"
      kubectl apply -f k8s/
```

### Comandos Condicionais

```yaml
custom_commands:
  smart-deploy:
    description: "Deploy inteligente"
    script: |
      # Verificar se há mudanças
      if git diff --quiet HEAD~1; then
        echo "Nenhuma mudança detectada, pulando deploy"
        exit 0
      fi

      # Verificar se testes passam
      if ! npm test; then
        echo "Testes falharam, cancelando deploy"
        exit 1
      fi

      # Executar deploy
      kubectl apply -f k8s/
```

## Debugging de Comandos

### Modo Debug

```bash
# Executar comando em modo debug
docker-pilot run setup --debug

# Ver script gerado
docker-pilot run setup --dry-run

# Executar com verbose
docker-pilot run setup --verbose
```

### Logs de Comandos

```yaml
custom_commands:
  logged-command:
    description: "Comando com logs detalhados"
    logging:
      enabled: true
      level: "debug"
      file: "./logs/commands.log"
    script: |
      echo "Iniciando comando..."
      # comando aqui
      echo "Comando concluído!"
```

## Compartilhamento de Comandos

### Comandos Globais

```yaml
# ~/.docker-pilot/commands.yml
global_commands:
  git-clean:
    description: "Limpeza git completa"
    command: "git clean -fd && git reset --hard HEAD"

  system-info:
    description: "Informações do sistema"
    script: |
      echo "Docker: $(docker --version)"
      echo "Kubernetes: $(kubectl version --client --short)"
      echo "Node: $(node --version)"
```

### Importação de Comandos

```yaml
# docker-pilot.yml
imports:
  - "./commands/database.yml"
  - "./commands/deployment.yml"
  - "https://raw.githubusercontent.com/company/commands/main/common.yml"
```

## Boas Práticas

### 1. Documentação

```yaml
custom_commands:
  well-documented:
    description: "Comando bem documentado"
    long_description: |
      Este comando executa uma série de operações para preparar
      o ambiente de desenvolvimento:

      1. Instala dependências
      2. Configura banco de dados
      3. Executa migrações
      4. Faz seed dos dados

    examples:
      - "docker-pilot run well-documented"
      - "docker-pilot run well-documented --skip-seed"

    options:
      skip_seed:
        type: "boolean"
        description: "Pular seed dos dados"
        default: false
```

### 2. Tratamento de Erros

```yaml
custom_commands:
  robust-command:
    description: "Comando robusto"
    script: |
      set -e  # Parar em caso de erro

      # Função de cleanup
      cleanup() {
        echo "Limpando recursos..."
        docker-pilot stop --all
      }

      # Registrar cleanup para execução em caso de erro
      trap cleanup EXIT

      # Comando principal
      echo "Executando operação..."
      npm install || { echo "Erro na instalação"; exit 1; }

      echo "Sucesso!"
```

### 3. Validação de Input

```yaml
custom_commands:
  validated-command:
    description: "Comando com validação"
    options:
      environment:
        type: "string"
        required: true
        pattern: "^(dev|staging|prod)$"
        error_message: "Ambiente deve ser: dev, staging ou prod"

    script: |
      if [ -z "$ENVIRONMENT" ]; then
        echo "Erro: Environment é obrigatório"
        exit 1
      fi

      echo "Deploy para $ENVIRONMENT"
```

## Veja Também

- [Comandos](../user-guide/commands.md)
- [Plugins](plugins.md)
- [Configuração](../user-guide/config-files.md)
- [Automação](automation.md)
