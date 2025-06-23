import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
    const serviceName = parsedArgs[0];    try {
      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      // Check if services are configured
      if (!this.hasConfiguredServices()) {
        this.logger.warn(this.i18n.t('cmd.no_services_configured'));
        this.logger.info(this.i18n.t('cmd.run_setup_first'));
        return this.createErrorResult(this.i18n.t('cmd.no_services_configured'));
      }// Validate service if provided
      if (serviceName && !this.validateService(serviceName)) {
        return this.createErrorResult(this.i18n.t('error.service_not_found', { service: serviceName }));
      }

      // Show loading message
      if (serviceName) {
        this.logger.loading(this.i18n.t('cmd.build.loading', { service: serviceName }));
      } else {
        this.logger.loading(this.i18n.t('cmd.build.loading_all'));
      }      // Build Docker command
      const composeFile = this.context.composeFile;
      const buildArgs = ['docker', 'compose'];

      // Add compose file if available (always should be from context)
      if (composeFile) {
        buildArgs.push('-f', composeFile);
      } else {
        this.logger.warn('BuildCommand: No compose file in context, command may fail');
      }

      buildArgs.push('build');

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
      }      // Execute the build command
      const command = buildArgs.join(' ');
      this.logger.debug(`Executing: ${command}`);

      const { executionTime } = await this.measureExecutionTime(async () => {
        return await execAsync(command, {
          cwd: this.context.workingDirectory,
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
        });
      });
        // Show success message
      if (serviceName) {
        this.logger.success(this.i18n.t('cmd.build.success', { service: serviceName }));
      } else {
        this.logger.success(this.i18n.t('cmd.build.success_all'));
      }

      const resultMessage = serviceName
        ? this.i18n.t('cmd.build.service_text', { service: serviceName })
        : this.i18n.t('cmd.build.all_services');      return this.createSuccessResult(
        this.i18n.t('cmd.build_retrieved', { target: resultMessage }),
        executionTime
      );

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle specific Docker errors
      if (errorMessage.includes('permission denied')) {
        this.logger.error(this.i18n.t('cmd.build.permission_denied'));
        return this.createErrorResult(this.i18n.t('cmd.build.permission_denied'));
      }

      if (errorMessage.includes('no such file or directory')) {
        this.logger.error(this.i18n.t('cmd.build.dockerfile_not_found'));
        return this.createErrorResult(this.i18n.t('cmd.build.dockerfile_not_found'));
      }

      if (errorMessage.includes('failed to solve')) {
        this.logger.error(this.i18n.t('cmd.build.build_failed'));
        this.logger.error(`Details: ${errorMessage}`);
        return this.createErrorResult(this.i18n.t('cmd.build.build_failed'));
      }

      this.logger.error(this.i18n.t('cmd.build.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot build                    # Build all services
  docker-pilot build web               # Build specific service
  docker-pilot build --no-cache        # Build without using cache
  docker-pilot build --pull            # Pull latest images before building
  docker-pilot build --parallel        # Build services in parallel
  docker-pilot build --quiet           # Suppress build output
  docker-pilot build --memory 2g       # Build with memory limit
  docker-pilot build --force           # Force remove intermediate containers
  docker-pilot build web --no-cache    # Build specific service without cache
  docker-pilot build --pull --parallel # Pull latest and build in parallel
`);
  }
}
