/**
 * Docker Pilot - Main Class
 * A powerful, scalable Docker CLI library for managing containerized applications
 */

import * as path from 'path';
import { EventEmitter } from 'events';
import {
  DockerPilotConfig,
  CommandResult,
  ServiceStatus,
  ProjectStatus,
  DockerPilotEvent,
  EventType,
  DockerPilotError
} from '../types';
import { Logger } from '../utils/Logger';
import { DockerUtils } from '../utils/DockerUtils';
import { FileUtils } from '../utils/FileUtils';
import { ValidationUtils } from '../utils/ValidationUtils';
import { I18n } from '../utils/i18n';
import { ConfigManager } from './ConfigManager';
import { CommandRunner } from './CommandRunner';
import { ServiceManager } from './ServiceManager';

export interface DockerPilotOptions {
  configPath?: string;
  workingDirectory?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  silent?: boolean;
  autoLoadConfig?: boolean;
  validateConfig?: boolean;
}

export class DockerPilot extends EventEmitter {
  private config: DockerPilotConfig | null = null;
  private logger: Logger;
  private dockerUtils: DockerUtils;
  private fileUtils: FileUtils;
  private validationUtils: ValidationUtils;
  private configManager: ConfigManager;
  private commandRunner: CommandRunner;
  private serviceManager: ServiceManager | null = null;
  private options: Required<DockerPilotOptions>;
  private initialized = false;
  private i18n: I18n;

  constructor(options: DockerPilotOptions = {}) {
    super();

    this.options = {
      configPath: options.configPath || path.join(process.cwd(), 'docker-pilot.config.json'),
      workingDirectory: options.workingDirectory || process.cwd(),
      logLevel: options.logLevel || 'info',
      silent: options.silent || false,
      autoLoadConfig: options.autoLoadConfig ?? true,
      validateConfig: options.validateConfig ?? true
    };

    // Initialize utilities
    this.logger = new Logger({
      level: this.options.logLevel,
      silent: this.options.silent
    });

    this.dockerUtils = new DockerUtils(this.logger);
    this.fileUtils = new FileUtils(this.logger);
    this.validationUtils = new ValidationUtils(this.logger, this.fileUtils);

    this.configManager = new ConfigManager({
      configPath: this.options.configPath,
      validateOnLoad: this.options.validateConfig,
      autoSave: true,
      createDefault: true
    });

    this.commandRunner = new CommandRunner(this.logger, {
      cwd: this.options.workingDirectory,
      silent: this.options.silent
    });

    // Initialize i18n
    this.i18n = new I18n();

    // Auto-load configuration if enabled
    if (this.options.autoLoadConfig) {
      this.initialize().catch(error => {
        const errorMessage = error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown initialization error';
        this.logger.debug('Auto-initialization skipped:', errorMessage);
        // Don't emit error for auto-initialization failures
        // This allows the CLI to work even when Docker is not running
      });
    }
  }

  /**
   * Initialize Docker Pilot
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }    try {
      this.logger.loading(this.i18n.t('docker.initializing'));

      // Check Docker availability
      const dockerInfo = await this.dockerUtils.checkDockerStatus();
      if (!dockerInfo.isRunning) {
        throw new DockerPilotError(
          this.i18n.t('docker.not_running'),
          'DOCKER_NOT_RUNNING',
          { dockerInfo }
        );
      }

      // Load configuration
      this.config = await this.configManager.loadConfig();

      // Configure i18n based on config
      if (this.config.language) {
        this.i18n.setLanguage(this.config.language);
      }

      // Initialize service manager
      this.serviceManager = new ServiceManager(this.config, {
        projectName: this.config.projectName,
        workingDirectory: this.options.workingDirectory
      });      this.initialized = true;
      this.emit('initialized', { config: this.config, dockerInfo });

      this.logger.success(this.i18n.t('docker.initialized'));
        } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('docker.failed'), error);
      throw new DockerPilotError(`${this.i18n.t('docker.failed')}: ${errorMessage}`, 'INIT_ERROR', { error });
    }
  }

  /**
   * Ensure Docker Pilot is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // ============================================================================
  // SERVICE LIFECYCLE METHODS
  // ============================================================================

  /**
   * Start all services
   */
  async up(): Promise<CommandResult> {
    await this.ensureInitialized();
    this.emitEvent('command:start', { command: 'up' });

    try {
      const result = await this.serviceManager!.startAll();
      this.emitEvent('command:end', { command: 'up', result });
      return result;
    } catch (error) {
      this.emitEvent('command:error', { command: 'up', error });
      throw error;
    }
  }

