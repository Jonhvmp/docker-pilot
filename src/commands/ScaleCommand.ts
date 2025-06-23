import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ScaleCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'scale',
      'Set number of containers to run for a service',
      'docker-pilot scale <service>=<replicas> [service2=replicas2...] [options]',
      context
    );
  }
  async execute(args: string[], _options: CommandOptions): Promise<CommandResult> {
    const { args: parsedArgs, options: parsedOptions } = this.parseOptions(args);

    try {
      const startTime = Date.now();

      if (parsedArgs.length === 0) {
        return this.createErrorResult(this.i18n.t('cmd.args_required', { type: 'service=replicas pair' }));
      }

      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      // Parse service=replicas pairs
      const scaleTargets: Array<{ service: string; replicas: number }> = [];

      for (const arg of parsedArgs) {
        const [service, replicasStr] = arg.split('=');

        if (!service || !replicasStr) {
          return this.createErrorResult(this.i18n.t('cmd.invalid_format', { format: arg }) + '. ' + this.i18n.t('cmd.scale.format_help'));
        }

        const replicas = parseInt(replicasStr, 10);
        if (isNaN(replicas) || replicas < 0) {
          return this.createErrorResult(this.i18n.t('cmd.scale.invalid_replicas', { replicas: replicasStr }));
        }

        scaleTargets.push({ service, replicas });
      }

      this.logger.loading(this.i18n.t('cmd.scaling'));

      // Build Docker command
      const scaleArgs = ['compose', 'up', '--detach', '--scale'];

      // Add scale targets
      for (const { service, replicas } of scaleTargets) {
        scaleArgs.push(`${service}=${replicas}`);
      }

      // Add no-recreate flag to avoid recreating existing containers
      if (!parsedOptions['recreate']) {
        scaleArgs.push('--no-recreate');
      }      // Add timeout if specified
      if (parsedOptions['timeout']) {
        scaleArgs.push('--timeout', parsedOptions['timeout'] as string);
      }

      const command = 'docker ' + scaleArgs.join(' ');
      this.logger.debug(`Executing: ${command}`);

      // Execute the real Docker command
      const result = await this.execDockerCommand(command);
        // Display scaling results
      this.showScalingResults(scaleTargets, result.stdout);

      const executionTime = Date.now() - startTime;

      // Show current status
      this.showScalingResults(scaleTargets);

      const plural = scaleTargets.length === 1 ? '' : 's';
      this.logger.success(this.i18n.t('cmd.scaled_success', { count: scaleTargets.length, plural }));

      return this.createSuccessResult(
        this.i18n.t('cmd.scaled_success', { count: scaleTargets.length, plural }),
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.scale.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);    }
  }

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

  private showScalingResults(scaleTargets: Array<{ service: string; replicas: number }>, output?: string): void {
    if (output && output.trim() !== '') {
      this.logger.newLine();
      this.logger.info('📋 Scaling details:');
      this.logger.separator('-', 30);

      // Display the output
      const lines = output.split('\n').filter(line => line.trim() !== '');
      lines.forEach(line => {
        if (line.includes('ERROR') || line.includes('error')) {
          this.logger.error(`  ${line}`);
        } else if (line.includes('WARN') || line.includes('warn')) {
          this.logger.warn(`  ${line}`);
        } else if (line.includes('Creating') || line.includes('Starting') || line.includes('Stopping')) {
          this.logger.success(`  ${line}`);
        } else {
          this.logger.info(`  ${line}`);
        }
      });

      this.logger.newLine();
    }

    this.logger.info('📊 Current scaling status:');

    for (const { service, replicas } of scaleTargets) {
      const status = replicas === 0 ? 'stopped' : 'running';
      const color = replicas === 0 ? '🔴' : '🟢';

      this.logger.info(`  ${color} ${service}: ${replicas} replica${replicas === 1 ? '' : 's'} (${status})`);
    }
  }

  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot scale web=3              # Scale web service to 3 replicas
  docker-pilot scale web=3 worker=2     # Scale multiple services
  docker-pilot scale web=0              # Stop all containers for web service
  docker-pilot scale web=1 --recreate   # Scale and recreate containers
  docker-pilot scale api=5 --timeout 30 # Scale with custom timeout

Scale Patterns:
  service=0     # Stop all containers for service
  service=1     # Run single instance (default)
  service=N     # Run N instances (horizontal scaling)
`);
  }
}
