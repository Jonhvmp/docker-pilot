# Core API

Main API documentation for Docker Pilot.

## Main Classes

### DockerPilot

Main class that orchestrates all Docker Pilot functionalities.

```typescript
class DockerPilot {
  constructor(options: DockerPilotOptions)

  // Main methods
  async start(services?: string[]): Promise<void>
  async stop(services?: string[]): Promise<void>
  async restart(services?: string[]): Promise<void>
  async status(services?: string[]): Promise<ServiceStatus[]>
  async logs(service: string, options?: LogOptions): Promise<void>
  async exec(service: string, command: string, options?: ExecOptions): Promise<void>
  async build(services?: string[], options?: BuildOptions): Promise<void>
  async push(services?: string[], options?: PushOptions): Promise<void>
  async pull(services?: string[], options?: PullOptions): Promise<void>

  // Configuration management
  async loadConfig(path?: string): Promise<void>
  async validateConfig(): Promise<ValidationResult>

  // Workflows
  async runWorkflow(name: string, options?: WorkflowOptions): Promise<void>
  async listWorkflows(): Promise<Workflow[]>

  // Custom commands
  async runCustomCommand(name: string, args?: any): Promise<void>
  async listCustomCommands(): Promise<CustomCommand[]>

  // Monitoring
  async getMetrics(services?: string[]): Promise<Metrics>
  async getHealth(services?: string[]): Promise<HealthStatus[]>

  // Plugins
  async loadPlugin(plugin: string | Plugin): Promise<void>
  async unloadPlugin(name: string): Promise<void>
  async listPlugins(): Promise<Plugin[]>
}
```

#### Constructor Options

```typescript
interface DockerPilotOptions {
  configPath?: string
  projectDir?: string
  environment?: string
  verbose?: boolean
  dryRun?: boolean
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  plugins?: string[]
}
```

#### Exemplo de Uso

```typescript
import { DockerPilot } from '@docker-pilot/core'

const pilot = new DockerPilot({
  configPath: './docker-pilot.yml',
  environment: 'development',
  verbose: true
})

// Carregar configuração
await pilot.loadConfig()

// Iniciar serviços
await pilot.start(['api', 'database'])

// Verificar status
const status = await pilot.status()
console.log(status)

// Executar workflow
await pilot.runWorkflow('deploy-staging')
```

### ServiceManager

Gerencia operações específicas de serviços.

```typescript
class ServiceManager {
  constructor(docker: Docker, config: Config)

  // Operações de serviço
  async startService(name: string, options?: ServiceOptions): Promise<void>
  async stopService(name: string, options?: ServiceOptions): Promise<void>
  async restartService(name: string, options?: ServiceOptions): Promise<void>
  async removeService(name: string, options?: ServiceOptions): Promise<void>

  // Status e informações
  async getServiceStatus(name: string): Promise<ServiceStatus>
  async getServiceLogs(name: string, options?: LogOptions): Promise<string>
  async getServiceMetrics(name: string): Promise<ServiceMetrics>

  // Execução de comandos
  async execInService(name: string, command: string, options?: ExecOptions): Promise<ExecResult>

  // Scaling
  async scaleService(name: string, replicas: number): Promise<void>

  // Health checks
  async checkServiceHealth(name: string): Promise<HealthCheck>

  // Listagem
  async listServices(filters?: ServiceFilters): Promise<Service[]>
  async findService(name: string): Promise<Service | null>
}
```

#### Interfaces de Serviço

```typescript
interface Service {
  name: string
  image: string
  status: 'running' | 'stopped' | 'starting' | 'stopping'
  ports: Port[]
  volumes: Volume[]
  environment: Record<string, string>
  networks: string[]
  healthcheck?: HealthCheckConfig
  labels: Record<string, string>
  created: Date
  updated: Date
}

interface ServiceStatus {
  name: string
  status: string
  uptime: number
  restartCount: number
  ports: Port[]
  health: 'healthy' | 'unhealthy' | 'starting' | 'none'
}

interface ServiceMetrics {
  name: string
  cpu: number
  memory: {
    usage: number
    limit: number
    percent: number
  }
  network: {
    rx: number
    tx: number
  }
  disk: {
    read: number
    write: number
  }
}
```

### ConfigManager

Gerencia configurações do projeto.

```typescript
class ConfigManager {
  constructor(options?: ConfigOptions)

  // Carregamento de configuração
  async load(path?: string): Promise<Config>
  async loadFromString(content: string, format?: 'yaml' | 'json'): Promise<Config>
  async reload(): Promise<Config>

  // Validação
  async validate(config?: Config): Promise<ValidationResult>
  async validateSchema(config: Config, schema: object): Promise<ValidationResult>

  // Manipulação
  get(key: string): any
  set(key: string, value: any): void
  has(key: string): boolean
  delete(key: string): void

  // Serialização
  toYAML(): string
  toJSON(): string

  // Merge e override
  merge(other: Config): Config
  override(overrides: Partial<Config>): Config

  // Resolução de variáveis
  resolveVariables(): Config

  // Eventos
  on(event: 'change' | 'reload', callback: (config: Config) => void): void
  off(event: string, callback: Function): void
}
```

