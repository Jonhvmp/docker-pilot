/**
 * Down Command - Stop all services or specific service
 */

import { CommandResult, CommandOptions, CommandContext } from '../types';
import { BaseCommand } from './BaseCommand';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DownCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'down',
      'Stop all services or a specific service',
      'docker-pilot down [service-name] [options]',
      context
    );
  }
  async execute(args: string[], _options: CommandOptions): Promise<CommandResult> {
    const { args: parsedArgs, options: parsedOptions } = this.parseOptions(args);
    const serviceName = parsedArgs[0];    try {
      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      // Confirm action if it's destructive
      if (parsedOptions['volumes'] || parsedOptions['remove-orphans']) {
        const volumeAction = parsedOptions['volumes'] ? this.i18n.t('cmd.confirm_volumes') : '';
        const target = serviceName || this.i18n.t('cmd.all_services');
        const action = volumeAction + this.i18n.t('cmd.confirm_stop', { target });

        const confirmed = await this.confirmAction(
          this.i18n.t('cmd.confirm_action', { action })
        );

        if (!confirmed) {
          return this.createErrorResult(this.i18n.t('cmd.operation_cancelled'));
        }
      }      const target = serviceName || this.i18n.t('cmd.all_services');
      this.logger.loading(this.i18n.t('cmd.stopping', { target }));

      // Execute the real Docker command
      const { result: stopOutput, executionTime } = await this.measureExecutionTime(async () => {
        return await this.stopServices(serviceName, parsedOptions);
      });      // Display stop results
      this.showStopResults(stopOutput);

      this.logger.success(this.i18n.t('cmd.stopped_success', { target }));

      const resultMessage = serviceName
        ? `service "${serviceName}"`
        : 'all services';

      return this.createSuccessResult(
        `Successfully stopped ${resultMessage}`,
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const target = serviceName || this.i18n.t('cmd.all_services');
      this.logger.error(this.i18n.t('cmd.stop_failed', { target }), error);
      return this.createErrorResult(errorMessage);
    }
  }
  protected override showExamples(): void {
    this.logger.info('\nExamples:');
    this.logger.info('  docker-pilot down                   # Stop all services');
    this.logger.info('  docker-pilot down backend           # Stop only backend service');
    this.logger.info('  docker-pilot down --volumes         # Stop and remove volumes');
    this.logger.info('  docker-pilot down --remove-orphans  # Stop and remove orphan containers');
  }

  private async stopServices(serviceName?: string, options?: Record<string, any>): Promise<string> {
    try {
      // Build Docker command
      const downArgs = ['docker', 'compose', 'down'];

      // Add options
      if (options?.['volumes'] || options?.['v']) {
        downArgs.push('--volumes');
      }

      if (options?.['remove-orphans']) {
        downArgs.push('--remove-orphans');
      }

      if (options?.['rmi']) {
        downArgs.push('--rmi', options['rmi'] as string);
      }

      if (options?.['timeout'] || options?.['t']) {
        downArgs.push('--timeout', (options['timeout'] || options['t']) as string);
      }

      // Add specific service if provided
      if (serviceName) {
        downArgs.push(serviceName);
      }

      const command = downArgs.join(' ');
      this.logger.debug(`Executing: ${command}`);

      const result = await this.execDockerCommand(command);

      return result.stdout || 'Services stopped successfully';

    } catch (error) {
      this.logger.warn(`Failed to stop services: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async execDockerCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const result = await execAsync(command, {
        cwd: this.context.workingDirectory,
        maxBuffer: 1024 * 1024 * 5 // 5MB buffer
      });
      return result;
    } catch (error: any) {
      // Some docker commands return non-zero exit codes but still have useful output
      if (error.stdout) {
        return { stdout: error.stdout, stderr: error.stderr || '' };
      }
      throw error;
    }
  }
  /**
   * Display stop results with formatting
   */
  private showStopResults(output: string): void {
    if (!output || output.trim() === '' || output === 'Services stopped successfully') {
      // No specific output to show, stop was clean
      return;
    }

    this.logger.newLine();
    this.logger.info('📋 Stop details:');
    this.logger.separator('-', 30);

    // Display the output
    const lines = output.split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
      if (line.includes('ERROR') || line.includes('error')) {
        this.logger.error(`  ${line}`);
      } else if (line.includes('WARN') || line.includes('warn')) {
        this.logger.warn(`  ${line}`);
      } else if (line.includes('Stopped') || line.includes('Removed') || line.includes('Stopping')) {
        this.logger.success(`  ${line}`);
      } else {
        this.logger.info(`  ${line}`);
      }
    });

    this.logger.newLine();
  }
}
