# Types API

This module contains all TypeScript type definitions used in Docker Pilot.

## Overview

Docker Pilot's type system is designed to provide complete type safety, facilitating development and reducing runtime errors. All types are exported from a central module for easy import.

## Core Types

### DockerPilotConfig

Main application configuration.

```typescript
interface DockerPilotConfig {
  /** Docker settings */
  docker: DockerConfig;

  /** Logging settings */
  logging: LoggingConfig;

  /** Interface settings */
  ui: UIConfig;

  /** Plugin settings */
  plugins: PluginConfig;

  /** Language settings */
  i18n: I18nConfig;

  /** Advanced settings */
  advanced?: AdvancedConfig;
}
```

### DockerConfig

Docker-specific configurations.

```typescript
interface DockerConfig {
  /** Docker host (socket or TCP) */
  host: string;

  /** Timeout for operations in ms */
  timeout: number;

  /** Number of retries for failed operations */
  retries: number;

  /** Versão mínima do Docker requerida */
  minVersion?: string;

  /** Configurações do Docker Compose */
  compose?: ComposeConfig;

  /** Configurações do Docker Swarm */
  swarm?: SwarmConfig;
}
```

### LoggingConfig

Configurações de logging.

```typescript
interface LoggingConfig {
  /** Nível de log */
  level: LogLevel;

  /** Formato de saída */
  format: LogFormat;

  /** Transportes de log */
  transports: LogTransport[];

  /** Arquivo de log */
  file?: string;

  /** Rotação de logs */
  rotation?: LogRotationConfig;
}
```

## Tipos de Container

### Container

Representação de um container Docker.

```typescript
interface Container {
  /** ID único do container */
  id: string;

  /** Nome do container */
  name: string;

  /** Imagem utilizada */
  image: string;

  /** Status atual */
  status: ContainerStatus;

  /** Estado do container */
  state: ContainerState;

  /** Timestamp de criação */
  created: Date;

  /** Timestamp de início */
  started?: Date;

  /** Portas mapeadas */
  ports: PortMapping[];

  /** Volumes montados */
  mounts: VolumeMount[];

  /** Variáveis de ambiente */
  environment: Record<string, string>;

  /** Labels do container */
  labels: Record<string, string>;

  /** Configurações de rede */
  networks: NetworkConnection[];

  /** Estatísticas de recursos */
  stats?: ContainerStats;
}
```

### ContainerStatus

Status possíveis de um container.

```typescript
type ContainerStatus =
  | 'created'
  | 'running'
  | 'paused'
  | 'restarting'
  | 'removing'
  | 'exited'
  | 'dead';
```

### ContainerState

Estado detalhado do container.

```typescript
interface ContainerState {
  /** Status atual */
  status: ContainerStatus;

  /** Container está rodando */
  running: boolean;

  /** Container está pausado */
  paused: boolean;

  /** Container está reiniciando */
  restarting: boolean;

  /** Container foi morto por OOM */
  oomKilled: boolean;

  /** PID do processo principal */
  pid: number;

  /** Código de saída */
  exitCode?: number;

  /** Mensagem de erro */
  error?: string;

  /** Timestamp de início */
  startedAt?: Date;

  /** Timestamp de finalização */
  finishedAt?: Date;
}
```

### ContainerCreateOptions

Opções para criação de container.

```typescript
interface ContainerCreateOptions {
  /** Nome do container */
  name?: string;

  /** Hostname do container */
  hostname?: string;

  /** Comando a ser executado */
  cmd?: string[];

  /** Entrypoint do container */
  entrypoint?: string[];

  /** Variáveis de ambiente */
  env?: string[] | Record<string, string>;

  /** Diretório de trabalho */
  workingDir?: string;

  /** Usuário do container */
  user?: string;

  /** TTY e stdin */
  tty?: boolean;
  stdin?: boolean;

  /** Mapeamento de portas */
  ports?: PortMapping[];

  /** Volumes a montar */
  volumes?: VolumeMount[];

  /** Redes a conectar */
  networks?: string[];

  /** Labels do container */
  labels?: Record<string, string>;

  /** Configurações de recursos */
  resources?: ResourceConfig;

  /** Política de reinício */
  restart?: RestartPolicy;

  /** Configurações de segurança */
  security?: SecurityConfig;
}
```

### ContainerStats

Estatísticas de uso de recursos.

