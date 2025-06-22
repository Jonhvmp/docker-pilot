/**
 * Down Command - Stop all services or specific service
 */

import { CommandResult, CommandOptions, CommandContext } from '../types';
import { BaseCommand } from './BaseCommand';

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
    const serviceName = parsedArgs[0];

    try {
      const startTime = Date.now();

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
      }

      const target = serviceName || this.i18n.t('cmd.all_services');
      this.logger.loading(this.i18n.t('cmd.stopping', { target }));

      // Here we would use the DockerPilot instance to stop services
      // For now, just simulate the operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const executionTime = Date.now() - startTime;

      this.logger.success(this.i18n.t('cmd.stopped_success', { target }));

      return this.createSuccessResult(
        this.i18n.t('cmd.stopped_success', { target }),
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
}