  /**
   * Stop all services
   */
  async down(): Promise<CommandResult> {
    await this.ensureInitialized();
    this.emitEvent('command:start', { command: 'down' });

    try {
      const result = await this.serviceManager!.stopAll();
      this.emitEvent('command:end', { command: 'down', result });
      return result;
    } catch (error) {
      this.emitEvent('command:error', { command: 'down', error });
      throw error;
    }
  }

  /**
   * Restart all services
   */
  async restart(): Promise<CommandResult> {
    await this.ensureInitialized();
    this.emitEvent('command:start', { command: 'restart' });

    try {
      const result = await this.serviceManager!.restartAll();
      this.emitEvent('command:end', { command: 'restart', result });
      return result;
    } catch (error) {
      this.emitEvent('command:error', { command: 'restart', error });
      throw error;
    }
  }

  /**
   * Start specific service
   */
  async startService(serviceName: string): Promise<CommandResult> {
    await this.ensureInitialized();
    this.emitEvent('service:start', { serviceName });

    try {
      const result = await this.serviceManager!.startService(serviceName);
      this.emitEvent('service:start', { serviceName, result });
      return result;
    } catch (error) {
      this.emitEvent('service:error', { serviceName, error });
      throw error;
    }
  }

  /**
   * Stop specific service
   */
  async stopService(serviceName: string): Promise<CommandResult> {
    await this.ensureInitialized();
    this.emitEvent('service:stop', { serviceName });

    try {
      const result = await this.serviceManager!.stopService(serviceName);
      this.emitEvent('service:stop', { serviceName, result });
      return result;
    } catch (error) {
      this.emitEvent('service:error', { serviceName, error });
      throw error;
    }
  }

  /**
   * Restart specific service
   */
  async restartService(serviceName: string): Promise<CommandResult> {
    await this.ensureInitialized();
    this.emitEvent('service:restart', { serviceName });

    try {
      const result = await this.serviceManager!.restartService(serviceName);
      this.emitEvent('service:restart', { serviceName, result });
      return result;
    } catch (error) {
      this.emitEvent('service:error', { serviceName, error });
      throw error;
    }
  }

  // ============================================================================
  // BUILD AND DEVELOPMENT METHODS
  // ============================================================================

  /**
   * Build services
   */
  async build(serviceName?: string, options: { noCache?: boolean; pull?: boolean } = {}): Promise<CommandResult> {
    await this.ensureInitialized();
    this.emitEvent('command:start', { command: 'build', serviceName, options });

    try {
      const result = await this.serviceManager!.buildServices(serviceName, options);
      this.emitEvent('command:end', { command: 'build', serviceName, result });
      return result;
    } catch (error) {
      this.emitEvent('command:error', { command: 'build', serviceName, error });
      throw error;
    }
  }

  /**
   * Rebuild and restart services
   */
  async rebuild(serviceName?: string): Promise<CommandResult[]> {
    await this.ensureInitialized();
    this.emitEvent('command:start', { command: 'rebuild', serviceName });

    try {
      const results = await this.serviceManager!.rebuildServices(serviceName);
      this.emitEvent('command:end', { command: 'rebuild', serviceName, results });
      return results;
    } catch (error) {
      this.emitEvent('command:error', { command: 'rebuild', serviceName, error });
      throw error;
    }
  }

  // ============================================================================
  // MONITORING AND LOGGING METHODS
  // ============================================================================

  /**
   * Get service logs
   */
  async logs(serviceName?: string, options: { follow?: boolean; tail?: number } = {}) {
    await this.ensureInitialized();
    return this.serviceManager!.getLogs(serviceName, options);
  }

  /**
   * Get service status
   */
  async status(serviceName?: string): Promise<ServiceStatus[]> {
    await this.ensureInitialized();
    return this.serviceManager!.getServiceStatus(serviceName);
  }

  /**
   * Get project status
   */
  async getProjectStatus(): Promise<ProjectStatus> {
    await this.ensureInitialized();
    return this.serviceManager!.getProjectStatus();
  }

  /**
   * Get container statistics
   */
  async stats(serviceName?: string): Promise<any[]> {
    await this.ensureInitialized();
    return this.dockerUtils.getStats(serviceName);
  }

  // ============================================================================
  // UTILITY AND GETTER METHODS
  // ============================================================================