```typescript
interface ContainerStats {
  /** Uso de CPU */
  cpu: {
    usage: number;
    systemUsage: number;
    cores: number;
    throttling: {
      periods: number;
      throttledPeriods: number;
      throttledTime: number;
    };
  };

  /** Uso de memória */
  memory: {
    usage: number;
    limit: number;
    maxUsage: number;
    cache: number;
    rss: number;
    swap: number;
  };

  /** I/O de rede */
  network: Record<string, {
    rxBytes: number;
    rxPackets: number;
    rxErrors: number;
    rxDropped: number;
    txBytes: number;
    txPackets: number;
    txErrors: number;
    txDropped: number;
  }>;

  /** I/O de disco */
  blockIO: {
    read: number;
    write: number;
    readOps: number;
    writeOps: number;
  };

  /** PIDs */
  pids: {
    current: number;
    limit: number;
  };

  /** Timestamp das estatísticas */
  timestamp: Date;
}
```

## Tipos de Imagem

### Image

Representação de uma imagem Docker.

```typescript
interface Image {
  /** ID da imagem */
  id: string;

  /** Tags da imagem */
  tags: string[];

  /** Digest da imagem */
  digest?: string;

  /** Tamanho em bytes */
  size: number;

  /** Tamanho virtual */
  virtualSize: number;

  /** Timestamp de criação */
  created: Date;

  /** ID da imagem pai */
  parent?: string;

  /** Arquitetura */
  architecture: string;

  /** Sistema operacional */
  os: string;

  /** Configuração da imagem */
  config: ImageConfig;

  /** Metadados */
  metadata: ImageMetadata;

  /** Labels da imagem */
  labels: Record<string, string>;
}
```

### ImageConfig

Configuração de uma imagem.

```typescript
interface ImageConfig {
  /** Usuário padrão */
  user?: string;

  /** Portas expostas */
  exposedPorts?: Record<string, {}>;

  /** Variáveis de ambiente */
  env?: string[];

  /** Comando padrão */
  cmd?: string[];

  /** Entrypoint */
  entrypoint?: string[];

  /** Diretório de trabalho */
  workingDir?: string;

  /** Volumes */
  volumes?: Record<string, {}>;

  /** Labels */
  labels?: Record<string, string>;
}
```

### ImageBuildOptions

Opções para build de imagem.

```typescript
interface ImageBuildOptions {
  /** Nome e tag da imagem */
  tag?: string;

  /** Caminho para Dockerfile */
  dockerfile?: string;

  /** Contexto de build */
  context: string;

  /** Argumentos de build */
  buildArgs?: Record<string, string>;

  /** Labels da imagem */
  labels?: Record<string, string>;

  /** Não usar cache */
  noCache?: boolean;

  /** Forçar remoção de containers intermediários */
  forceRm?: boolean;

  /** Sempre puxar imagem base */
  pull?: boolean;

  /** Plataforma de destino */
  platform?: string;

  /** Callback de progresso */
  onProgress?: (progress: BuildProgress) => void;
}
```

### BuildProgress

Progresso do build de imagem.

```typescript
interface BuildProgress {
  /** ID do step */
  id?: string;

  /** Texto do progresso */
  stream?: string;

  /** Status do progresso */
  status?: string;

  /** Detalhes do progresso */
  progressDetail?: {
    current: number;
    total: number;
  };

  /** Informações auxiliares */
  aux?: any;

  /** Erro, se houver */
  error?: string;
}
```

## Tipos de Volume

### Volume

Representação de um volume Docker.

```typescript
interface Volume {
  /** Nome do volume */
  name: string;

  /** Driver do volume */
  driver: string;

  /** Ponto de montagem */
  mountpoint: string;

  /** Timestamp de criação */
  created: Date;

  /** Status do volume */
  status?: Record<string, any>;

  /** Labels do volume */
  labels: Record<string, string>;

  /** Opções do volume */
  options: Record<string, string>;

  /** Escopo do volume */
  scope: 'local' | 'global';

  /** Uso do volume */
  usage?: VolumeUsage;
}
```

### VolumeMount

Montagem de volume em container.

```typescript
interface VolumeMount {
  /** Tipo de montagem */
  type: 'bind' | 'volume' | 'tmpfs';

  /** Origem (host ou volume) */
  source: string;

  /** Destino no container */
  destination: string;

  /** Modo de montagem */
  mode?: string;

  /** Read-only */
  readOnly?: boolean;

  /** Propagação */
  propagation?: 'rprivate' | 'private' | 'rshared' | 'shared' | 'rslave' | 'slave';

  /** Configurações específicas */
  bindOptions?: BindOptions;
  volumeOptions?: VolumeOptions;
  tmpfsOptions?: TmpfsOptions;
}
```

