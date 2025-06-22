/**
 * Configuration Manager for Docker Pilot
 * Handles loading, saving, and validation of configuration files
 */

import * as path from 'path';
import { DockerPilotConfig, DockerPilotConfigSchema, ConfigurationError } from '../types';
import { Logger } from '../utils/Logger';
import { FileUtils } from '../utils/FileUtils';
import { ValidationUtils } from '../utils/ValidationUtils';
import { I18n } from '../utils/i18n';

export interface ConfigManagerOptions {
  configPath?: string;
  autoSave?: boolean;
  createDefault?: boolean;
  validateOnLoad?: boolean;
}

export class ConfigManager {
  private config: DockerPilotConfig | null = null;
  private configPath: string;
  private logger: Logger;
  private fileUtils: FileUtils;
  private validationUtils: ValidationUtils;
  private options: Required<ConfigManagerOptions>;
  private i18n: I18n;

  constructor(options: ConfigManagerOptions = {}) {
    this.logger = new Logger();
    this.fileUtils = new FileUtils(this.logger);
    this.validationUtils = new ValidationUtils(this.logger, this.fileUtils);
    this.i18n = new I18n();

    this.options = {
      configPath: options.configPath || this.getDefaultConfigPath(),
      autoSave: options.autoSave ?? true,
      createDefault: options.createDefault ?? true,
      validateOnLoad: options.validateOnLoad ?? true
    };

    this.configPath = this.options.configPath;
  }