  /**
   * Execute command in service container
   */
  async exec(serviceName: string, command: string[], options: { interactive?: boolean; user?: string } = {}) {
    await this.ensureInitialized();
    return this.serviceManager!.execInService(serviceName, command, options);
  }

  /**
   * Scale service
   */
  async scale(serviceName: string, replicas: number): Promise<CommandResult> {
    await this.ensureInitialized();
    return this.serviceManager!.scaleService(serviceName, replicas);
  }

  /**
   * Pull images
   */
  async pull(serviceName?: string): Promise<CommandResult> {
    await this.ensureInitialized();
    this.emitEvent('command:start', { command: 'pull', serviceName });

    try {
      const result = await this.dockerUtils.pullImages(serviceName);
      this.emitEvent('command:end', { command: 'pull', serviceName, result });
      return result;
    } catch (error) {
      this.emitEvent('command:error', { command: 'pull', serviceName, error });
      throw error;
    }
  }

  /**
   * Clean Docker system
   */
  async clean(options: { volumes?: boolean; images?: boolean; networks?: boolean } = {}): Promise<CommandResult> {
    await this.ensureInitialized();
    this.emitEvent('command:start', { command: 'clean', options });

    try {
      const result = await this.dockerUtils.cleanSystem(options);
      this.emitEvent('command:end', { command: 'clean', result });
      return result;
    } catch (error) {
      this.emitEvent('command:error', { command: 'clean', error });
      throw error;
    }
  }

  /**
   * Get FileUtils instance
   */
  getFileUtils(): FileUtils {
    return this.fileUtils;
  }

  /**
   * Set Docker Compose file path
   */
  async setComposeFile(composeFilePath: string): Promise<void> {
    if (!this.serviceManager) {
      throw new Error(this.i18n.t('error.service_manager_unavailable'));
    }

    // Update service manager options
    this.serviceManager = new ServiceManager(this.config!, {
      ...this.serviceManager.getOptions(),
      composeFile: composeFilePath
    });

    this.logger.info(this.i18n.t('compose.file_set', { file: path.relative(process.cwd(), composeFilePath) }));
  }

  // ============================================================================
  // CONFIGURATION METHODS
  // ============================================================================

  /**
   * Get current configuration
   */
  getConfig(): DockerPilotConfig | null {
    return this.config ? { ...this.config } : null;
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<DockerPilotConfig>): Promise<DockerPilotConfig> {
    await this.ensureInitialized();

    const updatedConfig = await this.configManager.updateConfig(updates);
    this.config = updatedConfig;

    // Update service manager with new config
    if (this.serviceManager) {
      this.serviceManager.updateConfig(updatedConfig);
    }

    this.emitEvent('config:saved', { config: updatedConfig });
    return updatedConfig;
  }

  /**
   * Add service to configuration
   */
  async addService(serviceName: string, serviceConfig: any): Promise<DockerPilotConfig> {
    await this.ensureInitialized();

    const updatedConfig = await this.configManager.addService(serviceName, serviceConfig);
    this.config = updatedConfig;

    if (this.serviceManager) {
      this.serviceManager.updateConfig(updatedConfig);
    }

    return updatedConfig;
  }

  /**
   * Remove service from configuration
   */
  async removeService(serviceName: string): Promise<DockerPilotConfig> {
    await this.ensureInitialized();

    const updatedConfig = await this.configManager.removeService(serviceName);
    this.config = updatedConfig;

    if (this.serviceManager) {
      this.serviceManager.updateConfig(updatedConfig);
    }

    return updatedConfig;
  }

  /**
   * Auto-detect services from Docker Compose file
   */
  async detectServices(): Promise<DockerPilotConfig> {
    await this.ensureInitialized();

    const updatedConfig = await this.configManager.autoDetectServices();
    this.config = updatedConfig;

    if (this.serviceManager) {
      this.serviceManager.updateConfig(updatedConfig);
    }

    return updatedConfig;
  }

  // ============================================================================
  // HEALTH AND DIAGNOSTICS
  // ============================================================================

  /**
   * Check Docker health
   */
  async healthCheck(): Promise<{ docker: any; services: ServiceStatus[] }> {
    await this.ensureInitialized();

    const dockerInfo = await this.dockerUtils.checkDockerStatus();
    const services = await this.serviceManager!.getServiceStatus();

    return {
      docker: dockerInfo,
      services
    };
  }

