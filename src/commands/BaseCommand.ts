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
  abstract execute(args: string[], options: CommandOptions): Promise<CommandResult>;
  /**
   * Validate command arguments
   */
  protected validateArgs(args: string[], expectedCount?: number): boolean {
    if (expectedCount !== undefined && args.length !== expectedCount) {
      this.logger.error(this.i18n.t('error.invalid_choice'));
      this.showUsage();
      return false;
    }
    return true;
  }

  /**
   * Show command usage
   */
  showUsage(): void {
    this.logger.info(`Usage: ${this.usage}`);
    this.logger.info(`Description: ${this.description}`);
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
  }
  /**
   * Check if Docker is available
   */
  protected async checkDockerAvailable(): Promise<boolean> {
    try {
      // This would use DockerUtils to check if Docker is running
      return true;
    } catch (error) {
      this.logger.error(this.i18n.t('cmd.docker_not_running'));
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
  }
  /**
   * Parse command options
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
    }

    // In a real implementation, this would use inquirer or similar
    // For now, just return true
    this.logger.warn(message);
    return true;
  }
}
