# Utilities API

This module contains essential utilities for Docker Pilot functionality.

## Overview

Docker Pilot utilities provide auxiliary functionalities for file manipulation, logging, validation, and Docker integration. They are designed to be reusable and efficient.

## DockerUtils

Utilities for Docker interaction.

### DockerUtils Class

```typescript
class DockerUtils {
  static async isDockerRunning(): Promise<boolean>;
  static async getDockerVersion(): Promise<string>;
  static async listContainers(options?: ListOptions): Promise<Container[]>;
  static async listImages(options?: ListOptions): Promise<Image[]>;
  static async listVolumes(): Promise<Volume[]>;
  static async listNetworks(): Promise<Network[]>;
}
```

### Main Methods

#### isDockerRunning()

Checks if Docker is running.

```typescript
const isRunning = await DockerUtils.isDockerRunning();
if (!isRunning) {
  throw new Error('Docker is not running');
}
```

#### getDockerVersion()

Gets the installed Docker version.

```typescript
const version = await DockerUtils.getDockerVersion();
console.log(`Docker version: ${version}`);
```

#### listContainers()

Lists containers with filter options.

```typescript
interface ListOptions {
  all?: boolean;
  running?: boolean;
  filters?: Record<string, string>;
  format?: string;
}

const containers = await DockerUtils.listContainers({
  all: true,
  filters: { status: 'running' }
});
```

#### getContainerInfo()

Obtém informações detalhadas de um container.

```typescript
const info = await DockerUtils.getContainerInfo('container-name');
console.log(info);
```

#### executeInContainer()

Executa comandos dentro de um container.

```typescript
const result = await DockerUtils.executeInContainer(
  'container-name',
  ['ls', '-la', '/app']
);
```

### Utilitários de Imagem

#### pullImage()

Baixa uma imagem Docker.

```typescript
await DockerUtils.pullImage('nginx:latest', {
  onProgress: (progress) => console.log(progress)
});
```

#### buildImage()

Constrói uma imagem Docker.

```typescript
await DockerUtils.buildImage('/path/to/dockerfile', {
  tag: 'myapp:latest',
  noCache: true,
  buildArgs: { NODE_ENV: 'production' }
});
```

#### removeImage()

Remove uma imagem Docker.

```typescript
await DockerUtils.removeImage('image-id', {
  force: true,
  noPrune: false
});
```

### Utilitários de Volume

#### createVolume()

Cria um volume Docker.

```typescript
const volume = await DockerUtils.createVolume('my-volume', {
  driver: 'local',
  labels: { app: 'myapp' }
});
```

#### removeVolume()

Remove um volume Docker.

```typescript
await DockerUtils.removeVolume('my-volume', {
  force: true
});
```

### Utilitários de Rede

#### createNetwork()

Cria uma rede Docker.

```typescript
const network = await DockerUtils.createNetwork('my-network', {
  driver: 'bridge',
  subnet: '172.20.0.0/16'
});
```

#### connectToNetwork()

Conecta um container a uma rede.

```typescript
await DockerUtils.connectToNetwork('my-network', 'container-name');
```

## FileUtils

Utilitários para manipulação de arquivos.

### Classe FileUtils

```typescript
class FileUtils {
  static async exists(path: string): Promise<boolean>;
  static async read(path: string): Promise<string>;
  static async write(path: string, content: string): Promise<void>;
  static async copy(source: string, destination: string): Promise<void>;
  static async move(source: string, destination: string): Promise<void>;
  static async delete(path: string): Promise<void>;
  static async createDir(path: string): Promise<void>;
  static async listDir(path: string): Promise<string[]>;
}
```

### Métodos Principais

#### exists()

Verifica se um arquivo ou diretório existe.

```typescript
const exists = await FileUtils.exists('/path/to/file');
if (!exists) {
  throw new Error('Arquivo não encontrado');
}
```

#### read()

Lê o conteúdo de um arquivo.

```typescript
const content = await FileUtils.read('/path/to/file.txt');
console.log(content);
```

#### write()

Escreve conteúdo em um arquivo.

```typescript
await FileUtils.write('/path/to/file.txt', 'Hello World');
```

#### copy()

Copia um arquivo ou diretório.

```typescript
await FileUtils.copy('/source/file.txt', '/destination/file.txt');
```

#### createDir()

Cria um diretório recursivamente.

```typescript
await FileUtils.createDir('/path/to/new/directory');
```

### Utilitários para Docker Files

#### findDockerfile()

Encontra Dockerfile em um diretório.

```typescript
const dockerfilePath = await FileUtils.findDockerfile('/project/path');
```

#### parseDockerfile()

