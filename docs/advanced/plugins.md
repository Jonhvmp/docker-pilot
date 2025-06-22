# Plugins

Docker Pilot has a robust plugin system that allows you to extend its functionality in a modular and flexible way.

## Overview

Docker Pilot plugins allow you to:

- Add new commands
- Integrate with external tools
- Customize behaviors
- Automate specific tasks
- Create custom workflows

## Plugin Architecture

### Plugin Types

1. **Command Plugins**: Add new CLI commands
2. **Hook Plugins**: Execute at specific lifecycle points
3. **Integration Plugins**: Connect with external tools
4. **UI Plugins**: Modify the user interface
5. **Monitoring Plugins**: Add monitoring capabilities

### Plugin Structure

```
my-plugin/
├── plugin.yml           # Plugin manifest
├── index.js            # Entry point
├── commands/           # Plugin commands
│   ├── deploy.js
│   └── status.js
├── hooks/              # Plugin hooks
│   ├── pre-start.js
│   └── post-deploy.js
├── templates/          # Templates
│   └── docker-compose.yml
├── assets/             # Static resources
│   └── logo.png
└── package.json        # Node.js dependencies
```

## Official Plugins

### Backup Plugin

Adds advanced backup and restore functionality.

```bash
# Instalar plugin de backup
docker-pilot plugin install @docker-pilot/backup

# Usar plugin
docker-pilot backup create --name "backup-$(date +%Y%m%d)"
docker-pilot backup list
docker-pilot backup restore "backup-20231201"
```

**Configuração:**

```yaml
# docker-pilot.yml
plugins:
  backup:
    enabled: true
    config:
      storage: "s3"
      bucket: "meus-backups"
      region: "us-east-1"
      encryption: true
      retention: 30  # dias
```

### Plugin de Monitoramento

Monitora performance e saúde dos serviços.

```bash
# Instalar plugin de monitoramento
docker-pilot plugin install @docker-pilot/monitoring

# Usar plugin
docker-pilot monitor dashboard
docker-pilot monitor alerts
docker-pilot monitor export --format json
```

**Configuração:**

```yaml
# docker-pilot.yml
plugins:
  monitoring:
    enabled: true
    config:
      metrics:
        - cpu
        - memory
        - network
        - disk
      alerts:
        cpu_threshold: 80
        memory_threshold: 85
        disk_threshold: 90
      dashboard:
        port: 3030
        auth: true
```

### Plugin de Notificações

Envia notificações para diferentes canais.

```bash
# Instalar plugin de notificações
docker-pilot plugin install @docker-pilot/notifications

# Configurar notificações
docker-pilot notifications setup slack
docker-pilot notifications test
```

**Configuração:**

```yaml
# docker-pilot.yml
plugins:
  notifications:
    enabled: true
    config:
      channels:
        slack:
          webhook_url: "https://hooks.slack.com/..."
          channel: "#devops"
        email:
          smtp_server: "smtp.gmail.com"
          from: "noreply@empresa.com"
        discord:
          webhook_url: "https://discord.com/api/webhooks/..."
```

### Plugin de Deploy

Facilita deploys para diferentes ambientes.

```bash
# Instalar plugin de deploy
docker-pilot plugin install @docker-pilot/deploy

# Fazer deploy
docker-pilot deploy staging
docker-pilot deploy production --confirm
```

**Configuração:**

```yaml
# docker-pilot.yml
plugins:
  deploy:
    enabled: true
    config:
      environments:
        staging:
          registry: "registry.staging.com"
          namespace: "staging"
          auto_deploy: true
        production:
          registry: "registry.prod.com"
          namespace: "production"
          auto_deploy: false
          require_confirmation: true
```

## Plugins da Comunidade

### Plugin Kubernetes

Integração com Kubernetes.

```bash
# Instalar plugin k8s
docker-pilot plugin install kubernetes-integration

# Gerar manifests K8s
docker-pilot k8s generate
docker-pilot k8s apply --environment staging
```

### Plugin AWS

Integração com serviços AWS.

```bash
# Instalar plugin AWS
docker-pilot plugin install aws-integration

# Deploy para ECS
docker-pilot aws ecs deploy
docker-pilot aws ecr push
```

