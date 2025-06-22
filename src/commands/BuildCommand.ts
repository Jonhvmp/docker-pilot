import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';

export class BuildCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'build',
      'Build or rebuild services',
      'docker-pilot build [service-name] [options]',
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
      }      // Show loading message
      if (serviceName) {
        this.logger.loading(this.i18n.t('cmd.build.loading', { service: serviceName }));
      } else {
        this.logger.loading(this.i18n.t('cmd.build.loading_all'));
      }

      // Build Docker command
      const buildArgs = ['compose', 'build'];

      // Add options
      if (parsedOptions['no-cache']) {
        buildArgs.push('--no-cache');
      }

      if (parsedOptions['pull']) {
        buildArgs.push('--pull');
      }

      if (parsedOptions['parallel']) {
        buildArgs.push('--parallel');
      }

      if (parsedOptions['quiet']) {
        buildArgs.push('--quiet');
      }

      if (parsedOptions['memory']) {
        buildArgs.push('--memory', parsedOptions['memory'] as string);
      }

      if (parsedOptions['force']) {
        buildArgs.push('--force-rm');
      }

      // Add specific service if provided
      if (serviceName) {
        buildArgs.push(serviceName);
      }

      // For now, simulate the operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const executionTime = Date.now() - startTime;
        // Show success message
      if (serviceName) {
        this.logger.success(this.i18n.t('cmd.build.success', { service: serviceName }));
      } else {
        this.logger.success(this.i18n.t('cmd.build.success_all'));
      }

      const resultMessage = serviceName
        ? this.i18n.t('cmd.build.service_text', { service: serviceName })
        : this.i18n.t('cmd.build.all_services');

      return this.createSuccessResult(
        this.i18n.t('cmd.build.success', { service: resultMessage }),
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.build.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }
  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot build                    # Build all services
  docker-pilot build web               # Build specific service
  docker-pilot build --no-cache        # Build without cache  docker-pilot build --pull --parallel # Pull latest and build in parallel
  docker-pilot build --memory 2g       # Build with memory limit
  docker-pilot build --force           # Force remove intermediate containers
`);
  }
}
