/**
 * Status Command - Show status of services
 */

import { CommandResult, CommandOptions, CommandContext } from '../types';
import { BaseCommand } from './BaseCommand';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ServiceStatus {
  name: string;
  state: string;
  health: string;
  uptime?: string;
  ports?: string[];
  image?: string;
  created?: string;
}

export class StatusCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'status',
      'Show status of all services or a specific service',
      'docker-pilot status [service-name] [options]',
      context
    );
  }  async execute(args: string[], _options: CommandOptions): Promise<CommandResult> {
    const { args: parsedArgs, options: parsedOptions } = this.parseOptions(args);
    const serviceName = parsedArgs[0];

    try {
      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      this.logger.info(this.i18n.t('cmd.status.loading'));

      const { result: statusData, executionTime } = await this.measureExecutionTime(async () => {
        return await this.getServicesStatus(serviceName);
      });

      // Always show status output
      this.showServiceStatus(statusData, parsedOptions);

      // Return result with detailed output for interactive menu
      const outputSummary = this.createStatusSummary(statusData);

      return this.createSuccessResult(
        outputSummary,
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.status.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }  /**
   * Get real status of services using docker compose ps
   */
  private async getServicesStatus(serviceName?: string): Promise<ServiceStatus[]> {
    try {
      // Use compose file from context
      const composeFile = this.context.composeFile;
      
      const composeCmd = composeFile ? `docker compose -f "${composeFile}"` : 'docker compose';      const command = serviceName
        ? `${composeCmd} ps ${serviceName} --format json`
        : `${composeCmd} ps --format json`;

      const result = await this.execDockerCommand(command);

      if (!result.stdout.trim()) {
        return await this.getServicesStatusFallback(serviceName);
      }

      // Parse JSON output from docker compose ps
      const lines = result.stdout.trim().split('\n');
      const services: ServiceStatus[] = [];      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const serviceData = JSON.parse(line);

          services.push({
            name: serviceData.Service || serviceData.Name || 'unknown',
            state: this.normalizeState(serviceData.State || serviceData.Status || 'unknown'),
            health: this.getHealthFromStatus(serviceData.Health || serviceData.Status || ''),
            uptime: serviceData.RunningFor || '',
            ports: serviceData.Publishers ? serviceData.Publishers.map((p: any) => `${p.PublishedPort}:${p.TargetPort}`) : [],
            image: serviceData.Image || '',
            created: serviceData.CreatedAt || ''
          });
        } catch (parseError) {
          // Fallback to parsing plain text output
          services.push(this.parseServiceFromPlainText(line));
        }
      }

      return services;
    } catch (error) {
      // If JSON format fails, try with table format and parse manually
      return await this.getServicesStatusFallback(serviceName);
    }
  }  /**
   * Fallback method using table format
   */
  private async getServicesStatusFallback(serviceName?: string): Promise<ServiceStatus[]> {
    try {
      // Use compose file from context
      const composeFile = this.context.composeFile;
      
      const composeCmd = composeFile ? `docker compose -f "${composeFile}"` : 'docker compose';

      // Try docker compose ps first
      const composeCommand = serviceName
        ? `${composeCmd} ps ${serviceName}`        : `${composeCmd} ps`;

      let result = await this.execDockerCommand(composeCommand);

      if (!result.stdout.trim()) {
        // If docker compose ps doesn't work, try docker ps directly
        const dockerCommand = serviceName
          ? `docker ps --filter "name=${serviceName}" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}"`
          : 'docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}"';

        result = await this.execDockerCommand(dockerCommand);

        if (!result.stdout.trim()) {
          console.log('[DEBUG] No containers found via docker ps');
          return [];
        }

        return this.parseDockerPsOutput(result.stdout);
      }

      return this.parseTableOutput(result.stdout);
    } catch (error) {
      console.log(`[DEBUG] Failed to get services status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Parse table output from docker compose ps
   */
  private parseTableOutput(output: string): ServiceStatus[] {
    const lines = output.trim().split('\n');
    const services: ServiceStatus[] = [];

    // Skip header line(s)
    const dataLines = lines.filter(line =>
      !line.includes('NAME') &&
      !line.includes('SERVICE') &&
      line.trim() !== '' &&
      !line.startsWith('-')
    );    for (const line of dataLines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const name = parts[0] || 'unknown';
        const image = parts[1] || '';
        const created = parts[3] || '';
        const status = parts.slice(4).join(' ') || 'unknown';

        services.push({
          name: name.replace(/^.*_/, ''), // Remove project prefix
          state: this.normalizeState(status),
          health: this.getHealthFromStatus(status),
          image,
          created,
          uptime: this.extractUptime(status)
        });
      }
    }

    return services;
  }

  /**
   * Parse output from docker ps command
   */
  private parseDockerPsOutput(output: string): ServiceStatus[] {
    const lines = output.trim().split('\n');
    const services: ServiceStatus[] = [];

    // Skip header line
    const dataLines = lines.filter(line =>
      !line.includes('NAMES') &&
      !line.includes('IMAGE') &&
      line.trim() !== '' &&
      !line.startsWith('-')
    );

    for (const line of dataLines) {
      const parts = line.trim().split('\t');
      if (parts.length >= 3) {
        const name = parts[0] || 'unknown';
        const image = parts[1] || '';
        const status = parts[2] || 'unknown';
        const ports = parts[3] || '';
        const created = parts[4] || '';

        // Extract port mappings
        const portMappings: string[] = [];
        if (ports) {
          const portMatches = ports.match(/(\d+:\d+)/g);
          if (portMatches) {
            portMappings.push(...portMatches);
          }
        }

        services.push({
          name: name.replace(/^.*_/, ''), // Remove project prefix if any
          state: this.normalizeState(status),
          health: this.getHealthFromStatus(status),
          image,
          created,
          uptime: this.extractUptime(status),
          ports: portMappings
        });
      }
    }

    return services;
  }

  /**
   * Parse service info from plain text line
   */
  private parseServiceFromPlainText(line: string): ServiceStatus {
    const parts = line.trim().split(/\s+/);
    return {
      name: parts[0] || 'unknown',
      state: this.normalizeState(parts.slice(1).join(' ')),
      health: this.getHealthFromStatus(parts.slice(1).join(' '))
    };
  }

  /**
   * Normalize service state
   */
  private normalizeState(status: string): string {
    const lowerStatus = status.toLowerCase();

    if (lowerStatus.includes('up') || lowerStatus.includes('running')) return 'running';
    if (lowerStatus.includes('exit') || lowerStatus.includes('stopped')) return 'stopped';
    if (lowerStatus.includes('restarting')) return 'restarting';
    if (lowerStatus.includes('paused')) return 'paused';
    if (lowerStatus.includes('dead')) return 'dead';

    return 'unknown';
  }

  /**
   * Extract health status from docker status
   */
  private getHealthFromStatus(status: string): string {
    const lowerStatus = status.toLowerCase();

    if (lowerStatus.includes('healthy')) return 'healthy';
    if (lowerStatus.includes('unhealthy')) return 'unhealthy';
    if (lowerStatus.includes('starting')) return 'starting';

    return 'none';
  }
  /**
   * Extract uptime from status string
   */
  private extractUptime(status: string): string {
    const uptimeMatch = status.match(/Up\s+([^,\s]+(?:\s+[^,\s]+)*)/i);
    return uptimeMatch?.[1] || '';
  }

  /**
   * Execute Docker command with proper error handling
   */
  private async execDockerCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const result = await execAsync(command, { cwd: this.context.workingDirectory });
      return result;
    } catch (error: any) {
      // Some docker commands return non-zero exit codes but still have useful output
      if (error.stdout) {
        return { stdout: error.stdout, stderr: error.stderr || '' };
      }
      throw error;
    }
  }
  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot status                 # Show status of all services
  docker-pilot status backend        # Show status of backend service
  docker-pilot status --detailed     # Show detailed status information
  docker-pilot status --json         # Output status in JSON format

Status Options:
  --detailed      Show detailed information (ports, uptime, image)
  --json          Output status in JSON format
  --refresh=N     Auto-refresh every N seconds
`);
  }

  /**
   * Show service status with real data
   */
  private showServiceStatus(servicesData: ServiceStatus[], options?: Record<string, any>): void {
    this.logger.newLine();
    this.logger.info(this.i18n.t('cmd.status.title'));
    this.logger.separator('-', 50);

    if (servicesData.length === 0) {
      this.logger.info(this.i18n.t('cmd.status.no_services'));
      this.logger.info('\n💡 Tip: Make sure you have a docker-compose.yml file and services are defined.');
      return;
    }

    // Group services by state for better visualization
    const runningServices = servicesData.filter(s => s.state === 'running');
    const stoppedServices = servicesData.filter(s => s.state === 'stopped');
    const otherServices = servicesData.filter(s => s.state !== 'running' && s.state !== 'stopped');

    // Show summary
    const totalServices = servicesData.length;
    const runningCount = runningServices.length;
    const stoppedCount = stoppedServices.length;

    this.logger.info(`📊 Services Summary: ${totalServices} total, ${runningCount} running, ${stoppedCount} stopped`);
    this.logger.newLine();

    // Show running services first
    if (runningServices.length > 0) {
      this.logger.info('🟢 Running Services:');
      runningServices.forEach(service => this.displayService(service, options));
    }

    // Show stopped services
    if (stoppedServices.length > 0) {
      this.logger.info('🔴 Stopped Services:');
      stoppedServices.forEach(service => this.displayService(service, options));
    }

    // Show other states
    if (otherServices.length > 0) {
      this.logger.info('⚪ Other Services:');
      otherServices.forEach(service => this.displayService(service, options));
    }

    if (options?.['json']) {
      this.logger.info('\n📄 JSON Output:');
      this.logger.info(JSON.stringify(servicesData, null, 2));
    }

    // Show helpful tips
    if (stoppedCount > 0) {
      this.logger.info('\n💡 Tip: Use "docker-pilot start" to start stopped services.');
    }
  }

  /**
   * Create a text summary of the status for interactive menu display
   */
  private createStatusSummary(servicesData: ServiceStatus[]): string {
    if (servicesData.length === 0) {
      return '📭 No services found. Make sure you have a docker-compose.yml file with defined services.';
    }

    const runningCount = servicesData.filter(s => s.state === 'running').length;
    const stoppedCount = servicesData.filter(s => s.state === 'stopped').length;
    const totalCount = servicesData.length;

    let summary = `📊 Services Summary: ${totalCount} total, ${runningCount} running, ${stoppedCount} stopped\n\n`;

    // Group services by state
    const runningServices = servicesData.filter(s => s.state === 'running');
    const stoppedServices = servicesData.filter(s => s.state === 'stopped');
    const otherServices = servicesData.filter(s => s.state !== 'running' && s.state !== 'stopped');

    if (runningServices.length > 0) {
      summary += '🟢 Running Services:\n';
      runningServices.forEach(service => {
        summary += `  ✅ ${service.name} (${service.state})`;
        if (service.ports && service.ports.length > 0) {
          const mainPort = service.ports[0];
          if (mainPort) {
            const portNumber = mainPort.split(':')[0];
            const url = service.name.includes('redis') || service.name.includes('db') || service.name.includes('mysql') || service.name.includes('postgres')
              ? `${service.name}://localhost:${portNumber}`
              : `http://localhost:${portNumber}`;
            summary += ` - ${url}`;
          }
        }
        summary += '\n';
      });
      summary += '\n';
    }

    if (stoppedServices.length > 0) {
      summary += '🔴 Stopped Services:\n';
      stoppedServices.forEach(service => {
        summary += `  ⏹️ ${service.name} (${service.state})\n`;
      });
      summary += '\n';
    }

    if (otherServices.length > 0) {
      summary += '⚪ Other Services:\n';
      otherServices.forEach(service => {
        const icon = this.getStatusIcon(service.state);
        summary += `  ${icon} ${service.name} (${service.state})\n`;
      });
      summary += '\n';
    }

    if (stoppedCount > 0) {
      summary += '💡 Tip: Use "docker-pilot start" to start stopped services.\n';
    }

    return summary.trim();
  }

  /**
   * Display individual service information
   */
  private displayService(service: ServiceStatus, options?: Record<string, any>): void {
    const statusIcon = this.getStatusIcon(service.state);
    const healthIcon = this.getHealthIcon(service.health);

    this.logger.info(`  ${statusIcon} ${service.name}`);
    this.logger.info(`     State: ${service.state} ${healthIcon} ${service.health}`);

    if (options?.['detailed']) {
      if (service.image) {
        this.logger.info(`     Image: ${service.image}`);
      }
      if (service.uptime) {
        this.logger.info(`     Uptime: ${service.uptime}`);
      }
      if (service.ports && service.ports.length > 0) {
        this.logger.info(`     Ports: ${service.ports.join(', ')}`);
      }
      if (service.created) {
        this.logger.info(`     Created: ${service.created}`);
      }
    } else {
      // Show basic port info for running services
      if (service.state === 'running' && service.ports && service.ports.length > 0) {
        const mainPort = service.ports[0];
        if (mainPort) {
          const portNumber = mainPort.split(':')[0];
          const url = service.name.includes('redis') || service.name.includes('db') || service.name.includes('mysql') || service.name.includes('postgres')
            ? `${service.name}://localhost:${portNumber}`
            : `http://localhost:${portNumber}`;
          this.logger.info(`     URL: ${url}`);
        }
      }
    }

    this.logger.newLine();
  }

  private getStatusIcon(state: string): string {
    const icons: Record<string, string> = {
      running: '✅',
      stopped: '⏹️',
      restarting: '🔄',
      paused: '⏸️',
      dead: '💀',
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