  /**
   * Validate configuration
   */
  async validateConfig(): Promise<any> {
    await this.ensureInitialized();
    return this.validationUtils.validateConfig(this.config!);
  }

  /**
   * Wait for service to be healthy
   */
  async waitForHealth(serviceName: string, timeoutMs: number = 60000): Promise<boolean> {
    await this.ensureInitialized();
    return this.serviceManager!.waitForServiceHealth(serviceName, timeoutMs);
  }

  // ============================================================================
  // EVENT MANAGEMENT
  // ============================================================================

  /**
   * Emit Docker Pilot event
   */
  private emitEvent(type: EventType, data: any): void {
    const event: DockerPilotEvent = {
      type,
      timestamp: new Date(),
      data,
      source: 'DockerPilot'
    };

    this.emit(type, event);
    this.emit('event', event);
  }

  // ============================================================================
  // UTILITY AND LIFECYCLE
  // ============================================================================

  /**
   * Get version information
   */
  getVersion(): string {
    return require('../../package.json').version || '1.0.0';
  }

  /**
   * Get logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get available services
   */
  getServices(): string[] {
    return this.config ? Object.keys(this.config.services) : [];
  }

  /**
   * Check if service exists
   */
  hasService(serviceName: string): boolean {
    return this.config ? serviceName in this.config.services : false;
  }

  /**
   * Get project name
   */
  getProjectName(): string | null {
    return this.config?.projectName || null;
  }

  /**
   * Set working directory
   */
  setWorkingDirectory(directory: string): void {
    this.options.workingDirectory = directory;
    this.commandRunner.setDefaultOptions({ cwd: directory });
  }

  /**
   * Get working directory
   */
  getWorkingDirectory(): string {
    return this.options.workingDirectory;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.logger.debug('Cleaning up Docker Pilot resources...');
    this.removeAllListeners();
    this.initialized = false;
  }

  /**
   * Create a new Docker Pilot instance with custom options
   */
  static create(options: DockerPilotOptions = {}): DockerPilot {
    return new DockerPilot(options);
  }

  /**
   * Quick start method - one-liner for immediate use
   */  static async quickStart(options?: {
    interactive?: boolean;
    projectName?: string;
    autoDetect?: boolean;
  }): Promise<DockerPilot> {
    const pilot = new DockerPilot({
      autoLoadConfig: options?.autoDetect !== false
    });

    try {      // First, check if we have existing config with language
      let hasExistingLanguageConfig = false;
      let selectedLanguage: 'en' | 'pt-br' = 'en';
      let isFirstTime = false;

      try {
        // Check if config file exists first
        const fs = require('fs');
        const configExists = fs.existsSync(pilot.options.configPath);
        isFirstTime = !configExists;

        await pilot.initialize();
        if (pilot.config?.language) {
          hasExistingLanguageConfig = true;
          selectedLanguage = pilot.config.language;
        }
      } catch (error) {
        // Config doesn't exist or is invalid, definitely first time
        isFirstTime = true;
      }

      // If it's first time or no language config exists, prompt for language selection
      if (isFirstTime || !hasExistingLanguageConfig) {
        const { LanguageSetup } = await import('../utils/LanguageSetup');
        const languageSetup = new LanguageSetup();
        selectedLanguage = await languageSetup.quickLanguageSetup();

        // Apply language immediately to pilot instance
        pilot.i18n.setLanguage(selectedLanguage);

        // If we don't have config yet, initialize with the selected language
        if (!pilot.config) {
          await pilot.smartInitialize();
        }

        // Update or create config with selected language
        if (pilot.config) {
          await pilot.updateConfig({ language: selectedLanguage });
        }

        languageSetup.showWelcomeMessage(selectedLanguage);
      } else {
        // Apply existing language config immediately
        pilot.i18n.setLanguage(selectedLanguage);
      }

      if (options?.projectName && pilot.config) {
        await pilot.updateConfig({ projectName: options.projectName });
      }

      if (options?.autoDetect !== false) {
        await pilot.detectServices();
      }

      if (options?.interactive !== false) {
        const { InteractiveMenu } = await import('../interactive/InteractiveMenu');
        const menu = new InteractiveMenu(pilot);
        await menu.start();
      }

      return pilot;
    } catch (error) {
      console.error('❌ Erro no Docker Pilot Quick Start:', error);
      throw error;
    }  }