  /**
   * Get default configuration file path
   */
  private getDefaultConfigPath(): string {
    return path.join(process.cwd(), 'docker-pilot.config.json');
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<DockerPilotConfig> {
    try {
      this.logger.debug(`Loading configuration from: ${this.configPath}`);

      // Check if config file exists
      if (!(await this.fileUtils.exists(this.configPath))) {
        if (this.options.createDefault) {
          this.logger.info('Configuration file not found, creating default configuration');
          this.config = this.createDefaultConfig();
          await this.saveConfig();
          return this.config;
        } else {
          throw new ConfigurationError(
            `Configuration file not found: ${this.configPath}`,
            { configPath: this.configPath }
          );
        }
      }

      // Read configuration file
      const configData = await this.fileUtils.readJson(this.configPath);

      // Validate configuration if enabled
      if (this.options.validateOnLoad) {
        const validationResult = await this.validationUtils.validateConfig(configData);

        if (!validationResult.valid) {
          const errorMessages = validationResult.errors.map(err => `${err.field}: ${err.message}`);
          throw new ConfigurationError(
            `Configuration validation failed:\n${errorMessages.join('\n')}`,
            { errors: validationResult.errors, warnings: validationResult.warnings }
          );
        }

        if (validationResult.warnings.length > 0) {
          this.logger.warn('Configuration validation warnings:');
          validationResult.warnings.forEach(warning => {
            this.logger.warn(`  ${warning.field}: ${warning.message}`);
            if (warning.suggestion) {
              this.logger.warn(`    Suggestion: ${warning.suggestion}`);
            }
          });
        }
      }

      // Parse and store configuration
      this.config = DockerPilotConfigSchema.parse(configData);

      this.logger.success(`Configuration loaded successfully: ${this.configPath}`);
      return this.config;

    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }

      this.logger.error(`Failed to load configuration: ${this.configPath}`, error);
      throw new ConfigurationError(
        `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { configPath: this.configPath, originalError: error }
      );
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config?: DockerPilotConfig): Promise<void> {
    try {
      const configToSave = config || this.config;

      if (!configToSave) {
        throw new ConfigurationError('No configuration to save');
      }

      // Validate configuration before saving
      const validationResult = await this.validationUtils.validateConfig(configToSave);

      if (!validationResult.valid) {
        const errorMessages = validationResult.errors.map(err => `${err.field}: ${err.message}`);
        throw new ConfigurationError(
          `Cannot save invalid configuration:\n${errorMessages.join('\n')}`,
          { errors: validationResult.errors }
        );
      }

      // Create backup if file exists
      if (await this.fileUtils.exists(this.configPath)) {
        try {
          await this.fileUtils.backupFile(this.configPath);
          this.logger.debug('Configuration backup created');
        } catch (backupError) {
          this.logger.warn('Failed to create configuration backup', backupError);
        }
      }

      // Save configuration
      await this.fileUtils.writeJson(this.configPath, configToSave, { spaces: 2 });

      // Update stored configuration
      this.config = configToSave;

      this.logger.success(`Configuration saved: ${this.configPath}`);

    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }

      this.logger.error(`Failed to save configuration: ${this.configPath}`, error);
      throw new ConfigurationError(
        `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { configPath: this.configPath, originalError: error }
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): DockerPilotConfig {
    if (!this.config) {
      throw new ConfigurationError('Configuration not loaded. Call loadConfig() first.');
    }
    return { ...this.config }; // Return a copy to prevent mutations
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<DockerPilotConfig>): Promise<DockerPilotConfig> {
    if (!this.config) {
      throw new ConfigurationError('Configuration not loaded. Call loadConfig() first.');
    }

    // Merge updates with current configuration
    const updatedConfig = this.mergeConfig(this.config, updates);

    // Save if auto-save is enabled
    if (this.options.autoSave) {
      await this.saveConfig(updatedConfig);
    } else {
      this.config = updatedConfig;
    }

    return updatedConfig;
  }

  /**
   * Add or update a service
   */
  async addService(serviceName: string, serviceConfig: any): Promise<DockerPilotConfig> {
    if (!this.config) {
      throw new ConfigurationError('Configuration not loaded. Call loadConfig() first.');
    }

    const updatedServices = {
      ...this.config.services,
      [serviceName]: serviceConfig
    };

    return this.updateConfig({ services: updatedServices });
  }

  /**
   * Remove a service
   */
  async removeService(serviceName: string): Promise<DockerPilotConfig> {
    if (!this.config) {
      throw new ConfigurationError('Configuration not loaded. Call loadConfig() first.');
    }

    if (!(serviceName in this.config.services)) {
      throw new ConfigurationError(`Service not found: ${serviceName}`);
    }

    const updatedServices = { ...this.config.services };
    delete updatedServices[serviceName];

    return this.updateConfig({ services: updatedServices });
  }

  /**
   * Add a plugin
   */
  async addPlugin(pluginPath: string): Promise<DockerPilotConfig> {
    if (!this.config) {
      throw new ConfigurationError('Configuration not loaded. Call loadConfig() first.');
    }

    if (this.config.plugins.includes(pluginPath)) {
      this.logger.warn(`Plugin already exists: ${pluginPath}`);
      return this.config;
    }

    const updatedPlugins = [...this.config.plugins, pluginPath];
    return this.updateConfig({ plugins: updatedPlugins });
  }

  /**
   * Remove a plugin
   */
  async removePlugin(pluginPath: string): Promise<DockerPilotConfig> {
    if (!this.config) {
      throw new ConfigurationError('Configuration not loaded. Call loadConfig() first.');
    }

    const updatedPlugins = this.config.plugins.filter(p => p !== pluginPath);
    return this.updateConfig({ plugins: updatedPlugins });
  }
  /**
   * Create default configuration
   */
  public createDefaultConfig(): DockerPilotConfig {
    const projectName = this.inferProjectName();

    return {
      projectName,
      dockerCompose: 'docker compose',
      configVersion: '1.0',      services: {
        app: {
          port: 3000,
          path: './',
          description: 'Main application service',
          healthCheck: true,
          backupEnabled: false,
          restart: 'unless-stopped',
          scale: 1
        }
      },
      plugins: [],
      cli: {
        version: '1.0.0',
        welcomeMessage: `Bem-vindo ao {projectName} Docker Pilot v{version}! 🐳`,
        goodbyeMessage: 'Obrigado por usar o {projectName} Docker Pilot!',
        interactiveMode: true,
        colorOutput: true,
        verboseLogging: false,
        confirmDestructiveActions: true
      },
      backup: {
        enabled: false,
        directory: './backups',
        retention: 7,
        services: {}
      },
      monitoring: {
        enabled: true,
        refreshInterval: 5,
        services: ['app'],
        urls: {},
        alerts: {
          enabled: false,
          thresholds: {
            cpu: 80,
            memory: 80,
            disk: 90
          }
        }
      },
      development: {
        hotReload: true,
        debugMode: false,
        logLevel: 'info',
        autoMigrate: false,
        seedData: false,
        testMode: false,
        watchFiles: [],        environment: 'development'
      },
      networks: {},
      volumes: {},
      language: 'en' as const
    };
  }

  /**
   * Infer project name from current directory or package.json
   */
  private inferProjectName(): string {
    try {
      // Try to get name from package.json
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (require('fs').existsSync(packageJsonPath)) {
        const packageJson = require(packageJsonPath);
        if (packageJson.name) {
          return packageJson.name;
        }
      }
    } catch (error) {
      // Ignore errors, fall back to directory name
    }

    // Fall back to current directory name
    return path.basename(process.cwd()) || 'docker-pilot-project';
  }
  /**
   * Deep merge configuration objects
   */
  private mergeConfig(base: DockerPilotConfig, updates: Partial<DockerPilotConfig>): DockerPilotConfig {
    const merged = { ...base };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== null) {
        if (key === 'services') {
          // For services, always replace completely instead of merging
          // This ensures clean replacement when autoDetectServices(true) is called
          (merged as any)[key] = value;
        } else if (typeof value === 'object' && !Array.isArray(value) && key in merged) {
          // Deep merge other objects
          (merged as any)[key] = { ...(merged as any)[key], ...value };
        } else {
          // Direct assignment for primitives and arrays
          (merged as any)[key] = value;
        }
      }
    }

    return merged;
  }/**
   * Detect Docker Compose services from file or search recursively with enhanced search
   */
  async detectServicesFromCompose(composePath?: string): Promise<Record<string, any>> {
    try {
      let composeFile: string;

      if (composePath) {
        composeFile = composePath;
      } else {
        // Search for docker-compose files recursively with enhanced options
        const foundFiles = await this.fileUtils.findDockerComposeFilesWithInfo(undefined, {
          maxDepth: 6,
          includeVariants: true,
          includeEmptyFiles: false
        });

        if (foundFiles.length === 0) {
          this.logger.debug(this.i18n.t('compose.no_files_found'));
          return {};
        }

        // Use the first file (sorted by priority)
        const firstFile = foundFiles[0];
        if (!firstFile) {
          this.logger.debug(this.i18n.t('compose.no_files_found'));
          return {};
        }

        composeFile = firstFile.path;

        if (foundFiles.length > 1) {
          this.logger.info(this.i18n.t('compose.multiple_files_found', { count: foundFiles.length }));
          foundFiles.slice(0, 3).forEach((file, index) => {
            const envText = file.environment ? ` (${file.environment})` : '';
            const mainFileIndicator = file.isMainFile ? ' 🎯' : '';
            this.logger.info(`  ${index + 1}. ${file.relativePath}${envText}${mainFileIndicator} (${file.serviceCount} ${this.i18n.t('compose.services')})`);
          });
          this.logger.info(this.i18n.t('compose.using_first_file', { file: firstFile.relativePath }));
        }
      }

      if (!(await this.fileUtils.exists(composeFile))) {
        this.logger.debug(this.i18n.t('compose.file_not_found', { file: composeFile }));
        return {};
      }

      this.logger.info(this.i18n.t('compose.detecting_services', { file: path.relative(process.cwd(), composeFile) }));

      const composeData = await this.fileUtils.readYaml(composeFile);

      if (!composeData.services) {
        this.logger.warn(this.i18n.t('compose.no_services_in_file'));
        return {};
      }

      const detectedServices: Record<string, any> = {};

      for (const [serviceName, serviceConfig] of Object.entries(composeData.services)) {
        const config = serviceConfig as any;        detectedServices[serviceName] = {
          description: `Auto-detected ${serviceName} service`,
          healthCheck: !!config.healthcheck,
          backupEnabled: this.shouldEnableBackup(serviceName),
          detected: true,
          ...(config.ports && config.ports.length > 0 && {
            port: this.extractPortFromMapping(config.ports[0])
          }),
          ...(config.volumes && {
            volumes: config.volumes
          }),
          ...(config.environment && {
            environment: this.normalizeEnvironmentVariables(config.environment)
          })
        };
      }

      this.logger.success(`Detected ${Object.keys(detectedServices).length} services`);
      return detectedServices;

    } catch (error) {
      this.logger.error('Failed to detect services from Docker Compose file', error);
      return {};
    }
  }
  /**
   * Determine if backup should be enabled for service
   */
  private shouldEnableBackup(serviceName: string): boolean {
    const backupCandidates = [
      'postgres', 'postgresql', 'mysql', 'mariadb', 'mongodb', 'mongo',
      'redis', 'elasticsearch', 'database', 'db'
    ];

    return backupCandidates.some(candidate =>
      serviceName.toLowerCase().includes(candidate)
    );
  }

