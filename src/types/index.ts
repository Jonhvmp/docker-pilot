/**
 * Type definitions for Docker Pilot
 */

import { z } from 'zod';

// ============================================================================
// I18N TYPES
// ============================================================================

export type SupportedLanguage = 'en' | 'pt-br';

// ============================================================================
// SERVICE TYPES
// ============================================================================

export const ServiceConfigSchema = z.object({
  port: z.number().optional().nullable(),
  path: z.string().optional().nullable(),
  description: z.string().optional(),
  healthCheck: z.boolean().default(false),
  backupEnabled: z.boolean().default(false),
  environment: z.record(z.string()).optional(),
  volumes: z.array(z.string()).optional(),
  depends_on: z.array(z.string()).optional(),
  networks: z.array(z.string()).optional(),
  restart: z.enum(['no', 'always', 'on-failure', 'unless-stopped']).default('unless-stopped'),
  scale: z.number().min(1).default(1),
  cpu_limit: z.string().optional(),
  memory_limit: z.string().optional(),
  build: z.object({
    context: z.string(),
    dockerfile: z.string().optional(),
    args: z.record(z.string()).optional(),
    target: z.string().optional()
  }).optional()
});

export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;

// ============================================================================
// CLI CONFIGURATION TYPES
// ============================================================================

export const CLIConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  welcomeMessage: z.string().default('Bem-vindo ao {projectName} Docker Pilot v{version}! 🐳'),
  goodbyeMessage: z.string().default('Obrigado por usar o {projectName} Docker Pilot!'),
  interactiveMode: z.boolean().default(true),
  colorOutput: z.boolean().default(true),
  verboseLogging: z.boolean().default(false),
  confirmDestructiveActions: z.boolean().default(true)
});

export type CLIConfig = z.infer<typeof CLIConfigSchema>;

// ============================================================================
// BACKUP CONFIGURATION TYPES
// ============================================================================

export const BackupServiceConfigSchema = z.object({
  command: z.string(),
  filename: z.string(),
  preBackupHook: z.string().optional(),
  postBackupHook: z.string().optional(),
  compression: z.boolean().default(true),
  encryption: z.boolean().default(false)
});

export const BackupConfigSchema = z.object({
  enabled: z.boolean().default(true),
  directory: z.string().default('./backups'),
  retention: z.number().min(1).default(7),
  schedule: z.string().optional(), // cron expression
  services: z.record(BackupServiceConfigSchema).default({}),
  cloud: z.object({
    provider: z.enum(['aws', 'gcp', 'azure']).optional(),
    bucket: z.string().optional(),
    region: z.string().optional(),
    credentials: z.record(z.string()).optional()
  }).optional()
});

export type BackupConfig = z.infer<typeof BackupConfigSchema>;
export type BackupServiceConfig = z.infer<typeof BackupServiceConfigSchema>;

// ============================================================================
// MONITORING CONFIGURATION TYPES
// ============================================================================

export const MonitoringConfigSchema = z.object({
  enabled: z.boolean().default(true),
  refreshInterval: z.number().min(1).default(5),
  services: z.array(z.string()).default([]),
  urls: z.record(z.string()).default({}),
  alerts: z.object({
    enabled: z.boolean().default(false),
    email: z.string().email().optional(),
    webhook: z.string().url().optional(),
    thresholds: z.object({
      cpu: z.number().min(0).max(100).default(80),
      memory: z.number().min(0).max(100).default(80),
      disk: z.number().min(0).max(100).default(90)
    }).default({})
  }).default({})
});

export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;

// ============================================================================
// DEVELOPMENT CONFIGURATION TYPES
// ============================================================================

export const DevelopmentConfigSchema = z.object({
  hotReload: z.boolean().default(true),
  debugMode: z.boolean().default(false),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  autoMigrate: z.boolean().default(false),
  seedData: z.boolean().default(false),
  testMode: z.boolean().default(false),
  watchFiles: z.array(z.string()).default([]),
  environment: z.enum(['development', 'staging', 'production']).default('development')
});

export type DevelopmentConfig = z.infer<typeof DevelopmentConfigSchema>;

// ============================================================================
// MAIN CONFIGURATION SCHEMA
// ============================================================================

export const DockerPilotConfigSchema = z.object({
  projectName: z.string().min(1),
  dockerCompose: z.string().default('docker compose'),
  configVersion: z.string().default('1.0'),
  services: z.record(ServiceConfigSchema).default({}),
  plugins: z.array(z.string()).default([]),
  cli: CLIConfigSchema.default({}),
  backup: BackupConfigSchema.default({}),
  monitoring: MonitoringConfigSchema.default({}),
  development: DevelopmentConfigSchema.default({}),
  networks: z.record(z.object({
    driver: z.string().optional(),
    external: z.boolean().default(false),
    ipam: z.object({
      driver: z.string().optional(),
      config: z.array(z.object({
        subnet: z.string(),
        gateway: z.string().optional()
      })).optional()
    }).optional()
  })).default({}),
  volumes: z.record(z.object({
    driver: z.string().optional(),
    external: z.boolean().default(false),
    driver_opts: z.record(z.string()).optional()
  })).default({}),
  language: z.enum(['en', 'pt-br']).default('en')
});