### VolumeCreateOptions

Opções para criação de volume.

```typescript
interface VolumeCreateOptions {
  /** Nome do volume */
  name?: string;

  /** Driver do volume */
  driver?: string;

  /** Opções do driver */
  driverOpts?: Record<string, string>;

  /** Labels do volume */
  labels?: Record<string, string>;
}
```

## Tipos de Rede

### Network

Representação de uma rede Docker.

```typescript
interface Network {
  /** ID da rede */
  id: string;

  /** Nome da rede */
  name: string;

  /** Driver da rede */
  driver: string;

  /** Escopo da rede */
  scope: 'local' | 'global' | 'swarm';

  /** IPv6 habilitado */
  enableIPv6: boolean;

  /** Configuração IPAM */
  ipam: IPAMConfig;

  /** Containers conectados */
  containers: Record<string, NetworkContainer>;

  /** Opções da rede */
  options: Record<string, string>;

  /** Labels da rede */
  labels: Record<string, string>;

  /** Timestamp de criação */
  created: Date;

  /** Attachable (Swarm) */
  attachable?: boolean;

  /** Ingress (Swarm) */
  ingress?: boolean;
}
```

### NetworkConnection

Conexão de container à rede.

```typescript
interface NetworkConnection {
  /** Nome da rede */
  networkName: string;

  /** ID da rede */
  networkId: string;

  /** Endereço IP */
  ipAddress: string;

  /** Prefixo da rede */
  ipPrefixLen: number;

  /** Gateway */
  gateway: string;

  /** Endereços IP globais IPv6 */
  globalIPv6Address?: string;

  /** Prefixo IPv6 */
  globalIPv6PrefixLen?: number;

  /** Gateway IPv6 */
  ipv6Gateway?: string;

  /** Endereço MAC */
  macAddress?: string;

  /** Aliases DNS */
  aliases?: string[];
}
```

### NetworkCreateOptions

Opções para criação de rede.

```typescript
interface NetworkCreateOptions {
  /** Nome da rede */
  name: string;

  /** Driver da rede */
  driver?: string;

  /** Habilitar IPv6 */
  enableIPv6?: boolean;

  /** Configuração IPAM */
  ipam?: IPAMConfig;

  /** Rede interna */
  internal?: boolean;

  /** Attachable */
  attachable?: boolean;

  /** Ingress */
  ingress?: boolean;

  /** Opções do driver */
  options?: Record<string, string>;

  /** Labels da rede */
  labels?: Record<string, string>;
}
```

## Tipos de Comando

### Command

Interface base para comandos.

```typescript
interface Command {
  /** Nome do comando */
  readonly name: string;

  /** Descrição do comando */
  readonly description: string;

  /** Categoria do comando */
  readonly category: CommandCategory;

  /** Aliases do comando */
  readonly aliases?: string[];

  /** Opções suportadas */
  readonly options?: CommandOption[];

  /** Argumentos requeridos */
  readonly args?: CommandArgument[];

  /** Executa o comando */
  execute(context: CommandContext): Promise<CommandResult>;

  /** Obtém ajuda do comando */
  getHelp(): string;

  /** Valida argumentos */
  validate(args: string[], options: CommandOptions): ValidationResult;
}
```

### CommandCategory

Categorias de comandos.

```typescript
type CommandCategory =
  | 'container'
  | 'image'
  | 'volume'
  | 'network'
  | 'compose'
  | 'swarm'
  | 'system'
  | 'plugin'
  | 'custom';
```

### CommandContext

Contexto de execução do comando.

```typescript
interface CommandContext {
  /** Argumentos do comando */
  args: string[];

  /** Opções do comando */
  options: CommandOptions;

  /** Configuração atual */
  config: DockerPilotConfig;

  /** Logger */
  logger: Logger;

  /** Cliente Docker */
  docker: DockerClient;

  /** Interface de usuário */
  ui: UIInterface;

  /** Diretório de trabalho */
  cwd: string;

  /** Variáveis de ambiente */
  env: Record<string, string>;
}
```

### CommandResult

Resultado da execução do comando.

```typescript
interface CommandResult {
  /** Sucesso da execução */
  success: boolean;

  /** Código de saída */
  exitCode: number;

  /** Dados de saída */
  data?: any;

  /** Mensagem de resultado */
  message?: string;

  /** Erro, se houver */
  error?: Error;

  /** Tempo de execução */
  executionTime: number;

  /** Metadados adicionais */
  metadata?: Record<string, any>;
}
```