  /**
   * Smart initialization with auto-detection and setup
   */  async smartInitialize(): Promise<void> {
    try {
      console.log(this.i18n.t('setup.detecting'));

      // Try to initialize normally first
      await this.initialize();

      // Auto-detect docker-compose files if not configured
      if (!this.config || Object.keys(this.config.services).length === 0) {
        console.log(this.i18n.t('setup.configuring'));
        await this.autoDetectAndConfigure();
      }

      console.log(this.i18n.t('setup.success') + '\n');
    } catch (error) {
      console.log(this.i18n.t('setup.creating_initial'));
      await this.createInitialSetup();
    }
  }  /**
   * Auto-detect docker-compose files and configure services with recursive search
   */
  private async autoDetectAndConfigure(): Promise<void> {
    console.log(this.i18n.t('compose.recursive_search'));

    // Use enhanced recursive search
    const foundFiles = await this.fileUtils.findDockerComposeFilesWithInfo(this.getWorkingDirectory(), {
      maxDepth: 6,
      includeVariants: true,
      includeEmptyFiles: false
    });

    if (foundFiles.length === 0) {
      throw new Error(this.i18n.t('error.generic', { message: 'No docker-compose files found in project or subdirectories' }));
    }

    // Display found files
    if (foundFiles.length === 1) {
      const file = foundFiles[0];
      if (file) {
        console.log(this.i18n.t('autodetect.compose_found', { file: file.relativePath }));
        if (file.serviceCount > 0) {
          console.log(`   ${this.i18n.t('compose.services')}: ${file.services.join(', ')}`);
        }
        console.log(this.i18n.t('compose.file_info', { dir: file.directory }));

        await this.parseComposeFileAndUpdateConfig(file.path);
      }
    } else {
      console.log(this.i18n.t('compose.found_files_summary', { count: foundFiles.length }));

      // Show top 3 files as options
      const topFiles = foundFiles.slice(0, 3);
      topFiles.forEach((file, index) => {
        const envText = file.environment ? ` (${file.environment})` : '';
        const servicesText = file.services.length > 0 ? file.services.join(', ') : this.i18n.t('menu.no_services');
        console.log(`   ${index + 1}. ${file.relativePath}${envText}`);
        console.log(`      ${file.serviceCount} ${this.i18n.t('compose.services')}: ${servicesText}`);
        console.log(this.i18n.t('compose.file_info', { dir: path.relative(process.cwd(), file.directory) }));
      });

      // Use the first (highest priority) file automatically
      const selectedFile = foundFiles[0];
      if (selectedFile) {
        console.log(this.i18n.t('compose.using_first_file', { file: selectedFile.relativePath }));
        await this.parseComposeFileAndUpdateConfig(selectedFile.path);
      }
    }
  }

  /**
   * Parse docker-compose file and update configuration
   */
  private async parseComposeFileAndUpdateConfig(composeFilePath: string): Promise<void> {
    try {
      const fs = require('fs');
      const yaml = require('js-yaml');

      const fileContent = fs.readFileSync(composeFilePath, 'utf8');
      const composeData = yaml.load(fileContent) as any;

      if (composeData.services) {
        const detectedServices: any = {};

        Object.keys(composeData.services).forEach(serviceName => {
          const service = composeData.services[serviceName];
          const ports = this.extractPortsFromService(service);
            detectedServices[serviceName] = {
            description: `Auto-detected ${serviceName} service`,
            port: ports.length > 0 ? ports[0] : null,
            detected: true
          };

          console.log(this.i18n.t('setup.service_detected', { name: serviceName }) +
                      (ports.length > 0 ? ` (porta: ${ports[0]})` : ''));
        });

        // Update configuration
        const projectName = path.basename(this.getWorkingDirectory());
        await this.updateConfig({
          projectName,
          services: detectedServices,
          dockerCompose: `docker compose -f ${path.basename(composeFilePath)}`
        });
      }
    } catch (error) {
      console.warn('⚠️ Erro ao analisar docker-compose:', error);
    }
  }

  /**
   * Extract ports from docker-compose service definition
   */
  private extractPortsFromService(service: any): number[] {
    const ports: number[] = [];

    if (service.ports) {      service.ports.forEach((portMapping: string) => {
        const match = portMapping.toString().match(/^(\d+):/);
        if (match && match[1]) {
          ports.push(parseInt(match[1]));
        }
      });
    }

    return ports;
  }

