import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class LogsCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'logs',
      'View output from containers',
      'docker-pilot logs [service-name] [options]',
      context
    );
  }

  async execute(args: string[], _options: CommandOptions): Promise<CommandResult> {
    const { args: parsedArgs, options: parsedOptions } = this.parseOptions(args);
    const serviceName = parsedArgs[0];

    try {
      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      // Show loading message
      if (serviceName) {
        this.logger.info(this.i18n.t('cmd.logs.loading', { service: serviceName }));
      } else {
        this.logger.info('Getting logs for all services...');
      }

      const { result: logsOutput, executionTime } = await this.measureExecutionTime(async () => {
        return await this.getContainerLogs(serviceName, parsedOptions);
      });

      // Display logs
      this.showContainerLogs(logsOutput, serviceName);

      // Create summary for interactive menu
      const logSummary = this.createLogsSummary(logsOutput, serviceName);

      return this.createSuccessResult(
        logSummary,
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.logs.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }  /**
   * Get real container logs using docker compose logs
   */
  private async getContainerLogs(serviceName?: string, options?: Record<string, any>): Promise<string> {
    try {
      // Build Docker command
      const composeFile = this.context.composeFile;
      const logsArgs = ['docker', 'compose'];

      // Add compose file if available (always should be from context)
      if (composeFile) {
        logsArgs.push('-f', composeFile);
      }

      logsArgs.push('logs');

      // Add options
      const isFollowMode = options?.['follow'] || options?.['f'];

      if (isFollowMode) {
        logsArgs.push('--follow');
      }

      if (options?.['tail']) {
        logsArgs.push('--tail', options['tail'] as string);
      } else if (!isFollowMode) {
        // Default to last 50 lines if not following and no tail specified
        logsArgs.push('--tail', '50');
      }

      if (options?.['since']) {
        logsArgs.push('--since', options['since'] as string);
      }

      if (options?.['until']) {
        logsArgs.push('--until', options['until'] as string);
      }

      if (options?.['timestamps'] || options?.['t']) {
        logsArgs.push('--timestamps');
      }

      // Add specific service if provided
      if (serviceName) {
        logsArgs.push(serviceName);
      }      const command = logsArgs.join(' ');

      // Handle follow mode differently
      if (isFollowMode) {
        // For follow mode, we need to handle the streaming output
        return await this.execDockerCommandStream(command);
      } else {
        const result = await this.execDockerCommand(command);
        return result.stdout || 'No logs available';
      }

    } catch (error) {
      this.logger.warn(`Failed to get container logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 'Failed to retrieve logs';
    }
  }
  /**
   * Execute Docker command with streaming support for follow mode
   */
  private async execDockerCommandStream(command: string): Promise<string> {
    try {      return new Promise((resolve, reject) => {
        const args = command.split(' ');
        const cmd = args.shift();

        const child = spawn(cmd!, args, {
          cwd: this.context.workingDirectory,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let isFirstOutput = true;

        child.stdout.on('data', (data: Buffer) => {
          const chunk = data.toString();
          output += chunk;

          // Stream output directly to console for follow mode
          if (isFirstOutput) {
            this.logger.newLine();
            isFirstOutput = false;
          }
          process.stdout.write(chunk);
        });

        child.stderr.on('data', (data: Buffer) => {
          const chunk = data.toString();
          process.stderr.write(chunk);
        });        child.on('error', (error: Error) => {
          reject(error);
        });

        child.on('close', (code: number | null) => {
          if (code === 0 || output.length > 0) {
            resolve(output || 'Logs streaming completed');
          } else {
            reject(new Error(`Command failed with exit code ${code}`));
          }
        });

        // Handle Ctrl+C to gracefully stop following
        process.on('SIGINT', () => {
          this.logger.newLine();
          this.logger.info('🛑 Stopping log stream...');
          child.kill('SIGTERM');
          resolve(output || 'Log streaming stopped by user');
        });
      });
    } catch (error) {
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
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for logs
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
   * Display container logs with formatting
   */
  private showContainerLogs(logs: string, serviceName?: string): void {
    this.logger.newLine();

    if (serviceName) {
      this.logger.info(`📋 Logs for service: ${serviceName}`);
    } else {
      this.logger.info('📋 Logs for all services');
    }

    this.logger.separator('-', 50);
    this.logger.newLine();

    if (!logs || logs.trim() === '' || logs === 'No logs available') {
      this.logger.info('No logs available for the specified criteria.');
      this.logger.info('💡 Tip: Make sure the service is running and has generated some logs.');
      return;
    }

    // Display the logs directly
    console.log(logs);

    this.logger.newLine();
  }
  /**
   * Create a summary of logs for interactive menu
   */
  private createLogsSummary(logs: string, serviceName?: string): string {
    const target = serviceName ? `service "${serviceName}"` : 'all services';

    if (!logs || logs.trim() === '' || logs === 'No logs available') {
      return `📭 No logs available for ${target}. Make sure the service is running and has generated some logs.`;
    }

    const lines = logs.split('\n').filter(line => line.trim() !== '');
    const lineCount = lines.length;

    return `📋 Retrieved ${lineCount} log lines for ${target}`;
  }
  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot logs                     # Show last 50 lines for all services
  docker-pilot logs mailhog            # Show last 50 lines for mailhog service
  docker-pilot logs --follow           # Follow log output (tail -f) for all services
  docker-pilot logs --tail 100         # Show last 100 lines for all services
  docker-pilot logs --since 2h         # Show logs from last 2 hours
  docker-pilot logs --timestamps       # Show logs with timestamps
  docker-pilot logs mailhog --follow --tail 20  # Follow last 20 lines of mailhog service
  docker-pilot logs --since "2023-01-01 12:00:00"  # Show logs since specific time
`);
  }
}
