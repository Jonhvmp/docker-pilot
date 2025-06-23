import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PullCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'pull',
      'Pull service images from registry',
      'docker-pilot pull [service-name] [options]',
      context
    );
  }

  async execute(args: string[], _options: CommandOptions): Promise<CommandResult> {    const { args: parsedArgs, options: parsedOptions } = this.parseOptions(args);
    const serviceName = parsedArgs[0];

    try {
      const startTime = Date.now();

      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      // Show loading message
      if (serviceName) {
        this.logger.loading(this.i18n.t('cmd.pull.loading', { service: serviceName }));
      } else {
        this.logger.loading(this.i18n.t('cmd.pull.loading_all'));
      }

      // Build Docker command
      const pullArgs = ['compose', 'pull'];

      // Add options
      if (parsedOptions['quiet'] || parsedOptions['q']) {
        pullArgs.push('--quiet');
      }

      if (parsedOptions['parallel']) {
        pullArgs.push('--parallel');
        this.logger.info(this.i18n.t('cmd.pull.parallel'));
      }

      if (parsedOptions['ignore-pull-failures']) {
        pullArgs.push('--ignore-pull-failures');
      }

      if (parsedOptions['include-deps']) {
        pullArgs.push('--include-deps');
      }      // Add specific service if provided
      if (serviceName) {
        pullArgs.push(serviceName);
      }      const command = 'docker ' + pullArgs.join(' ');
      this.logger.debug(`Executing: ${command}`);

      // Execute the real Docker command
      const result = await this.execDockerCommand(command);
        // Display pull results
      this.showPullResults(result.stdout);

      const executionTime = Date.now() - startTime;

      // Show success message
      if (serviceName) {
        this.logger.success(this.i18n.t('cmd.pull.success', { service: serviceName }));
      } else {
        this.logger.success(this.i18n.t('cmd.pull.success_all'));
      }

      const resultMessage = serviceName
        ? this.i18n.t('cmd.build.service_text', { service: serviceName })
        : this.i18n.t('cmd.build.all_services');

      return this.createSuccessResult(
        this.i18n.t('cmd.pulled_success', { target: resultMessage }),
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.pull.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);    }
  }

  private async execDockerCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const result = await execAsync(command, {
        cwd: this.context.workingDirectory,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for pull output
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

  private showPullResults(output: string): void {
    if (!output || output.trim() === '') {
      return;
    }

    this.logger.newLine();
    this.logger.info('📦 Pull details:');
    this.logger.separator('-', 40);

    // Display the output with formatting
    const lines = output.split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
      if (line.includes('ERROR') || line.includes('error')) {
        this.logger.error(`  ${line}`);
      } else if (line.includes('WARN') || line.includes('warn')) {
        this.logger.warn(`  ${line}`);
      } else if (line.includes('Pulling') || line.includes('Downloaded') || line.includes('Status')) {
        this.logger.success(`  ${line}`);
      } else {
        this.logger.info(`  ${line}`);
      }
    });
      this.logger.newLine();
  }

  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot pull                    # Pull all service images
  docker-pilot pull web                # Pull specific service image
  docker-pilot pull --quiet            # Pull without verbose output
  docker-pilot pull --parallel         # Pull images in parallel
  docker-pilot pull --ignore-pull-failures  # Continue on pull failures
  docker-pilot pull --include-deps     # Pull dependency images too

Pull Options:
  --quiet, -q               Suppress output
  --parallel                Pull images in parallel
  --ignore-pull-failures    Continue if some images fail to pull
  --include-deps            Also pull images of dependencies
`);
  }
}
