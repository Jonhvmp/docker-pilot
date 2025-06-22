/**
 * Validation utility functions
 * Provides validation for various Docker Pilot configurations and inputs
 */

import { z } from 'zod';
import * as semver from 'semver';
import { DockerPilotConfig, DockerPilotConfigSchema } from '../types';
import { Logger } from './Logger';
import { FileUtils } from './FileUtils';
import { I18n } from './i18n';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export class ValidationUtils {
  private fileUtils: FileUtils;
  private i18n: I18n;
    constructor(_logger?: Logger, fileUtils?: FileUtils) {
    this.fileUtils = fileUtils || new FileUtils();
    this.i18n = new I18n();
  }
  /**
   * Update language for validation messages
   */
  updateLanguage(language: string): void {
    this.i18n.setLanguage(language as any);
  }

  /**
   * Validate Docker Pilot configuration
   */
  async validateConfig(config: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Schema validation using Zod
      const validatedConfig = DockerPilotConfigSchema.parse(config);

      // Additional business logic validations
      await this.validateBusinessRules(validatedConfig, result);

    } catch (error) {
      if (error instanceof z.ZodError) {
        result.valid = false;        result.errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: this.i18n.t('validation.config_invalid') + ': ' + err.message,
          code: err.code,
          value: 'received' in err ? err.received : undefined
        }));
      } else {
        result.valid = false;        result.errors.push({
          field: 'general',
          message: this.i18n.t('validation.config_invalid'),
          code: 'UNKNOWN_ERROR'
        });
      }
    }

    return result;
  }

  /**
   * Validate business rules beyond schema validation
   */
  private async validateBusinessRules(config: DockerPilotConfig, result: ValidationResult): Promise<void> {
    // Validate project name
    this.validateProjectName(config.projectName, result);

    // Validate services
    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      await this.validateService(serviceName, serviceConfig, result);
    }

    // Validate Docker Compose configuration
    this.validateDockerComposeCommand(config.dockerCompose, result);

    // Validate plugin paths
    await this.validatePlugins(config.plugins, result);

    // Validate backup configuration
    this.validateBackupConfig(config.backup, result);

    // Validate monitoring configuration
    this.validateMonitoringConfig(config.monitoring, result);

    // Check for common misconfigurations
    this.checkCommonMisconfigurations(config, result);
  }

  /**
   * Validate project name
   */
  private validateProjectName(projectName: string, result: ValidationResult): void {
    // Check for valid Docker project name
    const dockerProjectNameRegex = /^[a-z0-9][a-z0-9_-]*$/;

    if (!dockerProjectNameRegex.test(projectName.toLowerCase())) {
      result.warnings.push({
        field: 'projectName',
        message: 'Project name should contain only lowercase letters, numbers, hyphens, and underscores',
        suggestion: 'Use a Docker-compatible project name format'
      });
    }

    if (projectName.length > 63) {
      result.errors.push({
        field: 'projectName',
        message: 'Project name cannot exceed 63 characters',
        code: 'INVALID_LENGTH',
        value: projectName
      });
      result.valid = false;
    }
  }

  /**
   * Validate individual service configuration
   */
  private async validateService(serviceName: string, serviceConfig: any, result: ValidationResult): Promise<void> {
    // Validate service name
    if (!this.isValidServiceName(serviceName)) {
      result.errors.push({
        field: `services.${serviceName}`,
        message: 'Invalid service name format',
        code: 'INVALID_SERVICE_NAME',
        value: serviceName
      });
      result.valid = false;
    }

    // Validate port configuration
    if (serviceConfig.port !== null && serviceConfig.port !== undefined) {
      if (!this.isValidPort(serviceConfig.port)) {
        result.errors.push({
          field: `services.${serviceName}.port`,
          message: 'Port must be between 1 and 65535',
          code: 'INVALID_PORT',
          value: serviceConfig.port
        });
        result.valid = false;
      }

      // Check for common port conflicts
      this.checkPortConflicts(serviceName, serviceConfig.port, result);
    }

    // Validate path if provided
    if (serviceConfig.path) {
      const pathExists = await this.fileUtils.exists(serviceConfig.path);
      if (!pathExists) {
        result.warnings.push({
          field: `services.${serviceName}.path`,
          message: `Service path does not exist: ${serviceConfig.path}`,
          suggestion: 'Ensure the path exists or remove it from configuration'
        });
      }
    }

    // Validate environment variables
    if (serviceConfig.environment) {
      this.validateEnvironmentVariables(serviceName, serviceConfig.environment, result);
    }

    // Validate volume mounts
    if (serviceConfig.volumes) {
      this.validateVolumes(serviceName, serviceConfig.volumes, result);
    }

    // Validate resource limits
    if (serviceConfig.cpu_limit) {
      this.validateCpuLimit(serviceName, serviceConfig.cpu_limit, result);
    }

    if (serviceConfig.memory_limit) {
      this.validateMemoryLimit(serviceName, serviceConfig.memory_limit, result);
    }
  }

  /**
   * Validate Docker Compose command
   */
  private validateDockerComposeCommand(dockerCompose: string, result: ValidationResult): void {
    const validCommands = ['docker-compose', 'docker compose'];

    if (!validCommands.includes(dockerCompose)) {
      result.warnings.push({
        field: 'dockerCompose',
        message: `Non-standard Docker Compose command: ${dockerCompose}`,
        suggestion: 'Consider using "docker compose" (newer) or "docker-compose" (legacy)'
      });
    }
  }

  /**
   * Validate plugin paths
   */
  private async validatePlugins(plugins: string[], result: ValidationResult): Promise<void> {
    for (const pluginPath of plugins) {
      const exists = await this.fileUtils.exists(pluginPath);
      if (!exists) {
        result.warnings.push({
          field: 'plugins',
          message: `Plugin file not found: ${pluginPath}`,
          suggestion: 'Ensure plugin files exist or remove them from configuration'
        });
      }
    }
  }

  /**
   * Validate backup configuration
   */
  private validateBackupConfig(backupConfig: any, result: ValidationResult): void {
    if (backupConfig.enabled && backupConfig.retention < 1) {
      result.errors.push({
        field: 'backup.retention',
        message: 'Backup retention must be at least 1 day',
        code: 'INVALID_RETENTION',
        value: backupConfig.retention
      });
      result.valid = false;
    }

    // Validate backup schedule if provided
    if (backupConfig.schedule) {
      if (!this.isValidCronExpression(backupConfig.schedule)) {
        result.errors.push({
          field: 'backup.schedule',
          message: 'Invalid cron expression format',
          code: 'INVALID_CRON',
          value: backupConfig.schedule
        });
        result.valid = false;
      }
    }
  }

  /**
   * Validate monitoring configuration
   */
  private validateMonitoringConfig(monitoringConfig: any, result: ValidationResult): void {
    if (monitoringConfig.enabled && monitoringConfig.refreshInterval < 1) {
      result.errors.push({
        field: 'monitoring.refreshInterval',
        message: 'Refresh interval must be at least 1 second',
        code: 'INVALID_INTERVAL',
        value: monitoringConfig.refreshInterval
      });
      result.valid = false;
    }

    // Validate monitoring URLs
    for (const [serviceName, url] of Object.entries(monitoringConfig.urls || {})) {
      if (typeof url === 'string' && !this.isValidUrl(url)) {
        result.warnings.push({
          field: `monitoring.urls.${serviceName}`,
          message: `Invalid URL format: ${url}`,
          suggestion: 'Ensure URLs are properly formatted with protocol'
        });
      }
    }

    // Validate alert thresholds
    if (monitoringConfig.alerts?.thresholds) {
      const thresholds = monitoringConfig.alerts.thresholds;

      for (const [metric, value] of Object.entries(thresholds)) {
        if (typeof value === 'number' && (value < 0 || value > 100)) {
          result.errors.push({
            field: `monitoring.alerts.thresholds.${metric}`,
            message: `Threshold value must be between 0 and 100`,
            code: 'INVALID_THRESHOLD',
            value
          });
          result.valid = false;
        }
      }
    }
  }

  /**
   * Check for common misconfigurations
   */
  private checkCommonMisconfigurations(config: DockerPilotConfig, result: ValidationResult): void {
    // Check for port conflicts between services
    const usedPorts = new Map<number, string[]>();

    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      if (serviceConfig.port) {
        if (!usedPorts.has(serviceConfig.port)) {
          usedPorts.set(serviceConfig.port, []);
        }
        usedPorts.get(serviceConfig.port)?.push(serviceName);
      }
    }

    for (const [port, services] of usedPorts) {
      if (services.length > 1) {
        result.warnings.push({
          field: 'services',
          message: `Port ${port} is used by multiple services: ${services.join(', ')}`,
          suggestion: 'Ensure each service uses a unique port'
        });
      }
    }

    // Check for missing health checks on critical services
    const criticalServices = ['database', 'db', 'postgres', 'mysql', 'mongodb', 'redis'];

    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      if (criticalServices.some(critical => serviceName.toLowerCase().includes(critical))) {
        if (!serviceConfig.healthCheck) {
          result.warnings.push({
            field: `services.${serviceName}.healthCheck`,
            message: `Critical service "${serviceName}" should have health checks enabled`,
            suggestion: 'Enable health checks for better monitoring'
          });
        }
      }
    }
  }

  /**
   * Validate service name format
   */
  private isValidServiceName(name: string): boolean {
    // Docker service names should be lowercase, alphanumeric with hyphens/underscores
    const serviceNameRegex = /^[a-z0-9][a-z0-9_-]*$/;
    return serviceNameRegex.test(name) && name.length <= 63;
  }

  /**
   * Validate port number
   */
  private isValidPort(port: number): boolean {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  }

  /**
   * Check for common port conflicts
   */
  private checkPortConflicts(serviceName: string, port: number, result: ValidationResult): void {
    const wellKnownPorts: Record<number, string> = {
      22: 'SSH',
      23: 'Telnet',
      25: 'SMTP',
      53: 'DNS',
      80: 'HTTP',
      110: 'POP3',
      143: 'IMAP',
      443: 'HTTPS',
      993: 'IMAPS',
      995: 'POP3S'
    };

    if (wellKnownPorts[port]) {
      result.warnings.push({
        field: `services.${serviceName}.port`,
        message: `Port ${port} is commonly used by ${wellKnownPorts[port]}`,
        suggestion: 'Consider using a different port to avoid conflicts'
      });
    }
  }

  /**
   * Validate environment variables
   */
  private validateEnvironmentVariables(serviceName: string, env: Record<string, string>, result: ValidationResult): void {
    for (const [key, value] of Object.entries(env)) {
      // Check for valid environment variable names
      if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
        result.warnings.push({
          field: `services.${serviceName}.environment.${key}`,
          message: 'Environment variable names should contain only letters, numbers, and underscores',
          suggestion: 'Use standard environment variable naming conventions'
        });
      }

      // Check for sensitive data in plain text
      if (this.containsSensitiveData(key, value)) {
        result.warnings.push({
          field: `services.${serviceName}.environment.${key}`,
          message: 'Sensitive data detected in environment variable',
          suggestion: 'Consider using Docker secrets or external configuration'
        });
      }
    }
  }

  /**
   * Validate volume mounts
   */
  private validateVolumes(serviceName: string, volumes: string[], result: ValidationResult): void {
    for (const volume of volumes) {
      if (volume.includes(':')) {
        const [source] = volume.split(':');
        // Check if source path is absolute and exists
        if (source && (source.startsWith('/') || source.match(/^[A-Z]:\\/))) {
          // This is a bind mount - source should exist
          result.warnings.push({
            field: `services.${serviceName}.volumes`,
            message: `Bind mount source should exist: ${source}`,
            suggestion: 'Ensure the source directory exists before starting the service'
          });
        }
      }
    }
  }

  /**
   * Validate CPU limit format
   */
  private validateCpuLimit(serviceName: string, cpuLimit: string, result: ValidationResult): void {
    const cpuRegex = /^(\d+(\.\d+)?)(m|$)/;

    if (!cpuRegex.test(cpuLimit)) {
      result.errors.push({
        field: `services.${serviceName}.cpu_limit`,
        message: 'Invalid CPU limit format',
        code: 'INVALID_CPU_LIMIT',
        value: cpuLimit
      });
      result.valid = false;
    }
  }

  /**
   * Validate memory limit format
   */
  private validateMemoryLimit(serviceName: string, memoryLimit: string, result: ValidationResult): void {
    const memoryRegex = /^(\d+)(b|k|m|g|t|ki|mi|gi|ti)$/i;

    if (!memoryRegex.test(memoryLimit)) {
      result.errors.push({
        field: `services.${serviceName}.memory_limit`,
        message: 'Invalid memory limit format',
        code: 'INVALID_MEMORY_LIMIT',
        value: memoryLimit
      });
      result.valid = false;
    }
  }

  /**
   * Check if value contains sensitive data
   */
  private containsSensitiveData(key: string, value: string): boolean {
    const sensitiveKeywords = [
      'password', 'secret', 'key', 'token', 'auth', 'credential',
      'pass', 'pwd', 'private', 'secure'
    ];

    const keyLower = key.toLowerCase();
    return sensitiveKeywords.some(keyword => keyLower.includes(keyword)) &&
           value.length > 0 &&
           !value.startsWith('${') && // Not a variable reference
           !value.startsWith('/run/secrets/'); // Not a Docker secret
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate cron expression (basic validation)
   */
  private isValidCronExpression(cron: string): boolean {
    const cronRegex = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)(\s+(\S+))?$/;
    return cronRegex.test(cron);
  }

  /**
   * Validate version string
   */
  validateVersion(version: string): boolean {
    return semver.valid(version) !== null;
  }

  /**
   * Validate Docker Compose file structure
   */
  async validateDockerComposeStructure(composeData: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!composeData.services) {
      result.valid = false;
      result.errors.push({
        field: 'services',
        message: 'Docker Compose file must contain a services section',
        code: 'MISSING_SERVICES'
      });
      return result;
    }

    // Validate each service
    for (const [serviceName, serviceConfig] of Object.entries(composeData.services)) {
      this.validateDockerComposeService(serviceName, serviceConfig as any, result);
    }

    return result;
  }

  /**
   * Validate individual Docker Compose service
   */
  private validateDockerComposeService(serviceName: string, serviceConfig: any, result: ValidationResult): void {
    // Must have either image or build
    if (!serviceConfig.image && !serviceConfig.build) {
      result.warnings.push({
        field: `services.${serviceName}`,
        message: 'Service should specify either "image" or "build"',
        suggestion: 'Add an image reference or build configuration'
      });
    }

    // Validate port mappings
    if (serviceConfig.ports) {
      for (const port of serviceConfig.ports) {
        if (typeof port === 'string' && !this.isValidPortMapping(port)) {
          result.warnings.push({
            field: `services.${serviceName}.ports`,
            message: `Invalid port mapping format: ${port}`,
            suggestion: 'Use format "host_port:container_port" or just "port"'
          });
        }
      }
    }

    // Validate depends_on references
    if (serviceConfig.depends_on) {
      // This would need access to all services to validate references
      // For now, just warn about common issues
      if (Array.isArray(serviceConfig.depends_on)) {
        for (const dependency of serviceConfig.depends_on) {
          if (dependency === serviceName) {
            result.errors.push({
              field: `services.${serviceName}.depends_on`,
              message: 'Service cannot depend on itself',
              code: 'CIRCULAR_DEPENDENCY',
              value: dependency
            });
            result.valid = false;
          }
        }
      }
    }
  }

  /**
   * Validate Docker port mapping format
   */
  private isValidPortMapping(portMapping: string): boolean {
    // Valid formats: "8080:80", "8080:80/tcp", "80", "127.0.0.1:8080:80"
    const portRegex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:)?(\d+:)?\d+(\/tcp|\/udp)?$/;
    return portRegex.test(portMapping);
  }
}