  /**
   * Normalize environment variables to ensure all values are strings
   */
  private normalizeEnvironmentVariables(env: any): Record<string, string> {
    if (!env || typeof env !== 'object') {
      return {};
    }

    const normalizedEnv: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(env)) {
      // Convert any value to string
      if (value === null || value === undefined) {
        normalizedEnv[key] = '';
      } else if (typeof value === 'boolean') {
        normalizedEnv[key] = value.toString();
      } else if (typeof value === 'number') {
        normalizedEnv[key] = value.toString();
      } else {
        normalizedEnv[key] = String(value);
      }
    }

    return normalizedEnv;
  }
  /**
   * Extract port number from Docker port mapping
   */
  private extractPortFromMapping(portMapping: string): number | null {
    try {
      if (typeof portMapping !== 'string') return null;

      // Handle various port mapping formats
      const match = portMapping.match(/(\d+):(\d+)/);
      if (match && match[1]) {
        return parseInt(match[1], 10); // Host port
      }

      const singlePortMatch = portMapping.match(/^(\d+)$/);
      if (singlePortMatch && singlePortMatch[1]) {
        return parseInt(singlePortMatch[1], 10);
      }

      return null;
    } catch {
      return null;
    }
  }
  /**
   * Auto-detect and update services from Docker Compose
   */  async autoDetectServices(replaceExisting: boolean = false): Promise<DockerPilotConfig> {
    // Use primary compose file if available
    let composePath: string | undefined;

    if (this.config?.primaryComposeFile) {
      composePath = this.config.primaryComposeFile;
      this.logger.info(`Using primary compose file: ${path.relative(process.cwd(), composePath)}`);
    }

    const detectedServices = await this.detectServicesFromCompose(composePath);

    if (Object.keys(detectedServices).length === 0) {
      this.logger.info('No services detected to add');
      return this.getConfig();
    }

    const currentServices = this.config?.services || {};
    let mergedServices: Record<string, any>;
    let addedCount = 0;
    let updatedCount = 0;
    let replacedCount = 0;
    let removedCount = 0;

    if (replaceExisting) {
      // Start fresh - only include detected services
      mergedServices = {};
      
      // Add all detected services
      for (const [serviceName, serviceConfig] of Object.entries(detectedServices)) {
        mergedServices[serviceName] = serviceConfig;
        
        if (serviceName in currentServices) {
          replacedCount++;
        } else {
          addedCount++;
        }
      }
      
      // Count removed services
      removedCount = Object.keys(currentServices).filter(
        serviceName => !(serviceName in detectedServices)
      ).length;
      
    } else {
      // Merge mode - start with current services
      mergedServices = { ...currentServices };
      
      for (const [serviceName, serviceConfig] of Object.entries(detectedServices)) {
        if (serviceName in currentServices) {
          // Update existing service with detected information
          mergedServices[serviceName] = {
            ...serviceConfig,
            ...mergedServices[serviceName], // Keep user customizations
            detected: true
          };
          updatedCount++;
        } else {
          // Add new service
          mergedServices[serviceName] = serviceConfig;
          addedCount++;
        }
      }
    }    if (addedCount > 0 || updatedCount > 0 || replacedCount > 0 || removedCount > 0) {
      const result = await this.updateConfig({ services: mergedServices });

      if (replaceExisting) {
        const totalDetected = Object.keys(detectedServices).length;
        if (removedCount > 0) {
          this.logger.success(`Services synchronized: ${totalDetected} services from compose file (${addedCount} new, ${replacedCount} replaced, ${removedCount} removed)`);
        } else if (replacedCount > 0) {
          this.logger.success(`Services synchronized: ${totalDetected} services from compose file (${addedCount} new, ${replacedCount} replaced)`);
        } else {
          this.logger.success(`Services synchronized: ${totalDetected} services from compose file`);
        }
      } else {
        this.logger.success(`Services updated: ${addedCount} added, ${updatedCount} updated`);
      }
      return result;
    } else {
      this.logger.info('All services are already configured');
      return this.getConfig();
    }
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Set configuration file path
   */
  setConfigPath(configPath: string): void {
    this.configPath = configPath;
    this.options.configPath = configPath;
  }

  /**
   * Check if configuration is loaded
   */
  isLoaded(): boolean {
    return this.config !== null;
  }

  /**
   * Reset configuration to default
   */
  async resetToDefault(): Promise<DockerPilotConfig> {
    this.config = this.createDefaultConfig();

    if (this.options.autoSave) {
      await this.saveConfig();
    }

    this.logger.info('Configuration reset to default');
    return this.config;
  }

  /**
   * Export configuration to different file
   */
  async exportConfig(exportPath: string): Promise<void> {
    if (!this.config) {
      throw new ConfigurationError('Configuration not loaded. Call loadConfig() first.');
    }

    await this.fileUtils.writeJson(exportPath, this.config, { spaces: 2 });
    this.logger.success(`Configuration exported to: ${exportPath}`);
  }

  /**
   * Import configuration from file
   */
  async importConfig(importPath: string): Promise<DockerPilotConfig> {
    if (!(await this.fileUtils.exists(importPath))) {
      throw new ConfigurationError(`Import file not found: ${importPath}`);
    }

    const importedConfig = await this.fileUtils.readJson(importPath);

    // Validate imported configuration
    const validationResult = await this.validationUtils.validateConfig(importedConfig);

    if (!validationResult.valid) {
      const errorMessages = validationResult.errors.map(err => `${err.field}: ${err.message}`);
      throw new ConfigurationError(
        `Invalid configuration in import file:\n${errorMessages.join('\n')}`,
        { errors: validationResult.errors }
      );
    }

    // Parse and set as current configuration
    this.config = DockerPilotConfigSchema.parse(importedConfig);

    if (this.options.autoSave) {
      await this.saveConfig();
    }

    this.logger.success(`Configuration imported from: ${importPath}`);
    return this.config;
  }
}
