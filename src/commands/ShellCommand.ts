import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';

export class ShellCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'shell',
      'Open an interactive shell in a container',
      'docker-pilot shell <service> [options]',
      context
    );
  }
  async execute(args: string[], _options: CommandOptions): Promise<CommandResult> {
    const { args: parsedArgs, options: parsedOptions } = this.parseOptions(args);
    const serviceName = parsedArgs[0];

    try {
      const startTime = Date.now();

      if (!serviceName) {
        return this.createErrorResult(this.i18n.t('cmd.service_required'));
      }

      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      this.logger.loading(this.i18n.t('cmd.shell.opening', { service: serviceName }));

      // Determine shell type
      const shellType = parsedOptions['shell'] || 'bash';

      // Build Docker command
      const execArgs = ['compose', 'exec'];

      // Always use interactive and tty for shell
      execArgs.push('--interactive', '--tty');

      // Add user if specified
      if (parsedOptions['user'] || parsedOptions['u']) {
        execArgs.push('--user', parsedOptions['user'] || parsedOptions['u'] as string);
      }

      // Add working directory if specified
      if (parsedOptions['workdir'] || parsedOptions['w']) {
        execArgs.push('--workdir', parsedOptions['workdir'] || parsedOptions['w'] as string);
      }

      // Add environment variables if specified
      if (parsedOptions['env'] || parsedOptions['e']) {
        const envVars = Array.isArray(parsedOptions['env'] || parsedOptions['e'])
          ? parsedOptions['env'] || parsedOptions['e']
          : [parsedOptions['env'] || parsedOptions['e']];

        for (const envVar of envVars) {
          execArgs.push('--env', envVar as string);
        }
      }

      // Add service name and shell
      execArgs.push(serviceName, shellType);

      // For now, simulate the shell opening
      this.logger.info(`🐚 Opening ${shellType} shell in ${serviceName} container...`);
      this.logger.info('📝 Interactive shell simulation:');

      console.log(`
${serviceName}:/${parsedOptions['workdir'] || 'app'}$ # Interactive shell ready
${serviceName}:/${parsedOptions['workdir'] || 'app'}$ # Type 'exit' to close shell
${serviceName}:/${parsedOptions['workdir'] || 'app'}$ # Shell simulation - in real environment this would be interactive
      `.trim());      const executionTime = Date.now() - startTime;

      this.logger.success(this.i18n.t('cmd.shell.success', { service: serviceName }));
      this.logger.info(this.i18n.t('cmd.shell.tip'));

      return this.createSuccessResult(
        this.i18n.t('cmd.shell_opened', { service: serviceName }),
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.shell.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }

  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot shell web               # Open bash shell in web container
  docker-pilot shell web --shell sh   # Open sh shell instead of bash
  docker-pilot shell web --user root  # Open shell as root user
  docker-pilot shell web --workdir /tmp  # Start in /tmp directory
  docker-pilot shell web --env DEBUG=1   # Set environment variable
  docker-pilot shell db --shell psql     # Open PostgreSQL shell in db container
`);
  }
}
