/**
 * Service Manager for Docker Pilot
 * Manages Docker services and their lifecycle
 */

import * as path from 'path';
import { DockerPilotConfig, ServiceConfig, ServiceStatus, ProjectStatus, ServiceError } from '../types';
import { Logger } from '../utils/Logger';
import { DockerUtils } from '../utils/DockerUtils';
import { CommandResult } from '../types';
import { I18n } from '../utils/i18n';

export interface ServiceManagerOptions {
  projectName?: string;
  composeFile?: string;
  workingDirectory?: string;
}

export class ServiceManager {
  private config: DockerPilotConfig;
  private logger: Logger;
  private dockerUtils: DockerUtils;
  private options: ServiceManagerOptions;
  private i18n: I18n;

  constructor(config: DockerPilotConfig, options: ServiceManagerOptions = {}) {
    this.config = config;
    this.logger = new Logger();
    this.dockerUtils = new DockerUtils(this.logger);

    // Initialize i18n with config language
    this.i18n = new I18n(config.language as any);

    // Initialize options first
    const workingDirectory = options.workingDirectory || process.cwd();

    this.options = {
      projectName: options.projectName || config.projectName,
      workingDirectory,
      composeFile: options.composeFile || this.findComposeFile(workingDirectory)
    };
  }  /**
   * Find Docker Compose file with enhanced search (synchronous for ServiceManager)
   */
  private findComposeFile(workingDirectory: string = process.cwd()): string {
    // First try basic files in working directory
    const possibleFiles = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml'
    ];

    for (const file of possibleFiles) {
      const filePath = path.join(workingDirectory, file);
      if (require('fs').existsSync(filePath)) {
        this.logger.debug(`Found compose file: ${file}`);
        return filePath;
      }
    }