  /**
   * Create initial setup for new projects
   */  private async createInitialSetup(): Promise<void> {
    console.log(this.i18n.t('setup.new_project'));

    const workingDir = this.getWorkingDirectory();
    const projectName = path.basename(workingDir);// Create basic configuration with required fields from configManager
    const basicConfig = await this.configManager.createDefaultConfig();
    basicConfig.projectName = projectName;
    basicConfig.services = {
      app: {
        port: 3000,
        description: 'Main application service',
        healthCheck: false,
        backupEnabled: false,
        restart: 'unless-stopped' as const,
        scale: 1
      }
    };

    // Save configuration
    this.config = basicConfig;
    await this.configManager.saveConfig(basicConfig);
      console.log(this.i18n.t('setup.initial_created'));
    console.log(this.i18n.t('setup.project_name', { name: projectName }));
    console.log(this.i18n.t('setup.edit_config'));
  }

  /**
   * Get command runner instance
   */
  getCommandRunner(): CommandRunner {
    return this.commandRunner;
  }

  /**
   * Get service manager instance
   */
  getServiceManager(): ServiceManager | null {
    return this.serviceManager;
  }
  /**
   * Execute a command by name
   */
  async executeCommand(commandName: string, args: string[] = []): Promise<CommandResult> {
    await this.ensureInitialized();
      switch (commandName.toLowerCase()) {
      case 'up':
        if (args.length > 0 && args[0]) {
          return this.startService(args[0]);
        }
        return this.up();

      case 'down':
        if (args.length > 0 && args[0]) {
          return this.stopService(args[0]);
        }
        return this.down();

      case 'restart':
        if (args.length > 0 && args[0]) {
          return this.restartService(args[0]);
        }
        return this.restart();

      case 'build':
        return this.build(args[0]);

      case 'logs':
        const logsResult = await this.logs(args[0], { follow: args.includes('--follow') });
        if ('success' in logsResult) {
          return logsResult;
        }
        // If it's a ChildProcess, return a success result
        return {
          success: true,
          output: 'Logs started',
          error: '',
          executionTime: 0
        };

      case 'status':
        const statusResult = await this.status();
        return {
          success: true,
          output: JSON.stringify(statusResult),
          error: '',
          executionTime: 0
        };

      case 'shell':
        if (!args[0]) {
          throw new DockerPilotError('SERVICE_NOT_FOUND', 'Service name required for shell command');
        }
        // Shell command returns a process, we'll handle it differently
        const shellResult = await this.exec(args[0], ['/bin/bash'], { interactive: true });
        if ('success' in shellResult) {
          return shellResult;
        }
        return {
          success: true,
          output: 'Shell opened',
          error: '',
          executionTime: 0
        };

      case 'exec':
        if (!args[0]) {
          throw new DockerPilotError('SERVICE_NOT_FOUND', 'Service name required for exec command');
        }
        const execResult = await this.exec(args[0], args.slice(1));
        if ('success' in execResult) {
          return execResult;
        }
        return {
          success: true,
          output: 'Command executed',
          error: '',
          executionTime: 0
        };

      case 'scale':
        const scaleArg = args[0];
        if (!scaleArg || !scaleArg.includes('=')) {
          throw new DockerPilotError('INVALID_ARGUMENT', 'Invalid scale format. Use: service=replicas');
        }
        const scaleParts = scaleArg.split('=');
        if (scaleParts.length !== 2 || !scaleParts[0] || !scaleParts[1]) {
          throw new DockerPilotError('INVALID_ARGUMENT', 'Invalid scale format. Use: service=replicas');
        }
        return this.scale(scaleParts[0], parseInt(scaleParts[1]));

      case 'pull':
        return this.pull(args[0]);

      case 'clean':
        return this.clean({ volumes: args.includes('--all') });

      case 'config':
        if (args.includes('--show')) {
          this.logger.info('Current configuration:');
          this.logger.info(JSON.stringify(this.config, null, 2));
          return { success: true, output: '', error: '', executionTime: 0 };
        }
        throw new DockerPilotError('UNKNOWN_COMMAND', 'Unknown config command');

      default:
        throw new DockerPilotError('UNKNOWN_COMMAND', `Unknown command: ${commandName}`);
    }
  }
  /**
   * Update language for all components
   */
  updateLanguage(language: string): void {
    this.i18n.setLanguage(language as any);

    // Update config language
    if (this.config) {
      this.config.language = language as any;
      this.configManager.updateConfig(this.config);
    }

    // Update ServiceManager language if available
    if (this.serviceManager) {
      this.serviceManager.updateLanguage(language);
    }

    // Emit language change event
    this.emit('language:changed', { language });
  }
}