### CommandOption

Definição de opção de comando.

```typescript
interface CommandOption {
  /** Nome da opção */
  name: string;

  /** Nome curto */
  short?: string;

  /** Descrição */
  description: string;

  /** Tipo de valor */
  type: 'boolean' | 'string' | 'number' | 'array';

  /** Valor padrão */
  default?: any;

  /** Obrigatória */
  required?: boolean;

  /** Valores aceitos */
  choices?: string[];

  /** Validador personalizado */
  validator?: (value: any) => boolean;
}
```

## Tipos de Configuração

### PluginConfig

Configuração de plugins.

```typescript
interface PluginConfig {
  /** Plugins habilitados */
  enabled: string[];

  /** Diretório de plugins */
  directory: string;

  /** Configurações específicas */
  settings: Record<string, any>;

  /** Auto-carregamento */
  autoLoad: boolean;

  /** Plugins remotos */
  remote?: RemotePluginConfig[];
}
```

### UIConfig

Configuração da interface.

```typescript
interface UIConfig {
  /** Tema da interface */
  theme: 'dark' | 'light' | 'auto';

  /** Cores personalizadas */
  colors: ColorScheme;

  /** Menu interativo habilitado */
  interactive: boolean;

  /** Animações habilitadas */
  animations: boolean;

  /** Formato de saída padrão */
  defaultFormat: OutputFormat;

  /** Paginação */
  pagination: PaginationConfig;
}
```

### I18nConfig

Configuração de internacionalização.

```typescript
interface I18nConfig {
  /** Idioma padrão */
  defaultLanguage: string;

  /** Idiomas disponíveis */
  availableLanguages: string[];

  /** Fallback de idioma */
  fallbackLanguage: string;

  /** Diretório de traduções */
  translationsDir: string;

  /** Namespace padrão */
  defaultNamespace: string;

  /** Interpolação */
  interpolation: InterpolationConfig;
}
```

## Tipos de Plugin

### Plugin

Interface base para plugins.

```typescript
interface Plugin {
  /** Nome do plugin */
  readonly name: string;

  /** Versão do plugin */
  readonly version: string;

  /** Descrição do plugin */
  readonly description: string;

  /** Autor do plugin */
  readonly author: string;

  /** Dependências */
  readonly dependencies?: string[];

  /** Inicializa o plugin */
  initialize(context: PluginContext): Promise<void>;

  /** Finaliza o plugin */
  destroy(): Promise<void>;

  /** Comandos fornecidos */
  getCommands?(): Command[];

  /** Hooks fornecidos */
  getHooks?(): PluginHooks;

  /** Configurações do plugin */
  getConfig?(): PluginConfiguration;
}
```

### PluginContext

Contexto fornecido ao plugin.

```typescript
interface PluginContext {
  /** Configuração do Docker Pilot */
  config: DockerPilotConfig;

  /** Logger */
  logger: Logger;

  /** Registro de comandos */
  commandRegistry: CommandRegistry;

  /** Cliente Docker */
  docker: DockerClient;

  /** Sistema de eventos */
  eventBus: EventBus;

  /** Utilitários */
  utils: PluginUtils;
}
```

### PluginHooks

Hooks fornecidos pelo plugin.

```typescript
interface PluginHooks {
  /** Antes da execução do comando */
  beforeCommand?: (context: CommandContext) => Promise<void>;

  /** Depois da execução do comando */
  afterCommand?: (context: CommandContext, result: CommandResult) => Promise<void>;

  /** Em caso de erro */
  onError?: (context: CommandContext, error: Error) => Promise<void>;

  /** Inicialização da aplicação */
  onAppStart?: () => Promise<void>;

  /** Finalização da aplicação */
  onAppStop?: () => Promise<void>;
}
```

## Tipos de Evento

### Event

Evento do sistema.

```typescript
interface Event {
  /** Tipo do evento */
  type: EventType;

  /** Dados do evento */
  data: any;

  /** Timestamp */
  timestamp: Date;

  /** Origem do evento */
  source: string;

  /** ID único */
  id: string;

  /** Metadados */
  metadata?: Record<string, any>;
}
```

### EventType

Tipos de eventos suportados.