#### Estrutura de Configuração

```typescript
interface Config {
  version: string
  project: ProjectConfig
  services: Record<string, ServiceConfig>
  networks?: Record<string, NetworkConfig>
  volumes?: Record<string, VolumeConfig>
  workflows?: Record<string, WorkflowConfig>
  custom_commands?: Record<string, CustomCommandConfig>
  monitoring?: MonitoringConfig
  automation?: AutomationConfig
  plugins?: PluginConfig
  environments?: Record<string, EnvironmentConfig>
}

interface ProjectConfig {
  name: string
  description?: string
  version?: string
  author?: string
  license?: string
  repository?: string
  tags?: string[]
}

interface ServiceConfig {
  image?: string
  build?: BuildConfig | string
  container_name?: string
  hostname?: string
  ports?: string[]
  volumes?: string[]
  environment?: Record<string, string> | string[]
  env_file?: string | string[]
  depends_on?: string[] | Record<string, DependsOnConfig>
  networks?: string[] | Record<string, NetworkServiceConfig>
  healthcheck?: HealthCheckConfig
  restart?: RestartPolicy
  deploy?: DeployConfig
  labels?: Record<string, string>
  profiles?: string[]
}
```

### CommandRunner

Executa comandos do sistema e Docker.

```typescript
class CommandRunner {
  constructor(options?: CommandRunnerOptions)

  // Execução de comandos
  async run(command: string, options?: RunOptions): Promise<RunResult>
  async runInBackground(command: string, options?: RunOptions): Promise<BackgroundProcess>
  async runWithStream(command: string, options?: StreamOptions): Promise<void>

  // Comandos Docker
  async dockerCommand(args: string[], options?: DockerOptions): Promise<RunResult>
  async dockerCompose(args: string[], options?: ComposeOptions): Promise<RunResult>

  // Utilitários
  async which(command: string): Promise<string | null>
  async checkCommand(command: string): Promise<boolean>

  // Process management
  async killProcess(pid: number): Promise<void>
  async getProcesses(): Promise<Process[]>

  // Stream handling
  createReadStream(command: string, options?: StreamOptions): NodeJS.ReadableStream
  createWriteStream(command: string, options?: StreamOptions): NodeJS.WritableStream
}
```

#### Interfaces de Comando

```typescript
interface RunOptions {
  cwd?: string
  env?: Record<string, string>
  timeout?: number
  stdio?: 'pipe' | 'inherit' | 'ignore'
  shell?: boolean
  input?: string
}

interface RunResult {
  stdout: string
  stderr: string
  exitCode: number
  signal?: string
  killed: boolean
  duration: number
}

interface BackgroundProcess {
  pid: number
  kill(): Promise<void>
  wait(): Promise<RunResult>
  isRunning(): boolean
}
```

## Utilitários

### Logger

Sistema de logging integrado.

```typescript
class Logger {
  constructor(options?: LoggerOptions)

  // Métodos de log
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void

  // Contexto
  child(context: Record<string, any>): Logger
  withContext(context: Record<string, any>): Logger

  // Formatação
  setLevel(level: LogLevel): void
  setFormat(format: LogFormat): void

  // Outputs
  addOutput(output: LogOutput): void
  removeOutput(output: LogOutput): void

  // Filtros
  addFilter(filter: LogFilter): void
  removeFilter(filter: LogFilter): void
}

interface LoggerOptions {
  level?: LogLevel
  format?: LogFormat
  outputs?: LogOutput[]
  context?: Record<string, any>
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogFormat = 'json' | 'text' | 'pretty'
```

### EventEmitter

Sistema de eventos interno.

```typescript
class EventEmitter {
  // Registro de eventos
  on(event: string, listener: Function): void
  once(event: string, listener: Function): void
  off(event: string, listener: Function): void

  // Emissão de eventos
  emit(event: string, ...args: any[]): boolean

  // Utilitários
  listenerCount(event: string): number
  eventNames(): string[]
  removeAllListeners(event?: string): void
}
```

### Validator

Validação de configurações e dados.

```typescript
class Validator {
  constructor(schema?: object)

  // Validação
  validate(data: any, schema?: object): ValidationResult
  validateAsync(data: any, schema?: object): Promise<ValidationResult>

  // Schema management
  addSchema(name: string, schema: object): void
  getSchema(name: string): object | null
  removeSchema(name: string): void

  // Formatters
  formatErrors(result: ValidationResult): string
  formatWarnings(result: ValidationResult): string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  path: string
  message: string
  value: any
  schema: any
}
```

