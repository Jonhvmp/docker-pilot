import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RestartCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'restart',
      'Restart services',
      'docker-pilot restart [service-name] [options]',
      context
    );
  }  async execute(args: string[], _options: CommandOptions): Promise<CommandResult> {
    const { args: parsedArgs, options: parsedOptions } = this.parseOptions(args);
    const serviceName = parsedArgs[0];

    try {
      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      // Show loading message
      if (serviceName) {
        this.logger.loading(this.i18n.t('cmd.restart.loading', { service: serviceName }));
      } else {
        this.logger.loading(this.i18n.t('cmd.restart.loading_all'));
      }

      const { result: restartOutput, executionTime } = await this.measureExecutionTime(async () => {
        return await this.restartServices(serviceName, parsedOptions);
      });

      // Show restart output
      this.showRestartResults(restartOutput, serviceName);

      // Show success message
      if (serviceName) {
        this.logger.success(this.i18n.t('cmd.restart.success', { service: serviceName }));
      } else {
        this.logger.success(this.i18n.t('cmd.restart.success_all'));
      }

      const resultMessage = serviceName
        ? `service "${serviceName}"`
        : 'all services';

      return this.createSuccessResult(
        `✅ Successfully restarted ${resultMessage}`,
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.restart.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }  /**
   * Restart services using docker compose restart
   */
  private async restartServices(serviceName?: string, options?: Record<string, any>): Promise<string> {
    try {      // Build Docker command
      const composeFile = this.context.composeFile;
      const restartArgs = ['docker', 'compose'];

      // Add compose file if available (always should be from context)
      if (composeFile) {
        restartArgs.push('-f', composeFile);
      } else {
        this.logger.warn('RestartCommand: No compose file in context, command may fail');
      }

      restartArgs.push('restart');

      // Add timeout if specified
      if (options?.['timeout'] || options?.['t']) {
        restartArgs.push('--timeout', (options['timeout'] || options['t']) as string);
      }

      // Add no-deps option if specified
      if (options?.['no-deps']) {
        restartArgs.push('--no-deps');
      }

      // Add specific service if provided
      if (serviceName) {
        restartArgs.push(serviceName);
      }

      const command = restartArgs.join(' ');
      this.logger.debug(`Executing: ${command}`);

      const result = await this.execDockerCommand(command);

      return result.stdout || 'Services restarted successfully';

    } catch (error) {
      this.logger.warn(`Failed to restart services: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Execute Docker command with proper error handling
   */
  private async execDockerCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const result = await execAsync(command, {
        cwd: this.context.workingDirectory,
        maxBuffer: 1024 * 1024 // 1MB buffer
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
   * Display restart results with formatting
   */
  private showRestartResults(output: string, serviceName?: string): void {
    if (!output || output.trim() === '' || output === 'Services restarted successfully') {
      // No specific output to show, just indicate success
      if (serviceName) {
        this.logger.info(`🔄 Service "${serviceName}" restarted`);
      } else {
        this.logger.info('🔄 All services restarted');
      }
      return;
    }

    this.logger.newLine();
    this.logger.info('📋 Restart details:');
    this.logger.separator('-', 30);

    // Display the output
    const lines = output.split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
      if (line.includes('ERROR') || line.includes('error')) {
        this.logger.error(`  ${line}`);
      } else if (line.includes('WARN') || line.includes('warn')) {
        this.logger.warn(`  ${line}`);
      } else {
        this.logger.info(`  ${line}`);
      }
    });

    this.logger.newLine();
  }

  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot restart                 # Restart all services
  docker-pilot restart web             # Restart specific service
  docker-pilot restart --timeout 30    # Restart with custom timeout
  docker-pilot restart web --timeout 10 # Restart web service with 10s timeout
`);
  }
}