```typescript
type EventType =
  | 'container.start'
  | 'container.stop'
  | 'container.create'
  | 'container.remove'
  | 'image.pull'
  | 'image.build'
  | 'image.remove'
  | 'volume.create'
  | 'volume.remove'
  | 'network.create'
  | 'network.remove'
  | 'command.execute'
  | 'command.complete'
  | 'command.error'
  | 'plugin.load'
  | 'plugin.unload'
  | 'config.change'
  | 'app.start'
  | 'app.stop';
```

### EventHandler

Handler de evento.

```typescript
type EventHandler<T = any> = (event: Event<T>) => Promise<void> | void;
```

## Tipos de Validação

### ValidationResult

Resultado de validação.

```typescript
interface ValidationResult {
  /** Validação passou */
  valid: boolean;

  /** Erros encontrados */
  errors: ValidationError[];

  /** Avisos */
  warnings: ValidationWarning[];

  /** Dados validados */
  data?: any;
}
```

### ValidationError

Erro de validação.

```typescript
interface ValidationError {
  /** Campo com erro */
  field: string;

  /** Mensagem de erro */
  message: string;

  /** Código do erro */
  code: string;

  /** Valor inválido */
  value: any;

  /** Regra violada */
  rule: string;
}
```

### ValidationRule

Regra de validação.

```typescript
interface ValidationRule {
  /** Nome da regra */
  name: string;

  /** Função de validação */
  validator: (value: any, context?: any) => boolean;

  /** Mensagem de erro */
  message: string;

  /** Parâmetros da regra */
  params?: Record<string, any>;
}
```

## Tipos de Utilitário

### LogLevel

Níveis de log.

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}
```

### OutputFormat

Formatos de saída.

```typescript
type OutputFormat =
  | 'table'
  | 'list'
  | 'json'
  | 'yaml'
  | 'csv'
  | 'xml';
```

### ResourceConfig

Configuração de recursos.

```typescript
interface ResourceConfig {
  /** Limite de memória */
  memory?: number;

  /** Limite de swap */
  memorySwap?: number;

  /** Limite de CPU */
  cpuShares?: number;

  /** CPUs específicas */
  cpusetCpus?: string;

  /** Nós de memória */
  cpusetMems?: string;

  /** Período de CPU */
  cpuPeriod?: number;

  /** Quota de CPU */
  cpuQuota?: number;

  /** Limite de PIDs */
  pidsLimit?: number;

  /** OOM killer */
  oomKillDisable?: boolean;

  /** Dispositivos */
  devices?: DeviceMapping[];

  /** Ulimits */
  ulimits?: Ulimit[];
}
```

### DeviceMapping

Mapeamento de dispositivo.

```typescript
interface DeviceMapping {
  /** Caminho no host */
  pathOnHost: string;

  /** Caminho no container */
  pathInContainer: string;

  /** Permissões */
  cgroupPermissions: string;
}
```

### PortMapping

Mapeamento de porta.

```typescript
interface PortMapping {
  /** Porta no container */
  containerPort: number;

  /** Porta no host */
  hostPort?: number;

  /** IP do host */
  hostIp?: string;

  /** Protocolo */
  protocol: 'tcp' | 'udp' | 'sctp';
}
```

### RestartPolicy

Política de reinício.

```typescript
interface RestartPolicy {
  /** Nome da política */
  name: 'no' | 'always' | 'unless-stopped' | 'on-failure';

  /** Tentativas máximas (para on-failure) */
  maximumRetryCount?: number;
}
```

## Tipos Compostos

### ComposeConfig

Configuração do Docker Compose.

```typescript
interface ComposeConfig {
  /** Versão do compose */
  version: string;

  /** Serviços */
  services: Record<string, ComposeService>;

  /** Volumes */
  volumes?: Record<string, ComposeVolume>;

  /** Redes */
  networks?: Record<string, ComposeNetwork>;

  /** Segredos */
  secrets?: Record<string, ComposeSecret>;

  /** Configurações */
  configs?: Record<string, ComposeConfig>;
}
```

### ComposeService

Serviço do Docker Compose.

```typescript
interface ComposeService {
  /** Imagem */
  image?: string;

  /** Build */
  build?: string | ComposeBuild;

  /** Comando */
  command?: string | string[];

  /** Portas */
  ports?: (string | PortMapping)[];

  /** Volumes */
  volumes?: (string | VolumeMount)[];

  /** Variáveis de ambiente */
  environment?: string[] | Record<string, string>;

  /** Dependências */
  depends_on?: string[] | Record<string, ComposeDependency>;

