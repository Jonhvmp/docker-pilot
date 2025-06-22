/**
 * Up Command - Start all services or specific service
 */

import { CommandResult, CommandOptions, CommandContext } from '../types';
import { BaseCommand } from './BaseCommand';

export class UpCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'up',
      'Start all services or a specific service',
      'docker-pilot up [service-name] [options]',
      context
    );
  }  async execute(args: string[], _options: CommandOptions): Promise<CommandResult> {
    const { args: parsedArgs, options: parsedOptions } = this.parseOptions(args);
    const serviceName = parsedArgs[0];

    try {
      const startTime = Date.now();

      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      const target = serviceName || this.i18n.t('cmd.all_services');
      this.logger.loading(this.i18n.t('cmd.starting', { target }));

      // Here we would use the DockerPilot instance to start services
      // For now, just simulate the operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const executionTime = Date.now() - startTime;

      this.logger.success(this.i18n.t('cmd.started_success', { target }));

      if (parsedOptions['detach'] !== false) {
        this.showServiceInfo(serviceName);
      }

      return this.createSuccessResult(
        this.i18n.t('cmd.started_success', { target }),
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const target = serviceName || this.i18n.t('cmd.all_services');
      this.logger.error(this.i18n.t('cmd.start_failed', { target }), error);
      return this.createErrorResult(errorMessage);
    }
  }

  protected override showExamples(): void {
    this.logger.info('\nExamples:');
    this.logger.info('  docker-pilot up                    # Start all services');
    this.logger.info('  docker-pilot up backend            # Start only backend service');
    this.logger.info('  docker-pilot up --build            # Start with rebuild');
    this.logger.info('  docker-pilot up --detach=false     # Start in foreground');
  }

  private showServiceInfo(serviceName?: string): void {
    this.logger.info('\n📋 Service Information:');

    if (serviceName) {
      const serviceConfig = this.context.config.services[serviceName];
      if (serviceConfig && serviceConfig.port) {
        const url = serviceName === 'redis'
          ? `redis://localhost:${serviceConfig.port}`
          : `http://localhost:${serviceConfig.port}`;
        this.logger.info(`🔗 ${serviceName}: ${url} - ${serviceConfig.description || 'Service running'}`);
      }
    } else {
      // Show all services
      Object.entries(this.context.config.services).forEach(([name, config]) => {
        if (config.port) {
          const url = name === 'redis'
            ? `redis://localhost:${config.port}`
            : `http://localhost:${config.port}`;
          this.logger.info(`🔗 ${name}: ${url} - ${config.description || 'Service running'}`);
        }
      });
    }
  }
}