### Plugin CI/CD

Integração com pipelines de CI/CD.

```bash
# Instalar plugin CI/CD
docker-pilot plugin install cicd-integration

# Gerar pipeline
docker-pilot cicd generate --provider github-actions
docker-pilot cicd generate --provider gitlab-ci
```

## Desenvolvendo Plugins

### Criando um Plugin Básico

1. **Criar estrutura básica:**

```bash
mkdir meu-plugin
cd meu-plugin
npm init -y
```

2. **Criar manifesto do plugin:**

```yaml
# plugin.yml
name: "meu-plugin"
version: "1.0.0"
description: "Meu plugin personalizado"
author: "Seu Nome"
homepage: "https://github.com/usuario/meu-plugin"

# Metadados
metadata:
  category: "utility"
  tags:
    - "custom"
    - "automation"

# Compatibilidade
compatibility:
  docker_pilot: ">=1.0.0"
  node: ">=14.0.0"

# Configuração
config:
  schema:
    type: "object"
    properties:
      api_key:
        type: "string"
        description: "API key para integração"
      timeout:
        type: "number"
        default: 30
        description: "Timeout em segundos"

# Comandos
commands:
  - name: "hello"
    description: "Comando de exemplo"
    handler: "./commands/hello.js"
  - name: "status"
    description: "Verificar status"
    handler: "./commands/status.js"

# Hooks
hooks:
  before_start:
    - "./hooks/pre-start.js"
  after_deploy:
    - "./hooks/post-deploy.js"

# Permissões
permissions:
  - "read_config"
  - "execute_commands"
  - "access_network"
```

3. **Implementar comandos:**

```javascript
// commands/hello.js
module.exports = {
  name: 'hello',
  description: 'Comando de exemplo',

  // Opções do comando
  options: [
    {
      name: 'name',
      alias: 'n',
      type: 'string',
      description: 'Nome para saudação',
      default: 'World'
    }
  ],

  // Handler do comando
  async handler(options, context) {
    const { name } = options;
    const { logger, config } = context;

    logger.info(`Hello, ${name}!`);

    // Acessar configuração do plugin
    const apiKey = config.get('api_key');
    if (apiKey) {
      logger.debug('API key configurada');
    }

    return {
      success: true,
      message: `Hello, ${name}!`
    };
  }
};
```

4. **Implementar hooks:**

```javascript
// hooks/pre-start.js
module.exports = {
  name: 'pre-start',
  description: 'Executado antes de iniciar serviços',

  async handler(context) {
    const { logger, services, config } = context;

    logger.info('Executando verificações pré-inicialização...');

    // Verificar se serviços estão configurados corretamente
    for (const service of services) {
      if (!service.healthcheck) {
        logger.warn(`Serviço ${service.name} não possui healthcheck`);
      }
    }

    return {
      success: true
    };
  }
};
```

### API do Plugin

#### Context Object

O objeto `context` fornecido aos handlers contém:

```javascript
{
  // Logger configurado
  logger: {
    debug: (message) => {},
    info: (message) => {},
    warn: (message) => {},
    error: (message) => {}
  },

  // Configuração do plugin
  config: {
    get: (key) => {},
    set: (key, value) => {},
    has: (key) => {}
  },

  // Serviços do projeto
  services: [
    {
      name: 'api',
      image: 'myapp/api',
      ports: ['3000:3000'],
      // ...
    }
  ],

  // Utilitários Docker
  docker: {
    exec: (container, command) => {},
    logs: (container, options) => {},
    inspect: (container) => {}
  },

  // Sistema de arquivos
  fs: {
    readFile: (path) => {},
    writeFile: (path, content) => {},
    exists: (path) => {}
  },

  // HTTP client
  http: {
    get: (url, options) => {},
    post: (url, data, options) => {}
  }
}
```

### Plugin Avançado