    // If not found in root, try to search recursively in subdirectories (sync version)
    const fs = require('fs');
    const searchInDir = (dir: string, maxDepth: number = 3, currentDepth: number = 0): string | null => {
      if (currentDepth > maxDepth) return null;

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        // First check for compose files in current directory
        for (const file of possibleFiles) {
          const filePath = path.join(dir, file);
          if (fs.existsSync(filePath)) {
            this.logger.debug(`Found compose file in subdirectory: ${path.relative(workingDirectory, filePath)}`);
            return filePath;
          }
        }

        // Then search subdirectories
        for (const entry of entries) {
          if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
            const result = searchInDir(path.join(dir, entry.name), maxDepth, currentDepth + 1);
            if (result) return result;
          }
        }
      } catch (error) {
        this.logger.debug(`Failed to read directory ${dir}:`, error);
      }

      return null;
    };

    const foundFile = searchInDir(workingDirectory);
    if (foundFile) {
      return foundFile;
    }

    this.logger.debug('No compose file found, using default: docker-compose.yml');
    return path.join(workingDirectory, 'docker-compose.yml'); // Default fallback
  }

  /**
   * Check if directory should be skipped during search
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirectories = [
      'node_modules', '.git', '.vscode', '.idea', 'dist', 'build',
      'target', 'out', 'tmp', 'temp', '.next', '.nuxt', 'coverage',
      '__pycache__', '.pytest_cache', 'venv', 'env', '.env',
      'vendor', 'logs', '.docker'
    ];
    return skipDirectories.includes(dirName) || dirName.startsWith('.');
  }
  /**
   * Create safe options for Docker commands
   */
  private createDockerOptions(additionalOptions: any = {}): any {
    return {
      ...(this.options.workingDirectory && { cwd: this.options.workingDirectory }),
      ...(this.options.composeFile && { composeFile: this.options.composeFile }),
      ...additionalOptions
    };
  }
  /**
   * Start all services
   */
  async startAll(): Promise<CommandResult> {
    this.logger.loading(this.i18n.t('operation.starting_services'));

    try {
      const result = await this.dockerUtils.executeComposeCommand('up', ['-d'],
        this.createDockerOptions()
      );

      if (result.success) {
        this.logger.success(this.i18n.t('service.all_started'));
        await this.displayServiceStatus();
      } else {
        this.logger.error(this.i18n.t('service.failed_start', { name: 'services' }), result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('error.command_execution'), error);
      throw new ServiceError(`Failed to start services: ${errorMessage}`, { error });
    }
  }  /**
   * Stop all services
   */  async stopAll(): Promise<CommandResult> {
    this.logger.loading(this.i18n.t('operation.stopping_services'));

    try {
      const result = await this.dockerUtils.executeComposeCommand('down', [],
        this.createDockerOptions()
      );

      if (result.success) {
        this.logger.success(this.i18n.t('service.all_stopped'));
      } else {
        this.logger.error(this.i18n.t('service.failed_stop', { name: 'services' }), result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('error.command_execution'), error);

      return {
        success: false,
        output: '',
        error: `Failed to stop services: ${errorMessage}`,
        executionTime: 0
      };
    }
  }  /**
   * Restart all services
   */
  async restartAll(): Promise<CommandResult> {
    this.logger.loading(this.i18n.t('operation.restarting_services'));

    try {
      const result = await this.dockerUtils.executeComposeCommand('restart', [],
        this.createDockerOptions()
      );

      if (result.success) {
        this.logger.success(this.i18n.t('service.all_restarted'));
        await this.displayServiceStatus();
      } else {
        this.logger.error(this.i18n.t('service.failed_restart', { name: 'services' }), result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('error.command_execution'), error);

      return {
        success: false,
        output: '',
        error: `Failed to restart services: ${errorMessage}`,
        executionTime: 0
      };
    }
  }
  /**
   * Start specific service
   */
  async startService(serviceName: string): Promise<CommandResult> {    if (!this.isServiceConfigured(serviceName)) {
      throw new ServiceError(this.i18n.t('error.service_not_found', { name: serviceName }));
    }

    this.logger.loading(this.i18n.t('service.starting', { name: serviceName }));

    try {
      const result = await this.dockerUtils.executeComposeCommand('up', ['-d', serviceName],
        this.createDockerOptions()
      );

      if (result.success) {
        this.logger.success(this.i18n.t('service.started_success', { name: serviceName }));
        await this.displayServiceStatus(serviceName);
      } else {
        this.logger.error(this.i18n.t('service.failed_start', { name: serviceName }), result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('error.command_execution'), error);
      throw new ServiceError(`Failed to start service ${serviceName}: ${errorMessage}`, { serviceName, error });
    }
  }
  /**
   * Stop specific service
   */
  async stopService(serviceName: string): Promise<CommandResult> {
    if (!this.isServiceConfigured(serviceName)) {
      throw new ServiceError(this.i18n.t('error.service_not_found', { name: serviceName }));
    }

    this.logger.loading(this.i18n.t('service.stopping', { name: serviceName }));

    try {
      const result = await this.dockerUtils.executeComposeCommand('stop', [serviceName],
        this.createDockerOptions()
      );

      if (result.success) {
        this.logger.success(this.i18n.t('service.stopped_success', { name: serviceName }));
      } else {
        this.logger.error(this.i18n.t('service.failed_stop', { name: serviceName }), result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('error.command_execution'), error);
      throw new ServiceError(`Failed to stop service ${serviceName}: ${errorMessage}`, { serviceName, error });
    }
  }

  /**
   * Restart specific service
   */
  async restartService(serviceName: string): Promise<CommandResult> {
    if (!this.isServiceConfigured(serviceName)) {
      throw new ServiceError(`Service not configured: ${serviceName}`);
    }

    this.logger.loading(`Restarting service: ${serviceName}`);

    try {
      const result = await this.dockerUtils.executeComposeCommand('restart', [serviceName],
        this.createDockerOptions()
      );

      if (result.success) {
        this.logger.success(`Service ${serviceName} restarted successfully`);
        await this.displayServiceStatus(serviceName);
      } else {
        this.logger.error(`Failed to restart service ${serviceName}`, result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error restarting service ${serviceName}`, error);
      throw new ServiceError(`Failed to restart service ${serviceName}: ${errorMessage}`, { serviceName, error });
    }
  }

  /**
   * Build services
   */
  async buildServices(serviceName?: string, options: { noCache?: boolean; pull?: boolean } = {}): Promise<CommandResult> {
    const target = serviceName || 'all services';
    this.logger.loading(`Building ${target}...`);

    try {
      const args = ['build'];

      if (options.noCache) args.push('--no-cache');
      if (options.pull) args.push('--pull');
      if (serviceName) args.push(serviceName);

      const result = await this.dockerUtils.executeComposeCommand('build', args,
        this.createDockerOptions()
      );

      if (result.success) {
        this.logger.success(`${target} built successfully`);
      } else {
        this.logger.error(`Failed to build ${target}`, result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error building ${target}`, error);
      throw new ServiceError(`Failed to build ${target}: ${errorMessage}`, { serviceName, error });
    }
  }

  /**
   * Rebuild and start services
   */
  async rebuildServices(serviceName?: string): Promise<CommandResult[]> {
    const target = serviceName || 'all services';
    this.logger.loading(`Rebuilding ${target}...`);

    try {
      // Build first
      const buildResult = await this.buildServices(serviceName, { noCache: true });

      if (!buildResult.success) {
        return [buildResult];
      }

      // Then start
      const startResult = serviceName
        ? await this.startService(serviceName)
        : await this.startAll();

      return [buildResult, startResult];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error rebuilding ${target}`, error);
      throw new ServiceError(`Failed to rebuild ${target}: ${errorMessage}`, { serviceName, error });
    }
  }  /**
   * Get service logs
   */
  async getLogs(serviceName?: string, options: { follow?: boolean; tail?: number } = {}): Promise<CommandResult> {
    const target = serviceName || 'all services';
    this.logger.info(`Getting logs for ${target}...`);

    try {      const logOptions = {
        ...options,
        ...(this.options.projectName && { projectName: this.options.projectName }),
        ...(this.options.composeFile && { composeFile: this.options.composeFile })
      };

      const result = await this.dockerUtils.getLogs(serviceName || '', logOptions);

      // Handle the case where getLogs returns a ChildProcess (when follow is true)
      if ('pid' in result && typeof result.pid === 'number') {
        // It's a ChildProcess, return success immediately for follow mode
        return {
          success: true,
          output: 'Following logs...',
          error: '',
          executionTime: 0
        };
      }

      // It's a CommandResult
      return result as CommandResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting logs for ${target}`, error);

      return {
        success: false,
        output: '',
        error: `Failed to get logs for ${target}: ${errorMessage}`,
        executionTime: 0
      };
    }
  }

  /**
   * Execute command in service
   */
  async execInService(
    serviceName: string,
    command: string[],
    options: { interactive?: boolean; user?: string } = {}
  ) {
    if (!this.isServiceConfigured(serviceName)) {
      throw new ServiceError(`Service not configured: ${serviceName}`);
    }

    this.logger.info(`Executing command in ${serviceName}: ${command.join(' ')}`);

    try {
      const execOptions = {
        ...options,
        ...(options.interactive && { tty: options.interactive })
      };

      return await this.dockerUtils.execInService(serviceName, command, execOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error executing command in ${serviceName}`, error);
      throw new ServiceError(`Failed to execute command in ${serviceName}: ${errorMessage}`, { serviceName, error });
    }
  }

  /**
   * Scale service
   */
  async scaleService(serviceName: string, replicas: number): Promise<CommandResult> {
    if (!this.isServiceConfigured(serviceName)) {
      throw new ServiceError(`Service not configured: ${serviceName}`);
    }

    this.logger.loading(`Scaling ${serviceName} to ${replicas} replicas...`);

    try {
      const result = await this.dockerUtils.scaleService(serviceName, replicas);

      if (result.success) {
        this.logger.success(`Service ${serviceName} scaled to ${replicas} replicas`);
      } else {
        this.logger.error(`Failed to scale service ${serviceName}`, result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error scaling service ${serviceName}`, error);
      throw new ServiceError(`Failed to scale service ${serviceName}: ${errorMessage}`, { serviceName, error });
    }
  }

  /**
   * Get service status
   */  async getServiceStatus(serviceName?: string): Promise<ServiceStatus[]> {
    try {
      return await this.dockerUtils.getServiceStatus(
        this.options.projectName!,
        serviceName,
        this.options.composeFile ? { composeFile: this.options.composeFile } : undefined
      );
    } catch (error) {
      this.logger.error('Error getting service status', error);
      return [];
    }
  }

  /**
   * Get project status
   */
  async getProjectStatus(): Promise<ProjectStatus> {
    try {
      return await this.dockerUtils.getProjectStatus(this.options.projectName!);
    } catch (error) {
      this.logger.error('Error getting project status', error);
      throw new ServiceError('Failed to get project status', { error });
    }
  }

  /**
   * Display service status in a nice format
   */
  private async displayServiceStatus(serviceName?: string): Promise<void> {
    try {
      const services = await this.getServiceStatus(serviceName);

      if (services.length === 0) {
        this.logger.warn('No services found');
        return;
      }

      this.logger.newLine();
      this.logger.info('Service Status:');
      this.logger.separator('-', 40);

      for (const service of services) {
        const config = this.config.services[service.name];
        let statusLine = `${service.name}: ${service.state}`;

        if (service.health && service.health !== 'none') {
          statusLine += ` (${service.health})`;
        }

        if (config?.port && service.state === 'running') {
          const url = service.name === 'redis'
            ? `redis://localhost:${config.port}`
            : `http://localhost:${config.port}`;
          statusLine += ` - ${url}`;
        }

        if (config?.description) {
          statusLine += ` - ${config.description}`;
        }

        this.logger.service(service.name, service.state, {
          health: service.health,
          uptime: service.uptime,
          port: config?.port
        });
      }

      this.logger.newLine();
    } catch (error) {
      this.logger.debug('Error displaying service status', error);
    }
  }

  /**
   * Check if service is configured
   */
  private isServiceConfigured(serviceName: string): boolean {
    return serviceName in this.config.services;
  }

  /**
   * Get service configuration
   */
  getServiceConfig(serviceName: string): ServiceConfig | null {
    return this.config.services[serviceName] || null;
  }

  /**
   * Get all configured services
   */
  getConfiguredServices(): string[] {
    return Object.keys(this.config.services);
  }

  /**
   * Check if all services are running
   */
  async areAllServicesRunning(): Promise<boolean> {
    try {
      const services = await this.getServiceStatus();
      return services.length > 0 && services.every(service => service.state === 'running');
    } catch (error) {
      this.logger.error('Error checking service status', error);
      return false;
    }
  }

  /**
   * Wait for service to be healthy
   */
  async waitForServiceHealth(
    serviceName: string,
    timeoutMs: number = 60000,
    intervalMs: number = 2000
  ): Promise<boolean> {
    const startTime = Date.now();

    this.logger.loading(`Waiting for ${serviceName} to be healthy...`);

    while (Date.now() - startTime < timeoutMs) {
      try {
        const services = await this.getServiceStatus(serviceName);
        const service = services.find(s => s.name === serviceName);

        if (service && service.state === 'running' && service.health === 'healthy') {
          this.logger.success(`Service ${serviceName} is healthy`);
          return true;
        }

        await this.sleep(intervalMs);
      } catch (error) {
        this.logger.debug(`Error checking ${serviceName} health`, error);
        await this.sleep(intervalMs);
      }
    }

    this.logger.warn(`Timeout waiting for ${serviceName} to be healthy`);
    return false;
  }

  /**
   * Update service manager configuration
   */
  updateConfig(config: DockerPilotConfig): void {
    this.config = config;
  }

  /**
   * Update language for ServiceManager
   */
  updateLanguage(language: string): void {
    this.i18n.setLanguage(language as any);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current options
   */
  getOptions(): ServiceManagerOptions {
    return { ...this.options };
  }
}