Analisa um Dockerfile e retorna instruções.

```typescript
const instructions = await FileUtils.parseDockerfile('/path/to/Dockerfile');
```

#### generateDockerignore()

Gera um arquivo .dockerignore.

```typescript
await FileUtils.generateDockerignore('/project/path', [
  'node_modules',
  '*.log',
  '.git'
]);
```

### Utilitários para Compose Files

#### findComposeFile()

Encontra arquivo docker-compose.yml.

```typescript
const composePath = await FileUtils.findComposeFile('/project/path');
```

#### parseComposeFile()

Analisa um arquivo docker-compose.yml.

```typescript
const composeConfig = await FileUtils.parseComposeFile('/path/to/compose.yml');
```

#### validateComposeFile()

Valida um arquivo docker-compose.yml.

```typescript
const isValid = await FileUtils.validateComposeFile('/path/to/compose.yml');
```

## Logger

Sistema de logging avançado.

### Classe Logger

```typescript
class Logger {
  static debug(message: string, meta?: any): void;
  static info(message: string, meta?: any): void;
  static warn(message: string, meta?: any): void;
  static error(message: string, error?: Error, meta?: any): void;
  static setLevel(level: LogLevel): void;
  static addTransport(transport: LogTransport): void;
}
```

### Níveis de Log

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}
```

### Uso Básico

```typescript
Logger.info('Aplicação iniciada');
Logger.debug('Configuração carregada', { config });
Logger.warn('Recurso deprecated usado');
Logger.error('Erro ao conectar', error);
```

### Transportes de Log

#### ConsoleTransport

Saída para console com cores.

```typescript
const consoleTransport = new ConsoleTransport({
  level: LogLevel.INFO,
  colors: true,
  timestamp: true
});

Logger.addTransport(consoleTransport);
```

#### FileTransport

Saída para arquivo.

```typescript
const fileTransport = new FileTransport({
  filename: 'app.log',
  level: LogLevel.ERROR,
  maxSize: '10MB',
  maxFiles: 5
});

Logger.addTransport(fileTransport);
```

#### WebhookTransport

Saída para webhook/API.

```typescript
const webhookTransport = new WebhookTransport({
  url: 'https://api.example.com/logs',
  headers: { 'Authorization': 'Bearer token' },
  level: LogLevel.ERROR
});

Logger.addTransport(webhookTransport);
```

### Formatação Personalizada

```typescript
const customFormat = (log: LogEntry) => {
  return `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`;
};

Logger.setFormatter(customFormat);
```

## ValidationUtils

Utilitários para validação de dados.

### Classe ValidationUtils

```typescript
class ValidationUtils {
  static isValidContainerName(name: string): boolean;
  static isValidImageName(name: string): boolean;
  static isValidTag(tag: string): boolean;
  static isValidPort(port: string | number): boolean;
  static isValidPath(path: string): boolean;
  static isValidUrl(url: string): boolean;
  static isValidEmail(email: string): boolean;
}
```

### Validações Docker

#### isValidContainerName()

Valida nome de container.

```typescript
const isValid = ValidationUtils.isValidContainerName('my-app-1');
// true - nome válido

const isInvalid = ValidationUtils.isValidContainerName('My_App!');
// false - caracteres inválidos
```

#### isValidImageName()

Valida nome de imagem.

```typescript
const isValid = ValidationUtils.isValidImageName('nginx:latest');
// true

const isInvalid = ValidationUtils.isValidImageName('NGINX:LATEST');
// false - maiúsculas não permitidas
```

#### isValidTag()

Valida tag de imagem.

```typescript
const isValid = ValidationUtils.isValidTag('v1.0.0');
// true

const isInvalid = ValidationUtils.isValidTag('v1.0.0@latest');
// false - caracteres inválidos
```

### Validações de Rede

#### isValidPort()

Valida número de porta.

```typescript
const isValid = ValidationUtils.isValidPort(8080);
// true

const isInvalid = ValidationUtils.isValidPort(70000);
// false - porta fora do range
```

#### isValidIPAddress()

Valida endereço IP.

```typescript
const isValid = ValidationUtils.isValidIPAddress('192.168.1.1');
// true

const isInvalid = ValidationUtils.isValidIPAddress('999.999.999.999');
// false - IP inválido
```

### Validador de Schema

#### validate()

Valida objeto contra schema.

```typescript
const schema = {
  name: { type: 'string', required: true },
  port: { type: 'number', min: 1, max: 65535 },
  enabled: { type: 'boolean', default: true }
};