  /** Redes */
  networks?: string[] | Record<string, ComposeNetworkConfig>;

  /** Política de reinício */
  restart?: string;

  /** Recursos */
  deploy?: ComposeDeployConfig;
}
```

## União de Tipos

### DockerResource

Qualquer recurso Docker.

```typescript
type DockerResource = Container | Image | Volume | Network;
```

### CommandInput

Entrada de comando.

```typescript
type CommandInput = string | string[] | CommandOptions;
```

### ConfigValue

Valor de configuração.

```typescript
type ConfigValue = string | number | boolean | object | null | undefined;
```

### LogTransport

Transporte de log.

```typescript
type LogTransport = ConsoleTransport | FileTransport | WebhookTransport | CustomTransport;
```

## Exportação de Tipos

### Índice Principal

```typescript
// Core types
export * from './core';
export * from './config';

// Docker types
export * from './container';
export * from './image';
export * from './volume';
export * from './network';

// Command types
export * from './command';
export * from './plugin';

// Utility types
export * from './validation';
export * from './logging';
export * from './event';

// Compose types
export * from './compose';

// Type guards
export * from './guards';

// Utility types
export type Partial<T> = { [P in keyof T]?: T[P] };
export type Required<T> = { [P in keyof T]-?: T[P] };
export type Pick<T, K extends keyof T> = { [P in K]: T[P] };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Record<K extends keyof any, T> = { [P in K]: T };
```

## Type Guards

Funções para verificação de tipos em runtime.

### Container Guards

```typescript
export function isContainer(obj: any): obj is Container {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

export function isContainerRunning(container: Container): boolean {
  return container.state.running;
}
```

### Command Guards

```typescript
export function isCommand(obj: any): obj is Command {
  return obj && typeof obj.name === 'string' && typeof obj.execute === 'function';
}

export function isCommandResult(obj: any): obj is CommandResult {
  return obj && typeof obj.success === 'boolean';
}
```

### Validation Guards

```typescript
export function isValidationResult(obj: any): obj is ValidationResult {
  return obj && typeof obj.valid === 'boolean' && Array.isArray(obj.errors);
}
```

## Tipos Auxiliares

### Mapped Types

```typescript
// Torna todas as propriedades opcionais e aninhadas
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Torna todas as propriedades obrigatórias e aninhadas
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Extrai os nomes das propriedades de função
export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

// Extrai apenas as propriedades de função
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;
```

### Conditional Types

```typescript
// Extrai tipo de retorno de Promise
export type Awaited<T> = T extends Promise<infer U> ? U : T;

// Extrai tipo de elementos de array
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// Verifica se tipo é uma string literal
export type IsStringLiteral<T> = T extends string
  ? string extends T
    ? false
    : true
  : false;
```

## Exemplos de Uso

### Exemplo 1: Usando Tipos para Validação

```typescript
import { Container, ContainerCreateOptions, ValidationResult } from '@docker-pilot/types';

function validateCreateOptions(options: ContainerCreateOptions): ValidationResult {
  const errors: ValidationError[] = [];

  if (options.name && !isValidContainerName(options.name)) {
    errors.push({
      field: 'name',
      message: 'Nome de container inválido',
      code: 'INVALID_NAME',
      value: options.name,
      rule: 'container-name'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}
```

### Exemplo 2: Implementando Comando Tipado

```typescript
import { Command, CommandContext, CommandResult } from '@docker-pilot/types';

class ListCommand implements Command {
  readonly name = 'list';
  readonly description = 'Lista containers';
  readonly category = 'container' as const;

  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      const containers = await context.docker.listContainers();

      return {
        success: true,
        exitCode: 0,
        data: containers,
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

  getHelp(): string {
    return 'Lista todos os containers Docker';
  }

  validate(): ValidationResult {
    return { valid: true, errors: [], warnings: [] };
  }
}
```

### Exemplo 3: Plugin com Tipos

```typescript
import { Plugin, PluginContext, Command } from '@docker-pilot/types';

class MyPlugin implements Plugin {
  readonly name = 'my-plugin';
  readonly version = '1.0.0';
  readonly description = 'Plugin de exemplo';
  readonly author = 'Docker Pilot Team';

  async initialize(context: PluginContext): Promise<void> {
    context.logger.info(`Plugin ${this.name} inicializado`);
  }

  async destroy(): Promise<void> {
    // Cleanup
  }

  getCommands(): Command[] {
    return [new MyCommand()];
  }
}
```
