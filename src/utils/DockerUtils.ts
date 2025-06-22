/**
 * Docker utility functions
 * Provides Docker-specific operations and checks
 */

import { execSync, spawn, ChildProcess } from 'child_process';
import { DockerComposeConfig, ServiceStatus, ProjectStatus, CommandResult } from '../types';
import { Logger } from './Logger';

export interface DockerInfo {
  version: string;
  serverVersion: string;
  isRunning: boolean;
  hasCompose: boolean;
  composeVersion?: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: string[];
  created: string;
  networks: string[];
}

export class DockerUtils {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }

  /**
   * Check if Docker is installed and running
   */
  async checkDockerStatus(): Promise<DockerInfo> {
    const dockerInfo: DockerInfo = {
      version: '',
      serverVersion: '',
      isRunning: false,
      hasCompose: false
    };

    try {
      // Check Docker client version
      const clientVersion = execSync('docker --version', {
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      dockerInfo.version = clientVersion;

      // Check if Docker daemon is running
      const serverInfo = execSync('docker info', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      dockerInfo.isRunning = true;
        // Extract server version from docker info
      const versionMatch = serverInfo.match(/Server Version:\s*(.+)/);
      if (versionMatch && versionMatch[1]) {
        dockerInfo.serverVersion = versionMatch[1].trim();
      }

    } catch (error) {
      this.logger.debug('Docker client or daemon not available', error);
    }

    try {
      // Check Docker Compose
      const composeVersion = execSync('docker compose version', {
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      dockerInfo.hasCompose = true;
      dockerInfo.composeVersion = composeVersion;
    } catch (error) {
      this.logger.debug('Docker Compose not available', error);
    }

    return dockerInfo;
  }

  /**
   * Execute Docker command
   */
  async executeDockerCommand(
    command: string,
    args: string[] = [],
    options: { silent?: boolean; timeout?: number; cwd?: string } = {}
  ): Promise<CommandResult> {
    const fullCommand = `docker ${command} ${args.join(' ')}`.trim();

    if (!options.silent) {
      this.logger.command(fullCommand);
    }

    return this.executeCommand(fullCommand, options);
  }

  /**
   * Execute Docker Compose command
   */
  async executeComposeCommand(
    command: string,
    args: string[] = [],
    options: { silent?: boolean; timeout?: number; cwd?: string; composeFile?: string } = {}
  ): Promise<CommandResult> {
    const composeCmd = options.composeFile
      ? `docker compose -f ${options.composeFile}`
      : 'docker compose';

    const fullCommand = `${composeCmd} ${command} ${args.join(' ')}`.trim();

    if (!options.silent) {
      this.logger.command(fullCommand);
    }

    return this.executeCommand(fullCommand, options);
  }

  /**
   * Generic command execution
   */
  private async executeCommand(
    command: string,
    options: { silent?: boolean; timeout?: number; cwd?: string } = {}
  ): Promise<CommandResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      try {
        const result = execSync(command, {
          encoding: 'utf8',
          stdio: options.silent ? 'pipe' : 'inherit',
          cwd: options.cwd || process.cwd(),
          timeout: options.timeout || 300000 // 5 minutes default
        });

        resolve({
          success: true,
          output: result,
          executionTime: Date.now() - startTime
        });
      } catch (error: any) {
        resolve({
          success: false,
          error: error.message,
          exitCode: error.status,
          executionTime: Date.now() - startTime
        });
      }
    });
  }

  /**
   * Get container information
   */
  async getContainers(projectName?: string): Promise<ContainerInfo[]> {
    try {
      const filter = projectName
        ? `--filter label=com.docker.compose.project=${projectName}`
        : '';

      const result = await this.executeDockerCommand('ps', [
        '--format', '"{{json .}}"',
        '--all',
        filter
      ], { silent: true });

      if (!result.success || !result.output) {
        return [];
      }

      const containers: ContainerInfo[] = [];
      const lines = result.output.trim().split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const cleanLine = line.replace(/^"|"$/g, '');
          const containerData = JSON.parse(cleanLine);

          containers.push({
            id: containerData.ID || '',
            name: containerData.Names || '',
            image: containerData.Image || '',
            state: containerData.State || '',
            status: containerData.Status || '',
            ports: containerData.Ports ? containerData.Ports.split(', ') : [],
            created: containerData.CreatedAt || '',
            networks: containerData.Networks ? containerData.Networks.split(', ') : []
          });
        } catch (parseError) {
          this.logger.debug('Error parsing container data', { line, error: parseError });
        }
      }

      return containers;
    } catch (error) {
      this.logger.error('Failed to get container information', error);
      return [];
    }
  }

  /**
   * Get service status from Docker Compose
   */
  async getServiceStatus(_projectName: string, serviceName?: string): Promise<ServiceStatus[]> {
    try {
      const args = ['ps', '--format', 'json'];
      if (serviceName) {
        args.push(serviceName);
      }

      const result = await this.executeComposeCommand('ps', args, { silent: true });

      if (!result.success || !result.output) {
        return [];
      }

      const services: ServiceStatus[] = [];
      const lines = result.output.trim().split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const serviceData = JSON.parse(line);

          services.push({
            name: serviceData.Service || serviceData.Name || '',
            state: this.normalizeState(serviceData.State || ''),
            health: this.normalizeHealth(serviceData.Health || ''),
            uptime: serviceData.Status || '',
            ports: serviceData.Publishers ?
              serviceData.Publishers.map((p: any) => `${p.PublishedPort}:${p.TargetPort}`) :
              [],
            image: serviceData.Image || '',
            containerId: serviceData.ID || ''
          });
        } catch (parseError) {
          this.logger.debug('Error parsing service data', { line, error: parseError });
        }
      }

      return services;
    } catch (error) {
      this.logger.error('Failed to get service status', error);
      return [];
    }
  }

  /**
   * Get project status
   */  async getProjectStatus(projectName: string): Promise<ProjectStatus> {
    const services = await this.getServiceStatus(projectName);
    // const containers = await this.getContainers(projectName); // Commented out for now

    const runningServices = services.filter(s => s.state === 'running').length;
    const healthyServices = services.filter(s => s.health === 'healthy').length;

    // Get networks and volumes
    const networks = await this.getProjectNetworks(projectName);
    const volumes = await this.getProjectVolumes(projectName);

    return {
      projectName,
      totalServices: services.length,
      runningServices,
      healthyServices,
      services,
      networks,
      volumes,
      lastUpdated: new Date()
    };
  }

  /**
   * Get project networks
   */
  private async getProjectNetworks(projectName: string): Promise<string[]> {
    try {
      const result = await this.executeDockerCommand('network', [
        'ls',
        '--filter', `label=com.docker.compose.project=${projectName}`,
        '--format', '{{.Name}}'
      ], { silent: true });

      if (result.success && result.output) {
        return result.output.trim().split('\n').filter(name => name.trim());
      }
    } catch (error) {
      this.logger.debug('Failed to get project networks', error);
    }
    return [];
  }

  /**
   * Get project volumes
   */
  private async getProjectVolumes(projectName: string): Promise<string[]> {
    try {
      const result = await this.executeDockerCommand('volume', [
        'ls',
        '--filter', `label=com.docker.compose.project=${projectName}`,
        '--format', '{{.Name}}'
      ], { silent: true });

      if (result.success && result.output) {
        return result.output.trim().split('\n').filter(name => name.trim());
      }
    } catch (error) {
      this.logger.debug('Failed to get project volumes', error);
    }
    return [];
  }

  /**
   * Normalize container state
   */
  private normalizeState(state: string): ServiceStatus['state'] {
    const normalizedState = state.toLowerCase();

    if (normalizedState.includes('running')) return 'running';
    if (normalizedState.includes('exited') || normalizedState.includes('stopped')) return 'stopped';
    if (normalizedState.includes('starting')) return 'starting';
    if (normalizedState.includes('stopping')) return 'stopping';
    if (normalizedState.includes('error') || normalizedState.includes('failed')) return 'error';

    return 'unknown';
  }

  /**
   * Normalize health status
   */
  private normalizeHealth(health: string): ServiceStatus['health'] {
    const normalizedHealth = health.toLowerCase();

    if (normalizedHealth.includes('healthy')) return 'healthy';
    if (normalizedHealth.includes('unhealthy')) return 'unhealthy';
    if (normalizedHealth.includes('starting')) return 'starting';

    return 'none';
  }

  /**
   * Get container logs
   */
  async getLogs(
    serviceName: string,
    options: {
      follow?: boolean;
      tail?: number;
      since?: string;
      until?: string;
      projectName?: string;
    } = {}
  ): Promise<ChildProcess | CommandResult> {
    const args = ['logs'];

    if (options.follow) args.push('-f');
    if (options.tail) args.push('--tail', options.tail.toString());
    if (options.since) args.push('--since', options.since);
    if (options.until) args.push('--until', options.until);

    args.push(serviceName);

    if (options.follow) {
      // For following logs, return the child process
      const child = spawn('docker', ['compose', ...args], {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      return child;
    } else {
      // For static logs, return the result
      return this.executeComposeCommand('logs', args, { silent: true });
    }
  }

  /**
   * Get container statistics
   */
  async getStats(serviceName?: string): Promise<any[]> {
    try {
      const args = ['stats', '--no-stream', '--format', 'json'];
      if (serviceName) {
        args.push(serviceName);
      }

      const result = await this.executeDockerCommand('stats', args, { silent: true });

      if (!result.success || !result.output) {
        return [];
      }

      const stats = [];
      const lines = result.output.trim().split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          stats.push(JSON.parse(line));
        } catch (parseError) {
          this.logger.debug('Error parsing stats data', { line, error: parseError });
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get container stats', error);
      return [];
    }
  }

  /**
   * Clean Docker system
   */
  async cleanSystem(options: { volumes?: boolean; images?: boolean; networks?: boolean } = {}): Promise<CommandResult> {
    const args = ['system', 'prune', '-f'];

    if (options.volumes) args.push('--volumes');
    if (options.images) args.push('-a');

    return this.executeDockerCommand('system', args);
  }

  /**
   * Pull images for services
   */
  async pullImages(serviceName?: string): Promise<CommandResult> {
    const args = ['pull'];
    if (serviceName) {
      args.push(serviceName);
    }

    return this.executeComposeCommand('pull', args);
  }

  /**
   * Build services
   */
  async buildServices(serviceName?: string, options: { noCache?: boolean; pull?: boolean } = {}): Promise<CommandResult> {
    const args = ['build'];

    if (options.noCache) args.push('--no-cache');
    if (options.pull) args.push('--pull');
    if (serviceName) args.push(serviceName);

    return this.executeComposeCommand('build', args);
  }

  /**
   * Scale services
   */
  async scaleService(serviceName: string, replicas: number): Promise<CommandResult> {
    return this.executeComposeCommand('up', ['-d', '--scale', `${serviceName}=${replicas}`, serviceName]);
  }

  /**
   * Execute command in service container
   */
  async execInService(
    serviceName: string,
    command: string[],
    options: { interactive?: boolean; tty?: boolean; user?: string } = {}
  ): Promise<CommandResult | ChildProcess> {
    const args = ['exec'];

    if (!options.interactive) args.push('-T');
    if (options.user) args.push('-u', options.user);

    args.push(serviceName, ...command);

    if (options.interactive && options.tty) {
      // For interactive sessions, return the child process
      const child = spawn('docker', ['compose', ...args], {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      return child;
    } else {
      // For non-interactive commands, return the result
      return this.executeComposeCommand('exec', args);
    }
  }

  /**
   * Get Docker Compose configuration
   */
  async getComposeConfig(): Promise<DockerComposeConfig | null> {
    try {
      const result = await this.executeComposeCommand('config', ['--format', 'json'], { silent: true });

      if (result.success && result.output) {
        return JSON.parse(result.output) as DockerComposeConfig;
      }
    } catch (error) {
      this.logger.error('Failed to get Docker Compose configuration', error);
    }

    return null;
  }

  /**
   * Validate Docker Compose file
   */
  async validateComposeFile(filePath?: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const args = ['config'];
      if (filePath) {
        args.unshift('-f', filePath);
      }

      const result = await this.executeComposeCommand('config', args, { silent: true });

      return {
        valid: result.success,
        errors: result.success ? [] : [result.error || 'Unknown validation error']
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    }
  }
}