```javascript
// index.js
import path  from "path";

class MeuPlugin {
  constructor(context) {
    this.context = context;
    this.config = context.config;
    this.logger = context.logger;
  }

  // Inicialização do plugin
  async initialize() {
    this.logger.info('Inicializando Meu Plugin...');

    // Validar configuração
    if (!this.config.get('api_key')) {
      throw new Error('API key é obrigatória');
    }

    // Configurar recursos
    await this.setupResources();
  }

  // Configurar recursos
  async setupResources() {
    // Criar diretórios necessários
    const dataDir = path.join(process.cwd(), '.meu-plugin');
    if (!this.context.fs.exists(dataDir)) {
      await this.context.fs.mkdir(dataDir, { recursive: true });
    }
  }

  // Limpeza do plugin
  async cleanup() {
    this.logger.info('Limpando recursos do plugin...');
    // Limpeza de recursos
  }

  // Comando personalizado
  async executeCustomCommand(args) {
    this.logger.info('Executando comando personalizado...');

    // Lógica do comando
    const result = await this.processData(args);

    return {
      success: true,
      data: result
    };
  }

  // Processamento interno
  async processData(data) {
    // Implementar lógica específica
    return data;
  }
}

module.exports = MeuPlugin;
```

## Instalação de Plugins

### Métodos de Instalação

1. **NPM Registry:**
```bash
docker-pilot plugin install @docker-pilot/backup
docker-pilot plugin install meu-plugin-personalizado
```

2. **Git Repository:**
```bash
docker-pilot plugin install https://github.com/usuario/meu-plugin.git
docker-pilot plugin install git+ssh://git@github.com/usuario/meu-plugin.git
```

3. **Local Path:**
```bash
docker-pilot plugin install ./plugins/meu-plugin
docker-pilot plugin install /caminho/absoluto/para/plugin
```

4. **Tarball:**
```bash
docker-pilot plugin install https://example.com/meu-plugin.tar.gz
docker-pilot plugin install ./meu-plugin.tar.gz
```

### Gerenciamento de Plugins

```bash
# Listar plugins instalados
docker-pilot plugin list

# Mostrar informações de um plugin
docker-pilot plugin info meu-plugin

# Habilitar/desabilitar plugin
docker-pilot plugin enable meu-plugin
docker-pilot plugin disable meu-plugin

# Atualizar plugin
docker-pilot plugin update meu-plugin
docker-pilot plugin update --all

# Remover plugin
docker-pilot plugin remove meu-plugin

# Verificar atualizações
docker-pilot plugin outdated
```

## Configuração de Plugins

### Configuração Global

```yaml
# ~/.docker-pilot/config.yml
plugins:
  # Diretório de plugins
  directory: "~/.docker-pilot/plugins"

  # Auto-carregamento
  auto_load: true

  # Registry de plugins
  registry: "https://registry.docker-pilot.com"

  # Cache
  cache:
    enabled: true
    ttl: 3600

  # Plugins habilitados globalmente
  global:
    - "@docker-pilot/backup"
    - "@docker-pilot/monitoring"
```

### Configuração por Projeto

```yaml
# docker-pilot.yml
plugins:
  # Plugins específicos do projeto
  enabled:
    - "meu-plugin"
    - "@docker-pilot/deploy"

  # Configuração dos plugins
  config:
    meu-plugin:
      api_key: "${PLUGIN_API_KEY}"
      timeout: 30

    deploy:
      environments:
        staging:
          registry: "staging.registry.com"
        production:
          registry: "prod.registry.com"
```

## Marketplace de Plugins

### Navegação

```bash
# Buscar plugins
docker-pilot plugin search backup
docker-pilot plugin search --category monitoring

# Mostrar detalhes
docker-pilot plugin view @docker-pilot/backup

# Avaliar plugin
docker-pilot plugin rate @docker-pilot/backup 5
```

### Publicação

```bash
# Validar plugin
docker-pilot plugin validate

# Publicar plugin
docker-pilot plugin publish

# Atualizar versão
docker-pilot plugin publish --version 1.1.0
```

## Debugging de Plugins

### Logs de Plugin

```bash
# Logs específicos do plugin
docker-pilot plugin logs meu-plugin

# Logs em tempo real
docker-pilot plugin logs meu-plugin --follow

# Nível de debug
docker-pilot --log-level debug plugin logs meu-plugin
```

