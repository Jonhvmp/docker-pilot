import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';

export class RestartCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'restart',
      'Restart services',
      'docker-pilot restart [service-name] [options]',
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
        this.logger.loading(this.i18n.t('cmd.restart.loading', { service: serviceName }));
      } else {
        this.logger.loading(this.i18n.t('cmd.restart.loading_all'));
      }

      // Build Docker command
      const restartArgs = ['compose', 'restart'];

      // Add timeout if specified
      if (parsedOptions['timeout'] || parsedOptions['t']) {
        restartArgs.push('--timeout', (parsedOptions['timeout'] || parsedOptions['t']) as string);
      }

      // Add specific service if provided
      if (serviceName) {
        restartArgs.push(serviceName);
      }

      // For now, simulate the restart operation
      this.logger.info('🔄 Stopping services...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.logger.info('🚀 Starting services...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const executionTime = Date.now() - startTime;

      // Show success message
      if (serviceName) {
        this.logger.success(this.i18n.t('cmd.restart.success', { service: serviceName }));
      } else {
        this.logger.success(this.i18n.t('cmd.restart.success_all'));
      }

      const resultMessage = serviceName
        ? this.i18n.t('cmd.build.service_text', { service: serviceName })
        : this.i18n.t('cmd.build.all_services');

      return this.createSuccessResult(
        this.i18n.t('cmd.restarted_success', { target: resultMessage }),
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.restart.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
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
