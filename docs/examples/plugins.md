# Plugin Examples

This section demonstrates how to create and use plugins to extend Docker Pilot functionality.

## Overview

Docker Pilot's plugin system allows adding custom commands, hooks and specific functionality without modifying the main code. Plugins are loaded dynamically and can be distributed as separate npm packages.

## Plugin Structure

### Basic Plugin

```typescript
// my-plugin/src/index.ts
import { Plugin, PluginContext, Command, CommandContext, CommandResult } from '@docker-pilot/types';

export default class MyPlugin implements Plugin {
  readonly name = 'my-plugin';
  readonly version = '1.0.0';
  readonly description = 'Example plugin for Docker Pilot';
  readonly author = 'Your Name';

  async initialize(context: PluginContext): Promise<void> {
    context.logger.info(`Plugin ${this.name} initialized`);
  }

  async destroy(): Promise<void> {
    // Cleanup when plugin is unloaded
  }

  getCommands(): Command[] {
    return [
      new MyCustomCommand(),
      new AnotherCommand()
    ];
  }

  getHooks() {
    return {
      beforeCommand: this.beforeCommand.bind(this),
      afterCommand: this.afterCommand.bind(this),
      onError: this.onError.bind(this)
    };
  }

  private async beforeCommand(context: CommandContext): Promise<void> {
    console.log(`Executing command: ${context.args[0]}`);
  }

  private async afterCommand(context: CommandContext, result: CommandResult): Promise<void> {
    console.log(`Comando executado com sucesso: ${result.success}`);
  }

  private async onError(context: CommandContext, error: Error): Promise<void> {
    console.error(`Erro no comando: ${error.message}`);
  }
}
```

### Package.json do Plugin

```json
{
  "name": "@docker-pilot/plugin-exemplo",
  "version": "1.0.0",
  "description": "Plugin de exemplo para Docker Pilot",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["docker-pilot", "plugin", "docker"],
  "author": "Seu Nome",
  "license": "MIT",
  "peerDependencies": {
    "@docker-pilot/core": "^1.0.0"
  },
  "devDependencies": {
    "@docker-pilot/types": "^1.0.0",
    "typescript": "^4.9.0"
  },
  "files": [
    "dist/",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  }
}
```

## Exemplos de Comandos Personalizados

### 1. Comando de Backup

```typescript
// plugins/backup/src/BackupCommand.ts
import { Command, CommandContext, CommandResult } from '@docker-pilot/types';
import { DockerUtils, FileUtils, Logger } from '@docker-pilot/utils';

export class BackupCommand implements Command {
  readonly name = 'backup';
  readonly description = 'Cria backup de containers e volumes';
  readonly category = 'custom';

  async execute(context: CommandContext): Promise<CommandResult> {
    const { args, options, logger, docker } = context;

    try {
      const backupType = args[0] || 'containers';
      const outputDir = options.output || './backups';

      await FileUtils.createDir(outputDir);

      switch (backupType) {
        case 'containers':
          await this.backupContainers(docker, outputDir, logger);
          break;
        case 'volumes':
          await this.backupVolumes(docker, outputDir, logger);
          break;
        case 'all':
          await this.backupContainers(docker, outputDir, logger);
          await this.backupVolumes(docker, outputDir, logger);
          break;
        default:
          throw new Error(`Tipo de backup inválido: ${backupType}`);
      }

      return {
        success: true,
        exitCode: 0,
        message: `Backup criado em: ${outputDir}`,
        executionTime: Date.now() - context.startTime
      };

    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        error: error as Error,
        executionTime: Date.now() - context.startTime
      };
    }
  }

  private async backupContainers(docker: any, outputDir: string, logger: Logger): Promise<void> {
    logger.info('Iniciando backup de containers...');

    const containers = await docker.listContainers({ all: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (const container of containers) {
      logger.info(`Fazendo backup do container: ${container.name}`);

      // Exportar container como tar
      const backupPath = `${outputDir}/container-${container.name}-${timestamp}.tar`;
      await docker.exportContainer(container.id, backupPath);

      // Salvar metadados
      const metadataPath = `${outputDir}/container-${container.name}-${timestamp}.json`;
      const metadata = await docker.inspectContainer(container.id);
      await FileUtils.write(metadataPath, JSON.stringify(metadata, null, 2));
    }

    logger.info('Backup de containers concluído');
  }

  private async backupVolumes(docker: any, outputDir: string, logger: Logger): Promise<void> {
    logger.info('Iniciando backup de volumes...');

    const volumes = await docker.listVolumes();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (const volume of volumes) {
      logger.info(`Fazendo backup do volume: ${volume.name}`);

      // Criar container temporário para acessar volume
      const backupContainer = await docker.createContainer({
        image: 'alpine:latest',
        cmd: ['tar', 'czf', `/backup/${volume.name}-${timestamp}.tar.gz`, '/data'],
        volumes: [
          { source: volume.name, destination: '/data', readOnly: true },
          { source: outputDir, destination: '/backup' }
        ]
      });

      await docker.startContainer(backupContainer);
      await docker.waitContainer(backupContainer);
      await docker.removeContainer(backupContainer);
    }

    logger.info('Backup de volumes concluído');
  }

  getHelp(): string {
    return `