const result = ValidationUtils.validate(data, schema);
if (!result.valid) {
  console.error('Erros de validação:', result.errors);
}
```

### Validador de Configuração

#### validateConfig()

Valida configuração do Docker Pilot.

```typescript
const config = {
  docker: {
    host: 'unix:///var/run/docker.sock',
    timeout: 30000
  },
  logging: {
    level: 'info',
    file: 'docker-pilot.log'
  }
};

const isValid = ValidationUtils.validateConfig(config);
```

## ProcessUtils

Utilitários para execução de processos.

### Classe ProcessUtils

```typescript
class ProcessUtils {
  static async exec(command: string, options?: ExecOptions): Promise<ExecResult>;
  static async spawn(command: string, args: string[], options?: SpawnOptions): Promise<ChildProcess>;
  static async execWithTimeout(command: string, timeout: number): Promise<ExecResult>;
  static killProcess(pid: number, signal?: string): void;
}
```

### Execução de Comandos

#### exec()

Executa comando e retorna resultado.

```typescript
const result = await ProcessUtils.exec('docker ps -a');
console.log(result.stdout);

if (result.stderr) {
  console.error(result.stderr);
}
```

#### spawn()

Inicia processo filho com streaming.

```typescript
const child = await ProcessUtils.spawn('docker', ['logs', '-f', 'container']);

child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});
```

#### execWithTimeout()

Executa comando com timeout.

```typescript
try {
  const result = await ProcessUtils.execWithTimeout('docker build .', 300000); // 5 minutos
  console.log('Build concluído:', result.stdout);
} catch (error) {
  if (error.code === 'TIMEOUT') {
    console.error('Build excedeu o tempo limite');
  }
}
```

### Utilitários de Sistema

#### getSystemInfo()

Obtém informações do sistema.

```typescript
const info = await ProcessUtils.getSystemInfo();
console.log({
  platform: info.platform,
  arch: info.arch,
  memory: info.memory,
  cpus: info.cpus
});
```

#### checkCommand()

Verifica se um comando está disponível.

```typescript
const dockerAvailable = await ProcessUtils.checkCommand('docker');
if (!dockerAvailable) {
  throw new Error('Docker não está instalado');
}
```

## StringUtils

Utilitários para manipulação de strings.

### Classe StringUtils

```typescript
class StringUtils {
  static slugify(text: string): string;
  static truncate(text: string, length: number): string;
  static camelCase(text: string): string;
  static kebabCase(text: string): string;
  static snakeCase(text: string): string;
  static capitalize(text: string): string;
  static randomString(length: number): string;
}
```

### Métodos de Formatação

#### slugify()

Converte texto para slug.

```typescript
const slug = StringUtils.slugify('My Docker App');
// 'my-docker-app'
```

#### truncate()

Trunca texto com ellipsis.

```typescript
const truncated = StringUtils.truncate('Long container name', 10);
// 'Long co...'
```

#### camelCase()

Converte para camelCase.

```typescript
const camel = StringUtils.camelCase('docker-pilot-app');
// 'dockerPilotApp'
```

### Utilitários de Template

#### template()

Processa template com variáveis.

```typescript
const template = 'Container {{name}} is {{status}}';
const result = StringUtils.template(template, {
  name: 'nginx',
  status: 'running'
});
// 'Container nginx is running'
```

#### escapeShell()

Escapa string para shell.

```typescript
const escaped = StringUtils.escapeShell('file with spaces.txt');
// '"file with spaces.txt"'
```

## TimeUtils

Utilitários para manipulação de tempo.

### Classe TimeUtils

```typescript
class TimeUtils {
  static formatDuration(ms: number): string;
  static formatDate(date: Date, format?: string): string;
  static parseDate(dateString: string): Date;
  static addTime(date: Date, amount: number, unit: TimeUnit): Date;
  static sleep(ms: number): Promise<void>;
}
```

### Formatação de Tempo

#### formatDuration()

Formata duração em formato legível.

```typescript
const duration = TimeUtils.formatDuration(125000);
// '2m 5s'
```

#### formatDate()

Formata data.

```typescript
const formatted = TimeUtils.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
// '2024-01-15 10:30:45'
```

#### sleep()

Pausa execução por tempo determinado.

```typescript
await TimeUtils.sleep(1000); // 1 segundo
console.log('Executado após 1 segundo');
```

## ColorUtils

Utilitários para colorização de terminal.

### Classe ColorUtils

```typescript
class ColorUtils {
  static red(text: string): string;
  static green(text: string): string;
  static yellow(text: string): string;
  static blue(text: string): string;
  static cyan(text: string): string;
  static magenta(text: string): string;
  static gray(text: string): string;
  static bold(text: string): string;
  static underline(text: string): string;
}
```

### Uso com Logs

```typescript
console.log(ColorUtils.green('✓ Container iniciado com sucesso'));
console.log(ColorUtils.red('✗ Erro ao parar container'));
console.log(ColorUtils.yellow('⚠ Aviso: Container já está rodando'));
console.log(ColorUtils.blue('ℹ Informação: 5 containers rodando'));
```

### Utilitários de Formatação

#### colorize()

Coloriza texto baseado em tipo.

```typescript
const colorized = ColorUtils.colorize('running', 'status');
// Verde para 'running', vermelho para 'exited', etc.
```

#### progressBar()

Cria barra de progresso colorida.

```typescript
const bar = ColorUtils.progressBar(0.75, 20);
// [████████████████░░░░] 75%
```

## Exemplos de Uso Combinado

### Exemplo 1: Verificação e Inicialização

```typescript
import { DockerUtils, Logger, ValidationUtils } from '@docker-pilot/utils';

