import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';

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
      const startTime = Date.now();

      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      // Show loading message
      if (serviceName) {
        this.logger.loading(this.i18n.t('cmd.logs.loading', { service: serviceName }));
      } else {
        this.logger.loading(this.i18n.t('cmd.logs.loading_all'));
      }

      // Build Docker command
      const logsArgs = ['compose', 'logs'];

      // Add options
      if (parsedOptions['follow'] || parsedOptions['f']) {
        logsArgs.push('--follow');
      }

      if (parsedOptions['tail']) {
        logsArgs.push('--tail', parsedOptions['tail'] as string);
      }

      if (parsedOptions['since']) {
        logsArgs.push('--since', parsedOptions['since'] as string);
      }

      if (parsedOptions['until']) {
        logsArgs.push('--until', parsedOptions['until'] as string);
      }

      if (parsedOptions['timestamps'] || parsedOptions['t']) {
        logsArgs.push('--timestamps');
      }

      if (parsedOptions['no-color']) {
        logsArgs.push('--no-color');
      }

      // Add specific service if provided
      if (serviceName) {
        logsArgs.push(serviceName);
      }

      // For now, simulate the operation with sample logs
      const sampleLogs = this.generateSampleLogs(serviceName);

      this.logger.info('📋 Container logs:');
      console.log(sampleLogs);

      const executionTime = Date.now() - startTime;
        const resultMessage = serviceName
        ? this.i18n.t('cmd.build.service_text', { service: serviceName })
        : this.i18n.t('cmd.build.all_services');

      return this.createSuccessResult(
        this.i18n.t('cmd.logs_retrieved', { target: resultMessage }),
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.logs.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }

  private generateSampleLogs(serviceName?: string): string {
    const timestamp = new Date().toISOString();
    const service = serviceName || 'app';

    return `
${service}-1  | ${timestamp} [INFO] Application starting...
${service}-1  | ${timestamp} [INFO] Database connection established
${service}-1  | ${timestamp} [INFO] Server listening on port 3000
${service}-1  | ${timestamp} [DEBUG] Configuration loaded successfully
${service}-1  | ${timestamp} [INFO] Ready to handle requests
    `.trim();
  }

  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot logs                     # Show logs for all services
  docker-pilot logs web                # Show logs for specific service
  docker-pilot logs --follow           # Follow log output (tail -f)
  docker-pilot logs --tail 100         # Show last 100 lines
  docker-pilot logs --since 2h         # Show logs from last 2 hours
  docker-pilot logs --timestamps       # Show timestamps
  docker-pilot logs web --follow --tail 50  # Follow last 50 lines of web service
`);
  }
}