Uso: docker-pilot backup [tipo] [opções]

Tipos:
  containers    Backup apenas containers
  volumes       Backup apenas volumes
  all           Backup containers e volumes

Opções:
  --output      Diretório de saída (padrão: ./backups)

Exemplos:
  docker-pilot backup containers
  docker-pilot backup all --output /backups
    `;
  }

  validate(args: string[], options: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validTypes = ['containers', 'volumes', 'all'];

    if (args[0] && !validTypes.includes(args[0])) {
      errors.push(`Tipo inválido: ${args[0]}. Use: ${validTypes.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### 2. Comando de Monitoramento

```typescript
// plugins/monitoring/src/MonitorCommand.ts
import { Command, CommandContext, CommandResult } from '@docker-pilot/types';
import { TimeUtils, ColorUtils } from '@docker-pilot/utils';

export class MonitorCommand implements Command {
  readonly name = 'monitor';
  readonly description = 'Monitora recursos de containers em tempo real';
  readonly category = 'custom';

  private monitoring = false;
  private interval?: NodeJS.Timeout;

  async execute(context: CommandContext): Promise<CommandResult> {
    const { options, logger, docker } = context;

    const refreshRate = parseInt(options.refresh || '5') * 1000;
    const duration = options.duration ? parseInt(options.duration) * 1000 : null;

    logger.info('Iniciando monitoramento (Ctrl+C para parar)...');

    this.monitoring = true;

    // Handler para Ctrl+C
    process.on('SIGINT', () => {
      this.stopMonitoring();
    });

    const startTime = Date.now();

    this.interval = setInterval(async () => {
      if (!this.monitoring) return;

      // Verificar se deve parar por duração
      if (duration && Date.now() - startTime >= duration) {
        this.stopMonitoring();
        return;
      }

      await this.displayStats(docker);
    }, refreshRate);

    // Primeira execução imediata
    await this.displayStats(docker);

    return new Promise((resolve) => {
      const checkStop = setInterval(() => {
        if (!this.monitoring) {
          clearInterval(checkStop);
          resolve({
            success: true,
            exitCode: 0,
            message: 'Monitoramento finalizado',
            executionTime: Date.now() - startTime
          });
        }
      }, 1000);
    });
  }

  private async displayStats(docker: any): Promise<void> {
    // Limpar tela
    console.clear();

    // Header
    console.log(ColorUtils.bold('=== Docker Pilot Monitor ==='));
    console.log(ColorUtils.gray(`Atualizado em: ${new Date().toLocaleTimeString()}\n`));

    try {
      const containers = await docker.listContainers();
      const runningContainers = containers.filter((c: any) => c.status === 'running');

      // Estatísticas gerais
      console.log(ColorUtils.blue('📊 Estatísticas Gerais:'));
      console.log(`Total de containers: ${containers.length}`);
      console.log(`Em execução: ${ColorUtils.green(runningContainers.length.toString())}`);
      console.log(`Parados: ${ColorUtils.red((containers.length - runningContainers.length).toString())}\n`);

      if (runningContainers.length > 0) {
        console.log(ColorUtils.blue('🖥️  Recursos dos Containers:'));
        console.log('Container'.padEnd(20) + 'CPU%'.padEnd(10) + 'Memória'.padEnd(15) + 'Rede I/O'.padEnd(15) + 'Status');
        console.log('-'.repeat(75));

        for (const container of runningContainers) {
          try {
            const stats = await docker.getContainerStats(container.id);
            const cpuPercent = this.calculateCpuPercent(stats);
            const memoryUsage = this.formatMemoryUsage(stats);
            const networkIO = this.formatNetworkIO(stats);

            const name = container.name.substring(0, 18).padEnd(20);
            const cpu = `${cpuPercent.toFixed(1)}%`.padEnd(10);
            const memory = memoryUsage.padEnd(15);
            const network = networkIO.padEnd(15);
            const status = ColorUtils.green('●');

            console.log(`${name}${cpu}${memory}${network}${status}`);
          } catch (error) {
            const name = container.name.substring(0, 18).padEnd(20);
            console.log(`${name}${'N/A'.padEnd(50)} ${ColorUtils.red('●')}`);
          }
        }
      }

      console.log(`\n${ColorUtils.gray('Pressione Ctrl+C para parar o monitoramento')}`);

    } catch (error) {
      console.error(ColorUtils.red(`Erro ao obter estatísticas: ${error}`));
    }
  }

  private calculateCpuPercent(stats: any): number {
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const numberCpus = stats.cpu_stats.online_cpus;

    if (systemDelta > 0 && cpuDelta > 0) {
      return (cpuDelta / systemDelta) * numberCpus * 100;
    }
    return 0;
  }

  private formatMemoryUsage(stats: any): string {
    const used = stats.memory_stats.usage;
    const limit = stats.memory_stats.limit;
    const usedMB = Math.round(used / 1024 / 1024);
    const limitMB = Math.round(limit / 1024 / 1024);
    return `${usedMB}/${limitMB}MB`;
  }

  private formatNetworkIO(stats: any): string {
    let rxBytes = 0;
    let txBytes = 0;

    if (stats.networks) {
      Object.values(stats.networks).forEach((network: any) => {
        rxBytes += network.rx_bytes;
        txBytes += network.tx_bytes;
      });
    }

    const rxMB = (rxBytes / 1024 / 1024).toFixed(1);
    const txMB = (txBytes / 1024 / 1024).toFixed(1);
    return `↓${rxMB} ↑${txMB}`;
  }

  private stopMonitoring(): void {
    this.monitoring = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  getHelp(): string {
    return `
Uso: docker-pilot monitor [opções]

Opções:
  --refresh     Intervalo de atualização em segundos (padrão: 5)
  --duration    Duração do monitoramento em segundos

Exemplos:
  docker-pilot monitor
  docker-pilot monitor --refresh 2
  docker-pilot monitor --duration 60
    `;
  }

  validate(): { valid: boolean; errors: string[] } {
    return { valid: true, errors: [] };
  }
}
```

### 3. Comando de Deploy Automatizado

```typescript
// plugins/deploy/src/DeployCommand.ts
import { Command, CommandContext, CommandResult } from '@docker-pilot/types';
import { FileUtils, DockerUtils, Logger } from '@docker-pilot/utils';

export class DeployCommand implements Command {
  readonly name = 'deploy';
  readonly description = 'Deploy automatizado de aplicações';
  readonly category = 'custom';

  async execute(context: CommandContext): Promise<CommandResult> {
    const { args, options, logger, docker } = context;

    try {
      const configPath = args[0] || './deploy.json';
      const environment = options.env || 'production';

      // Carregar configuração de deploy
      const deployConfig = await this.loadDeployConfig(configPath, environment);

      // Executar pipeline de deploy
      await this.executeDeploy(deployConfig, docker, logger);

      return {
        success: true,
        exitCode: 0,
        message: 'Deploy executado com sucesso',
        executionTime: Date.now() - context.startTime
      };

    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        error: error as Error,
        executionTime: Date.now() - context.startTime
      };
    }
  }

  private async loadDeployConfig(configPath: string, environment: string): Promise<any> {
    if (!await FileUtils.exists(configPath)) {
      throw new Error(`Arquivo de configuração não encontrado: ${configPath}`);
    }

    const configContent = await FileUtils.read(configPath);
    const config = JSON.parse(configContent);

    if (!config.environments || !config.environments[environment]) {
      throw new Error(`Ambiente não encontrado: ${environment}`);
    }

    return {
      ...config.common,
      ...config.environments[environment]
    };
  }

  private async executeDeploy(config: any, docker: any, logger: Logger): Promise<void> {
    logger.info('Iniciando processo de deploy...');

    // 1. Pre-deploy hooks
    if (config.hooks?.preDeploy) {
      await this.executeHooks(config.hooks.preDeploy, logger);
    }

    // 2. Build da aplicação
    if (config.build) {
      await this.buildApplication(config.build, docker, logger);
    }

    // 3. Deploy dos serviços
    if (config.services) {
      await this.deployServices(config.services, docker, logger);
    }

    // 4. Health checks
    if (config.healthChecks) {
      await this.runHealthChecks(config.healthChecks, logger);
    }

    // 5. Post-deploy hooks
    if (config.hooks?.postDeploy) {
      await this.executeHooks(config.hooks.postDeploy, logger);
    }

    logger.info('Deploy concluído com sucesso!');
  }

  private async executeHooks(hooks: string[], logger: Logger): Promise<void> {
    for (const hook of hooks) {
      logger.info(`Executando hook: ${hook}`);
      // Executar comando ou script
      await this.executeCommand(hook);
    }
  }

  private async buildApplication(buildConfig: any, docker: any, logger: Logger): Promise<void> {
    logger.info('Fazendo build da aplicação...');

    const { dockerfile, context, tags } = buildConfig;

    for (const tag of tags) {
      logger.info(`Building imagem: ${tag}`);

      await docker.buildImage({
        dockerfile,
        context,
        tag,
        buildArgs: buildConfig.args || {},
        labels: buildConfig.labels || {}
      });

      // Push para registry se configurado
      if (buildConfig.registry) {
        logger.info(`Enviando para registry: ${tag}`);
        await docker.pushImage(tag);
      }
    }
  }

  private async deployServices(services: any[], docker: any, logger: Logger): Promise<void> {
    logger.info('Fazendo deploy dos serviços...');

    for (const service of services) {
      logger.info(`Fazendo deploy do serviço: ${service.name}`);

      // Parar serviço existente
      try {
        const existingContainers = await docker.listContainers({
          filters: { label: `service=${service.name}` }
        });

        for (const container of existingContainers) {
          logger.info(`Parando container existente: ${container.name}`);
          await docker.stopContainer(container.id);
          await docker.removeContainer(container.id);
        }
      } catch (error) {
        // Ignorar se não houver containers existentes
      }

      // Criar novo container
      const containerId = await docker.createContainer({
        name: service.name,
        image: service.image,
        env: service.environment || [],
        ports: service.ports || [],
        volumes: service.volumes || [],
        networks: service.networks || [],
        labels: {
          service: service.name,
          version: service.version || 'latest'
        },
        restart: service.restart || 'unless-stopped'
      });

      // Iniciar container
      await docker.startContainer(containerId);
      logger.info(`Serviço ${service.name} iniciado: ${containerId}`);
    }
  }

  private async runHealthChecks(healthChecks: any[], logger: Logger): Promise<void> {
    logger.info('Executando health checks...');

    for (const check of healthChecks) {
      logger.info(`Health check: ${check.name}`);

      const maxRetries = check.retries || 5;
      const delay = check.delay || 5000;

      for (let i = 0; i < maxRetries; i++) {
        try {
          await this.executeHealthCheck(check);
          logger.info(`✅ Health check ${check.name} passou`);
          break;
        } catch (error) {
          if (i === maxRetries - 1) {
            throw new Error(`Health check ${check.name} falhou após ${maxRetries} tentativas`);
          }

          logger.warn(`Health check ${check.name} falhou, tentativa ${i + 1}/${maxRetries}`);
          await TimeUtils.sleep(delay);
        }
      }
    }
  }

  private async executeHealthCheck(check: any): Promise<void> {
    switch (check.type) {
      case 'http':
        await this.httpHealthCheck(check.url, check.expectedStatus || 200);
        break;
      case 'tcp':
        await this.tcpHealthCheck(check.host, check.port);
        break;
      case 'command':
        await this.executeCommand(check.command);
        break;
      default:
        throw new Error(`Tipo de health check não suportado: ${check.type}`);
    }
  }

  private async httpHealthCheck(url: string, expectedStatus: number): Promise<void> {
    const response = await fetch(url);
    if (response.status !== expectedStatus) {
      throw new Error(`HTTP ${response.status}, esperado ${expectedStatus}`);
    }
  }

  private async tcpHealthCheck(host: string, port: number): Promise<void> {
    import net  from "net";

    return new Promise((resolve, reject) => {
      const socket = new net.Socket();

      socket.setTimeout(5000);

      socket.connect(port, host, () => {
        socket.destroy();
        resolve();
      });

      socket.on('error', (error) => {
        reject(error);
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  private async executeCommand(command: string): Promise<void> {
    import { execSync }  from "child_process";
    execSync(command, { stdio: 'inherit' });
  }

  getHelp(): string {
    return `
Uso: docker-pilot deploy [arquivo-config] [opções]

Argumentos:
  arquivo-config    Arquivo de configuração do deploy (padrão: ./deploy.json)

Opções:
  --env            Ambiente para deploy (padrão: production)

Exemplo de arquivo de configuração:
{
  "common": {
    "registry": "myregistry.com"
  },
  "environments": {
    "production": {
      "build": {
        "dockerfile": "./Dockerfile",
        "context": ".",
        "tags": ["myapp:latest"],
        "registry": true
      },
      "services": [
        {
          "name": "web-app",
          "image": "myapp:latest",
          "ports": ["80:3000"],
          "environment": ["NODE_ENV=production"]
        }
      ],
      "healthChecks": [
        {
          "name": "web-health",
          "type": "http",
          "url": "http://localhost/health"
        }
      ]
    }
  }
}

Exemplos:
  docker-pilot deploy
  docker-pilot deploy ./my-deploy.json --env staging
    `;
  }

  validate(): { valid: boolean; errors: string[] } {
    return { valid: true, errors: [] };
  }
}
```

## Plugin de Integração com Cloud

### AWS Plugin

```typescript
// plugins/aws/src/AWSPlugin.ts
import { Plugin, PluginContext } from '@docker-pilot/types';
import { ECRCommand } from './commands/ECRCommand';
import { ECSCommand } from './commands/ECSCommand';

export default class AWSPlugin implements Plugin {
  readonly name = 'aws-integration';
  readonly version = '1.0.0';
  readonly description = 'Integração com serviços AWS';
  readonly author = 'Docker Pilot Team';

  async initialize(context: PluginContext): Promise<void> {
    // Verificar credenciais AWS
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      context.logger.warn('Credenciais AWS não configuradas');
    }

    context.logger.info('Plugin AWS inicializado');
  }

  async destroy(): Promise<void> {
    // Cleanup
  }

  getCommands() {
    return [
      new ECRCommand(),
      new ECSCommand()
    ];
  }
}

// plugins/aws/src/commands/ECRCommand.ts
export class ECRCommand implements Command {
  readonly name = 'ecr';
  readonly description = 'Gerencia repositórios ECR';
  readonly category = 'aws';

  async execute(context: CommandContext): Promise<CommandResult> {
    const { args, options } = context;
    const action = args[0];

    switch (action) {
      case 'login':
        return await this.login(context);
      case 'push':
        return await this.push(context);
      case 'list':
        return await this.listRepositories(context);
      default:
        throw new Error(`Ação inválida: ${action}`);
    }
  }

  private async login(context: CommandContext): Promise<CommandResult> {
    // Implementar login ECR
    import { execSync }  from "child_process";

    try {
      const command = 'aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com';
      execSync(command, { stdio: 'inherit' });

      return {
        success: true,
        exitCode: 0,
        message: 'Login ECR realizado com sucesso',
        executionTime: 0
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        error: error as Error,
        executionTime: 0
      };
    }
  }

  private async push(context: CommandContext): Promise<CommandResult> {
    // Implementar push para ECR
    // ...
  }

  // ... outros métodos
}
```

## Plugin de Notificações

```typescript
// plugins/notifications/src/NotificationPlugin.ts
import { Plugin, PluginContext, PluginHooks } from '@docker-pilot/types';

export default class NotificationPlugin implements Plugin {
  readonly name = 'notifications';
  readonly version = '1.0.0';
  readonly description = 'Sistema de notificações para Docker Pilot';
  readonly author = 'Docker Pilot Team';

  private config: any;

  async initialize(context: PluginContext): Promise<void> {
    this.config = context.config.plugins?.notifications || {};
    context.logger.info('Plugin de notificações inicializado');
  }

  async destroy(): Promise<void> {
    // Cleanup
  }

  getHooks(): PluginHooks {
    return {
      afterCommand: this.onCommandComplete.bind(this),
      onError: this.onCommandError.bind(this)
    };
  }

  private async onCommandComplete(context: any, result: any): Promise<void> {
    if (this.config.notifyOnSuccess && this.isImportantCommand(context.args[0])) {
      await this.sendNotification({
        type: 'success',
        title: 'Comando executado com sucesso',
        message: `${context.args[0]} executado em ${result.executionTime}ms`,
        command: context.args[0]
      });
    }
  }

  private async onCommandError(context: any, error: Error): Promise<void> {
    if (this.config.notifyOnError) {
      await this.sendNotification({
        type: 'error',
        title: 'Erro na execução do comando',
        message: `${context.args[0]}: ${error.message}`,
        command: context.args[0]
      });
    }
  }

  private isImportantCommand(command: string): boolean {
    const importantCommands = ['deploy', 'build', 'backup', 'restore'];
    return importantCommands.includes(command);
  }

  private async sendNotification(notification: any): Promise<void> {
    const notifiers = this.config.notifiers || [];

    for (const notifier of notifiers) {
      switch (notifier.type) {
        case 'slack':
          await this.sendSlackNotification(notifier, notification);
          break;
        case 'discord':
          await this.sendDiscordNotification(notifier, notification);
          break;
        case 'email':
          await this.sendEmailNotification(notifier, notification);
          break;
        case 'desktop':
          await this.sendDesktopNotification(notification);
          break;
      }
    }
  }

  private async sendSlackNotification(config: any, notification: any): Promise<void> {
    const payload = {
      text: notification.title,
      attachments: [{
        color: notification.type === 'success' ? 'good' : 'danger',
        text: notification.message,
        fields: [{
          title: 'Comando',
          value: notification.command,
          short: true
        }]
      }]
    };

    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  private async sendDesktopNotification(notification: any): Promise<void> {
    import notifier  from "node-notifier";

    notifier.notify({
      title: notification.title,
      message: notification.message,
      icon: notification.type === 'success' ? '✅' : '❌',
      sound: true
    });
  }

  // ... outros métodos de notificação
}
```

## Instalação e Uso de Plugins

### Instalação via NPM

```bash
# Instalar plugin do registry npm
npm install -g @docker-pilot/plugin-backup

# Instalar plugin local
npm install -g ./meu-plugin

# Instalar plugin diretamente do GitHub
npm install -g https://github.com/user/docker-pilot-plugin.git
```

### Configuração

```json
// docker-pilot.config.json
{
  "plugins": {
    "enabled": [
      "@docker-pilot/plugin-backup",
      "@docker-pilot/plugin-aws",
      "./plugins/custom-plugin"
    ],
    "backup": {
      "defaultOutputDir": "/backups",
      "compression": true
    },
    "notifications": {
      "notifyOnSuccess": true,
      "notifyOnError": true,
      "notifiers": [
        {
          "type": "slack",
          "webhookUrl": "https://hooks.slack.com/..."
        }
      ]
    }
  }
}
```

### Uso

```bash
# Usar comandos do plugin
docker-pilot backup containers --output /tmp/backups
docker-pilot deploy ./my-app.json --env production
docker-pilot monitor --refresh 2

# Usar comandos AWS
docker-pilot ecr login
docker-pilot ecr push my-image:latest
docker-pilot ecs deploy my-service
```

## Desenvolvimento de Plugins

### Template de Plugin

```bash
# Criar novo plugin usando template
npx create-docker-pilot-plugin meu-plugin

# Estrutura gerada:
meu-plugin/
├── src/
│   ├── index.ts
│   ├── commands/
│   └── types.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

### Teste de Plugins

```typescript
// tests/MeuPlugin.test.ts
import MeuPlugin from '../src/index';
import { MockPluginContext } from '@docker-pilot/test-utils';

describe('MeuPlugin', () => {
  let plugin: MeuPlugin;
  let mockContext: MockPluginContext;

  beforeEach(() => {
    plugin = new MeuPlugin();
    mockContext = new MockPluginContext();
  });

  test('should initialize correctly', async () => {
    await plugin.initialize(mockContext);

    expect(mockContext.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('inicializado')
    );
  });

  test('should provide commands', () => {
    const commands = plugin.getCommands();

    expect(commands).toBeDefined();
    expect(commands.length).toBeGreaterThan(0);
  });
});
```

### Publicação

```bash
# Build do plugin
npm run build

# Teste local
npm link
docker-pilot # testar comandos

# Publicar no npm
npm publish

# Publicar no GitHub Packages
npm publish --registry=https://npm.pkg.github.com
```

## Melhores Práticas

### 1. Design de Plugin
- Mantenha plugins focados em uma responsabilidade
- Use nomes descritivos para comandos
- Implemente validação robusta
- Forneça ajuda detalhada

### 2. Tratamento de Erros
```typescript
try {
  // Operação do plugin
} catch (error) {
  context.logger.error(`Erro no plugin ${this.name}:`, error);
  throw new PluginError(`Plugin ${this.name} falhou: ${error.message}`);
}
```

### 3. Configuração
```typescript
// Sempre verificar configuração
const config = context.config.plugins?.[this.name] || {};
const timeout = config.timeout || 30000;
```

### 4. Recursos
```typescript
// Limpar recursos no destroy
async destroy(): Promise<void> {
  if (this.connection) {
    await this.connection.close();
  }
  if (this.interval) {
    clearInterval(this.interval);
  }
}
```

### 5. Testes
- Teste todas as funcionalidades do plugin
- Use mocks para dependências externas
- Teste cenários de erro
- Teste integração com Docker Pilot

Os plugins permitem estender o Docker Pilot de forma poderosa e flexível, mantendo o core limpo e focado nas funcionalidades essenciais.