async function initializeApp() {
  try {
    // Verificar se Docker está rodando
    if (!await DockerUtils.isDockerRunning()) {
      throw new Error('Docker não está em execução');
    }

    // Obter versão
    const version = await DockerUtils.getDockerVersion();
    Logger.info(`Docker versão: ${version}`);

    // Validar configuração
    if (!ValidationUtils.validateConfig(config)) {
      throw new Error('Configuração inválida');
    }

    Logger.info('Aplicação inicializada com sucesso');
  } catch (error) {
    Logger.error('Erro na inicialização', error);
    process.exit(1);
  }
}
```

### Exemplo 2: Deploy Automatizado

```typescript
import { DockerUtils, FileUtils, ProcessUtils, Logger } from '@docker-pilot/utils';

async function deployApp(appPath: string, imageName: string) {
  try {
    // Verificar se Dockerfile existe
    const dockerfilePath = await FileUtils.findDockerfile(appPath);
    if (!dockerfilePath) {
      throw new Error('Dockerfile não encontrado');
    }

    // Build da imagem
    Logger.info('Iniciando build da imagem...');
    await DockerUtils.buildImage(appPath, {
      tag: imageName,
      noCache: false
    });

    // Push para registry
    Logger.info('Enviando imagem para registry...');
    await DockerUtils.pushImage(imageName);

    // Deploy
    Logger.info('Fazendo deploy...');
    const containers = await DockerUtils.listContainers({
      filters: { label: `app=${imageName}` }
    });

    for (const container of containers) {
      await DockerUtils.stopContainer(container.id);
      await DockerUtils.removeContainer(container.id);
    }

    const newContainer = await DockerUtils.runContainer(imageName, {
      detach: true,
      labels: { app: imageName },
      ports: { '3000': '3000' }
    });

    Logger.info(`Deploy concluído. Container: ${newContainer.id}`);
  } catch (error) {
    Logger.error('Erro no deploy', error);
    throw error;
  }
}
```

### Exemplo 3: Monitoramento

```typescript
import { DockerUtils, TimeUtils, Logger, ColorUtils } from '@docker-pilot/utils';

async function monitorContainers() {
  while (true) {
    try {
      const containers = await DockerUtils.listContainers({ all: true });

      console.clear();
      console.log(ColorUtils.bold('=== Status dos Containers ===\n'));

      for (const container of containers) {
        const status = container.state === 'running'
          ? ColorUtils.green('●')
          : ColorUtils.red('●');

        const uptime = container.state === 'running'
          ? TimeUtils.formatDuration(Date.now() - container.startedAt)
          : 'Parado';

        console.log(`${status} ${container.name} - ${uptime}`);
      }

      await TimeUtils.sleep(5000); // Atualiza a cada 5 segundos
    } catch (error) {
      Logger.error('Erro no monitoramento', error);
      await TimeUtils.sleep(10000);
    }
  }
}
```

## Configuração de Utilitários

### UtilsConfig

Configuração global para utilitários.

```typescript
interface UtilsConfig {
  docker: {
    timeout: number;
    retries: number;
    host?: string;
  };
  logging: {
    level: LogLevel;
    transports: LogTransport[];
  };
  validation: {
    strict: boolean;
    customRules: ValidationRule[];
  };
}
```

### Inicialização

```typescript
import { UtilsConfig } from '@docker-pilot/utils';

const config: UtilsConfig = {
  docker: {
    timeout: 30000,
    retries: 3,
    host: 'unix:///var/run/docker.sock'
  },
  logging: {
    level: LogLevel.INFO,
    transports: [
      new ConsoleTransport(),
      new FileTransport({ filename: 'app.log' })
    ]
  },
  validation: {
    strict: true,
    customRules: []
  }
};

await UtilsConfig.initialize(config);
```
