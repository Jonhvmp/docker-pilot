/**
 * Up Command - Start all services or specific service
 */

import { CommandResult, CommandOptions, CommandContext } from '../types';
import { BaseCommand } from './BaseCommand';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      // Show loading message
      if (serviceName) {
        this.logger.loading(`🚀 Starting service: ${serviceName}...`);
      } else {
        this.logger.loading('🚀 Starting all services...');
      }

      const { result: upOutput, executionTime } = await this.measureExecutionTime(async () => {
        return await this.startServices(serviceName, parsedOptions);
      });      // Display startup results
      this.showStartupResults(upOutput);

      // Show success message
      if (serviceName) {
        this.logger.success(`✅ Service "${serviceName}" started successfully`);
      } else {
        this.logger.success('✅ All services started successfully');
      }

      // Show service information
      if (parsedOptions['detach'] !== false) {
        this.showServiceInfo(serviceName);
      }

      const resultMessage = serviceName
        ? `service "${serviceName}"`
        : 'all services';

      return this.createSuccessResult(
        `Successfully started ${resultMessage}`,
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const target = serviceName || 'all services';
      this.logger.error(`Failed to start ${target}: ${errorMessage}`);
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
  }  /**
   * Start services using docker compose up
   */
  private async startServices(serviceName?: string, options?: Record<string, any>): Promise<string> {
    try {      // Build Docker command
      const composeFile = this.context.composeFile;
      const upArgs = ['docker', 'compose'];

      // Add compose file if available (always should be from context)
      if (composeFile) {
        upArgs.push('-f', composeFile);
      } else {
        this.logger.warn('UpCommand: No compose file in context, command may fail');
      }

      upArgs.push('up');

      // Add options
      if (options?.['detach'] !== false) {
        upArgs.push('--detach');
      }

      if (options?.['build'] || options?.['b']) {
        upArgs.push('--build');
      }

      if (options?.['force-recreate']) {
        upArgs.push('--force-recreate');
      }

      if (options?.['no-deps']) {
        upArgs.push('--no-deps');
      }

      if (options?.['remove-orphans']) {
        upArgs.push('--remove-orphans');
      }

      if (options?.['scale']) {
        upArgs.push('--scale', options['scale'] as string);
      }

      // Add specific service if provided
      if (serviceName) {
        upArgs.push(serviceName);
      }

      const command = upArgs.join(' ');
      this.logger.debug(`Executing: ${command}`);

      const result = await this.execDockerCommand(command);

      return result.stdout || 'Services started successfully';

    } catch (error) {
      this.logger.warn(`Failed to start services: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        maxBuffer: 1024 * 1024 * 5 // 5MB buffer
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
   * Display startup results with formatting
   */
  private showStartupResults(output: string): void {
    if (!output || output.trim() === '' || output === 'Services started successfully') {
      // No specific output to show, startup was clean
      return;
    }

    this.logger.newLine();
    this.logger.info('📋 Startup details:');
    this.logger.separator('-', 30);

    // Display the output
    const lines = output.split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
      if (line.includes('ERROR') || line.includes('error')) {
        this.logger.error(`  ${line}`);
      } else if (line.includes('WARN') || line.includes('warn')) {
        this.logger.warn(`  ${line}`);
      } else if (line.includes('Started') || line.includes('Created') || line.includes('Running')) {
        this.logger.success(`  ${line}`);
      } else {
        this.logger.info(`  ${line}`);
      }
    });

    this.logger.newLine();
  }
}