### Modo Debug

```bash
# Executar plugin em modo debug
docker-pilot --debug plugin run meu-plugin comando

# Validar plugin
docker-pilot plugin validate ./meu-plugin --verbose
```

## Segurança de Plugins

### Permissões

Os plugins devem declarar permissões necessárias:

```yaml
# plugin.yml
permissions:
  - "read_config"        # Ler configuração
  - "write_config"       # Escrever configuração
  - "execute_commands"   # Executar comandos
  - "access_network"     # Acesso à rede
  - "read_filesystem"    # Ler sistema de arquivos
  - "write_filesystem"   # Escrever sistema de arquivos
  - "access_docker"      # Acesso ao Docker daemon
```

### Sandbox

Plugins são executados em ambiente sandboxed:

- Acesso limitado ao sistema de arquivos
- Rede controlada
- Recursos limitados
- Permissões explícitas

### Verificação

```bash
# Verificar assinatura do plugin
docker-pilot plugin verify meu-plugin

# Auditoria de segurança
docker-pilot plugin audit meu-plugin
```

## Exemplos Práticos

### Plugin de Integração com Slack

```javascript
// commands/notify.js
module.exports = {
  name: 'notify',
  description: 'Enviar notificação para Slack',

  options: [
    {
      name: 'message',
      alias: 'm',
      type: 'string',
      description: 'Mensagem para enviar',
      required: true
    },
    {
      name: 'channel',
      alias: 'c',
      type: 'string',
      description: 'Canal do Slack'
    }
  ],

  async handler(options, context) {
    const { message, channel } = options;
    const { config, http, logger } = context;

    const webhookUrl = config.get('webhook_url');
    const defaultChannel = config.get('default_channel');

    try {
      await http.post(webhookUrl, {
        text: message,
        channel: channel || defaultChannel
      });

      logger.info('Notificação enviada com sucesso');
      return { success: true };
    } catch (error) {
      logger.error('Erro ao enviar notificação:', error.message);
      return { success: false, error: error.message };
    }
  }
};
```

### Plugin de Backup Customizado

```javascript
// commands/backup.js
import tar  from "tar";
const fs = require('fs').promises;

module.exports = {
  name: 'backup',
  description: 'Criar backup customizado',

  async handler(options, context) {
    const { logger, docker, config } = context;

    const backupPath = config.get('backup_path') || './backups';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `${backupPath}/backup-${timestamp}.tar.gz`;

    try {
      // Criar diretório de backup
      await fs.mkdir(backupPath, { recursive: true });

      // Parar serviços temporariamente
      logger.info('Parando serviços...');
      await docker.exec('docker-pilot', ['stop', '--all']);

      // Criar backup dos volumes
      logger.info('Criando backup...');
      await tar.create({
        gzip: true,
        file: backupFile
      }, ['./data', './config']);

      // Reiniciar serviços
      logger.info('Reiniciando serviços...');
      await docker.exec('docker-pilot', ['start', '--all']);

      logger.info(`Backup criado: ${backupFile}`);
      return { success: true, backup_file: backupFile };

    } catch (error) {
      logger.error('Erro no backup:', error.message);
      return { success: false, error: error.message };
    }
  }
};
```

## Contribuindo

### Como Contribuir

1. **Fork o repositório**
2. **Criar branch para feature**
3. **Desenvolver plugin**
4. **Escrever testes**
5. **Documentar plugin**
6. **Enviar pull request**

### Diretrizes

- Seguir padrões de código
- Incluir testes unitários
- Documentar adequadamente
- Usar semantic versioning
- Suportar i18n quando aplicável

### Templates

O Docker Pilot fornece templates para diferentes tipos de plugins:

```bash
# Criar plugin a partir de template
docker-pilot plugin create --template command meu-comando
docker-pilot plugin create --template integration minha-integracao
docker-pilot plugin create --template monitoring meu-monitor
```

## Veja Também

- [Comandos](../user-guide/commands.md)
- [Configuração](../user-guide/config-files.md)
- [Desenvolvimento](../development/contributing.md)
- [API Reference](../api/core.md)
