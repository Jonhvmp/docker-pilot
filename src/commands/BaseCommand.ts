/**
 * Base Command class for Docker Pilot CLI
 * Provides common functionality for all commands
 */

import { CommandResult, CommandOptions, CommandContext } from '../types';
import { Logger } from '../utils/Logger';
import { I18n } from '../utils/i18n';

export abstract class BaseCommand {
  protected logger: Logger;
  protected context: CommandContext;
  protected i18n: I18n;

  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly usage: string,
    context: CommandContext
  ) {
    this.logger = context.logger;
    this.context = context;
    this.i18n = new I18n();

    // Set language from config if available
    if (context.config?.language) {
      this.i18n.setLanguage(context.config.language as any);
    }
  }

  /**
   * Execute the command
   */
  abstract execute(args: string[], options: CommandOptions): Promise<CommandResult>;  /**
   * Validate command arguments
   */
  protected validateArgs(args: string[], expectedCount?: number): boolean {
    if (expectedCount !== undefined && args.length !== expectedCount) {
      this.logger.error(this.i18n.t('error.invalid_args_count', {
        expected: expectedCount,
        received: args.length
      }));
      this.showUsage();
      return false;
    }
    return true;
  }
  /**
   * Show command usage
   */
  showUsage(): void {
    this.logger.info(`${this.i18n.t('base.usage')}: ${this.usage}`);
    this.logger.info(`${this.i18n.t('base.description')}: ${this.description}`);
  }

  /**
   * Show help for the command
   */
  showHelp(): void {
    this.showUsage();
    this.showExamples();
  }

  /**
   * Show command examples
   * Override this method in subclasses
   */
  protected showExamples(): void {
    // Override in subclasses
    this.logger.info(`\n${this.i18n.t('base.examples')}:`);
  }  /**
   * Check if Docker is available
   */
  protected async checkDockerAvailable(): Promise<boolean> {
    try {
      // Check if Docker is available using context's docker utilities
      if (this.context.workingDirectory) {
        // Use a simple docker --version check to verify Docker is available
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        await execAsync('docker --version');
        return true;
      }
      return true;
    } catch (error) {
      this.logger.error(this.i18n.t('base.docker_unavailable'));
      return false;
    }
  }
  /**
   * Create successful command result
   */
  protected createSuccessResult(output?: string, executionTime?: number): CommandResult {
    return {
      success: true,
      ...(output && { output }),
      ...(executionTime && { executionTime }),
      exitCode: 0
    };
  }

  /**
   * Create error command result
   */
  protected createErrorResult(error: string, exitCode: number = 1, executionTime?: number): CommandResult {
    return {
      success: false,
      error,
      exitCode,
      ...(executionTime && { executionTime })
    };
  }

  /**
   * Measure execution time
   */
  protected async measureExecutionTime<T>(operation: () => Promise<T>): Promise<{ result: T; executionTime: number }> {
    const startTime = Date.now();
    const result = await operation();
    const executionTime = Date.now() - startTime;
    return { result, executionTime };
  }  /**
   * Parse command options from arguments
   * Supports both long (--option) and short (-o) option formats
   * Examples:
   *   --follow
   *   --tail=50
   *   --since 1h
   *   -f
   */
  protected parseOptions(args: string[]): { args: string[]; options: Record<string, any> } {
    const options: Record<string, any> = {};
    const filteredArgs: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (!arg) continue;

      if (arg.startsWith('--')) {
        const [key, value] = arg.split('=');
        const optionKey = key?.substring(2);

        if (!optionKey) continue;

        if (value !== undefined) {
          options[optionKey] = value;        } else if (i + 1 < args.length && args[i + 1] && !args[i + 1]!.startsWith('-')) {
          options[optionKey] = args[i + 1];
          i++; // Skip next arg as it's the value
        } else {
          options[optionKey] = true;
        }
      } else if (arg.startsWith('-')) {
        const optionKey = arg.substring(1);
        if (i + 1 < args.length && args[i + 1] && !args[i + 1]!.startsWith('-')) {
          options[optionKey] = args[i + 1];
          i++; // Skip next arg as it's the value
        } else {
          options[optionKey] = true;
        }
      } else {
        filteredArgs.push(arg);
      }
    }

    return { args: filteredArgs, options };
  }
  /**
   * Confirm destructive action
   */
  protected async confirmAction(message: string): Promise<boolean> {
    if (!this.context.config.cli.confirmDestructiveActions) {
      return true;
    }    // Show warning message
    this.logger.warn(message);
    this.logger.warn(this.i18n.t('base.destructive_warning'));

    // In a real CLI environment, this would use readline or inquirer
    // For now, we'll assume confirmation is given
    // TODO: Implement proper confirmation input for CLI usage
    return true;
  }
  /**
   * Validate service name exists in configuration
   */
  protected validateService(serviceName: string): boolean {
    if (!this.context.config.services[serviceName]) {
      this.logger.error(this.i18n.t('error.service_not_found', { service: serviceName }));

      const availableServices = Object.keys(this.context.config.services);
      if (availableServices.length > 0) {
        this.logger.info(this.i18n.t('base.available_services'));
        availableServices.forEach(service => {
          this.logger.info(`  - ${service}`);
        });
      }
      return false;
    }
    return true;
  }

  /**
   * Get available services from configuration
   */
  protected getAvailableServices(): string[] {
    return Object.keys(this.context.config.services);
  }

  /**
   * Get the main compose file from context
   */
  protected getComposeFile(): string | undefined {
    return this.context.composeFile;
  }

  /**
   * Check if any services are configured
   */
  protected hasConfiguredServices(): boolean {
    return Object.keys(this.context.config.services).length > 0;
  }
}