## Interfaces Globais

### Principais Tipos

```typescript
// Resultado de operações
type OperationResult<T = any> = {
  success: boolean
  data?: T
  error?: Error
  duration: number
}

// Opções de filtro
interface FilterOptions {
  name?: string | RegExp
  status?: string[]
  labels?: Record<string, string>
  created?: DateRange
  updated?: DateRange
}

// Range de datas
interface DateRange {
  from?: Date
  to?: Date
}

// Configuração de porta
interface Port {
  host: number
  container: number
  protocol?: 'tcp' | 'udp'
}

// Configuração de volume
interface Volume {
  host: string
  container: string
  mode?: 'ro' | 'rw'
}

// Configuração de rede
interface NetworkConfig {
  driver: string
  driver_opts?: Record<string, string>
  ipam?: IPAMConfig
  external?: boolean
  name?: string
  labels?: Record<string, string>
}

// Health check
interface HealthCheckConfig {
  test: string[]
  interval?: string
  timeout?: string
  retries?: number
  start_period?: string
}
```

### Eventos do Sistema

```typescript
// Eventos de serviço
interface ServiceEvents {
  'service:starting': { name: string }
  'service:started': { name: string }
  'service:stopping': { name: string }
  'service:stopped': { name: string }
  'service:error': { name: string, error: Error }
}

// Eventos de configuração
interface ConfigEvents {
  'config:loaded': { config: Config }
  'config:changed': { config: Config, changes: any[] }
  'config:error': { error: Error }
}

// Eventos de workflow
interface WorkflowEvents {
  'workflow:started': { name: string }
  'workflow:completed': { name: string, result: any }
  'workflow:failed': { name: string, error: Error }
  'workflow:step': { workflow: string, step: string, status: string }
}
```

## Exemplos Avançados

### Criando um Plugin

```typescript
import { Plugin, PluginContext } from '@docker-pilot/core'

class MyPlugin implements Plugin {
  name = 'my-plugin'
  version = '1.0.0'

  async initialize(context: PluginContext): Promise<void> {
    // Registrar comandos
    context.registerCommand('my-command', this.myCommand.bind(this))

    // Registrar hooks
    context.registerHook('before_start', this.beforeStart.bind(this))

    // Escutar eventos
    context.on('service:started', this.onServiceStarted.bind(this))
  }

  async myCommand(args: any[], context: PluginContext): Promise<void> {
    const { logger, config, docker } = context
    logger.info('Executando meu comando personalizado')

    // Lógica do comando
  }

  async beforeStart(services: string[], context: PluginContext): Promise<void> {
    const { logger } = context
    logger.info(`Preparando para iniciar serviços: ${services.join(', ')}`)
  }

  async onServiceStarted(event: { name: string }, context: PluginContext): Promise<void> {
    const { logger } = context
    logger.info(`Serviço iniciado: ${event.name}`)
  }

  async cleanup(context: PluginContext): Promise<void> {
    // Limpeza do plugin
  }
}

export default MyPlugin
```

### Uso Programático

```typescript
import { DockerPilot } from '@docker-pilot/core'

async function deployApplication() {
  const pilot = new DockerPilot({
    configPath: './docker-pilot.yml',
    environment: 'production'
  })

  try {
    // Carregar configuração
    await pilot.loadConfig()

    // Validar configuração
    const validation = await pilot.validateConfig()
    if (!validation.valid) {
      throw new Error(`Configuração inválida: ${validation.errors.join(', ')}`)
    }

    // Fazer backup antes do deploy
    await pilot.runCustomCommand('backup-db')

    // Build das imagens
    await pilot.build(undefined, { noCache: true })

    // Push para registry
    await pilot.push()

    // Deploy via workflow
    await pilot.runWorkflow('production-deploy')

    // Verificar saúde dos serviços
    const health = await pilot.getHealth()
    const unhealthy = health.filter(h => h.status !== 'healthy')

    if (unhealthy.length > 0) {
      throw new Error(`Serviços não saudáveis: ${unhealthy.map(h => h.name).join(', ')}`)
    }

    console.log('Deploy concluído com sucesso!')

  } catch (error) {
    console.error('Erro no deploy:', error)

    // Rollback em caso de erro
    await pilot.runWorkflow('rollback')
    throw error
  }
}

// Executar deploy
deployApplication()
  .then(() => console.log('Processo finalizado'))
  .catch(error => {
    console.error('Deploy falhou:', error)
    process.exit(1)
  })
```

## Veja Também

- [Commands API](commands.md)
- [Utilities API](utilities.md)
- [Types API](types.md)
- [Plugin Development](../advanced/plugins.md)
