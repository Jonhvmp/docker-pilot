/**
 * Status Command - Show status of services
 */

import { CommandResult, CommandOptions, CommandContext } from '../types';
import { BaseCommand } from './BaseCommand';

export class StatusCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'status',
      'Show status of all services or a specific service',
      'docker-pilot status [service-name] [options]',
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

      this.logger.info(this.i18n.t('cmd.status.loading'));

      // Here we would use the DockerPilot instance to get service status
      // For now, just simulate the operation
      await new Promise(resolve => setTimeout(resolve, 500));

      const executionTime = Date.now() - startTime;

      this.showServiceStatus(serviceName, parsedOptions);

      const resultMessage = serviceName
        ? this.i18n.t('cmd.build.service_text', { service: serviceName })
        : this.i18n.t('cmd.build.all_services');

      return this.createSuccessResult(
        this.i18n.t('cmd.status_retrieved', { target: resultMessage }),
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.status.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }

  protected override showExamples(): void {
    this.logger.info('\nExamples:');
    this.logger.info('  docker-pilot status                 # Show status of all services');
    this.logger.info('  docker-pilot status backend        # Show status of backend service');
    this.logger.info('  docker-pilot status --detailed     # Show detailed status information');
    this.logger.info('  docker-pilot status --json         # Output status in JSON format');
  }
  private showServiceStatus(serviceName?: string, options?: Record<string, any>): void {
    this.logger.newLine();
    this.logger.info(this.i18n.t('cmd.status.title'));
    this.logger.separator('-', 50);

    const services = serviceName
      ? { [serviceName]: this.context.config.services[serviceName] }
      : this.context.config.services;

    if (Object.keys(services).length === 0) {
      this.logger.info(this.i18n.t('cmd.status.no_services'));
      return;
    }

    Object.entries(services).forEach(([name, config]) => {
      if (!config) return;

      // Simulate service status
      const status = this.simulateServiceStatus(name);
      const statusIcon = this.getStatusIcon(status.state);
      const healthIcon = this.getHealthIcon(status.health);

      this.logger.info(`${statusIcon} ${name}`);
      this.logger.info(`   State: ${status.state} ${healthIcon} ${status.health}`);

      if (config.port && status.state === 'running') {
        const url = name === 'redis'
          ? `redis://localhost:${config.port}`
          : `http://localhost:${config.port}`;
        this.logger.info(`   URL: ${url}`);
      }

      if (options?.['detailed']) {
        this.logger.info(`   Description: ${config.description || 'No description'}`);
        this.logger.info(`   Uptime: ${status.uptime}`);
        if (status.memory) {
          this.logger.info(`   Memory: ${status.memory}`);
        }
        if (status.cpu) {
          this.logger.info(`   CPU: ${status.cpu}%`);
        }
      }

      this.logger.newLine();
    });

    if (options?.['json']) {
      const statusData = Object.fromEntries(
        Object.entries(services).map(([name]) => [
          name,
          this.simulateServiceStatus(name)
        ])
      );

      this.logger.info('JSON Output:');
      this.logger.info(JSON.stringify(statusData, null, 2));
    }
  }
  private simulateServiceStatus(serviceName: string) {
    // In a real implementation, this would get actual service status
    return {
      name: serviceName,
      state: 'running',
      health: 'healthy',
      uptime: '2h 15m',
      memory: '128MB',
      cpu: Math.floor(Math.random() * 30) + 5
    };
  }

  private getStatusIcon(state: string): string {
    const icons: Record<string, string> = {
      running: '✅',
      stopped: '⏹️',
      starting: '🔄',
      stopping: '⏸️',
      error: '❌',
      unknown: '❓'
    };
    return icons[state] || icons['unknown']!;
  }

  private getHealthIcon(health: string): string {
    const icons: Record<string, string> = {
      healthy: '💚',
      unhealthy: '❤️',
      starting: '💛',
      none: '⚪'
    };
    return icons[health] || icons['none']!;
  }
}