export type DockerPilotConfig = z.infer<typeof DockerPilotConfigSchema>;

// ============================================================================
// COMMAND TYPES
// ============================================================================

export interface CommandContext {
  config: DockerPilotConfig;
  logger: any; // Will be properly typed when Logger is created
  workingDirectory: string;
}

export interface CommandOptions {
  silent?: boolean;
  dryRun?: boolean;
  interactive?: boolean;
  timeout?: number;
}

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
  executionTime?: number;
}

// ============================================================================
// SERVICE STATUS TYPES
// ============================================================================

export interface ServiceStatus {
  name: string;
  state: 'running' | 'stopped' | 'starting' | 'stopping' | 'error' | 'unknown';
  health: 'healthy' | 'unhealthy' | 'starting' | 'none';
  uptime?: string;
  ports?: string[];
  image?: string;
  containerId?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  networkIO?: {
    rx: string;
    tx: string;
  };
  blockIO?: {
    read: string;
    write: string;
  };
}

export interface ProjectStatus {
  projectName: string;
  totalServices: number;
  runningServices: number;
  healthyServices: number;
  services: ServiceStatus[];
  networks: string[];
  volumes: string[];
  lastUpdated: Date;
}

// ============================================================================
// PLUGIN TYPES
// ============================================================================

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];
}

export interface PluginHooks {
  beforeCommand?: (command: string, args: string[]) => Promise<void> | void;
  afterCommand?: (command: string, args: string[], result: CommandResult) => Promise<void> | void;
  beforeServiceStart?: (serviceName: string) => Promise<void> | void;
  afterServiceStart?: (serviceName: string) => Promise<void> | void;
  beforeServiceStop?: (serviceName: string) => Promise<void> | void;
  afterServiceStop?: (serviceName: string) => Promise<void> | void;
  onError?: (error: Error, context: any) => Promise<void> | void;
}

export interface Plugin {
  metadata: PluginMetadata;
  hooks?: PluginHooks;
  commands?: Record<string, (args: string[], options: CommandOptions) => Promise<CommandResult>>;
  initialize?: (context: CommandContext) => Promise<void> | void;
  cleanup?: () => Promise<void> | void;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type EventType =
  | 'command:start'
  | 'command:end'
  | 'command:error'
  | 'service:start'
  | 'service:stop'
  | 'service:restart'
  | 'service:error'
  | 'config:loaded'
  | 'config:saved'
  | 'plugin:loaded'
  | 'plugin:error';

export interface DockerPilotEvent {
  type: EventType;
  timestamp: Date;
  data: any;
  source: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: any;
  source?: string;
}

// ============================================================================
// DOCKER COMPOSE TYPES
// ============================================================================

export interface DockerComposeService {
  image?: string;
  build?: string | {
    context: string;
    dockerfile?: string;
    args?: Record<string, string>;
    target?: string;
  };
  ports?: string[];
  volumes?: string[];
  environment?: Record<string, string> | string[];
  depends_on?: string[] | Record<string, { condition: string }>;
  networks?: string[];
  restart?: string;
  healthcheck?: {
    test: string | string[];
    interval?: string;
    timeout?: string;
    retries?: number;
    start_period?: string;
  };
}

export interface DockerComposeConfig {
  version?: string;
  services: Record<string, DockerComposeService>;
  networks?: Record<string, any>;
  volumes?: Record<string, any>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class DockerPilotError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'DockerPilotError';
  }
}

export class ConfigurationError extends DockerPilotError {
  constructor(message: string, context?: any) {
    super(message, 'CONFIGURATION_ERROR', context);
    this.name = 'ConfigurationError';
  }
}

export class CommandExecutionError extends DockerPilotError {
  constructor(message: string, context?: any) {
    super(message, 'COMMAND_EXECUTION_ERROR', context);
    this.name = 'CommandExecutionError';
  }
}

export class ServiceError extends DockerPilotError {
  constructor(message: string, context?: any) {
    super(message, 'SERVICE_ERROR', context);
    this.name = 'ServiceError';
  }
}

export class PluginError extends DockerPilotError {
  constructor(message: string, context?: any) {
    super(message, 'PLUGIN_ERROR', context);
    this.name = 'PluginError';
  }
}
