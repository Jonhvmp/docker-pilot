import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';
import { spawn } from 'child_process';

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
      if (!serviceName) {
        // If no service provided, show available services and let user choose
        const availableServices = this.getAvailableServices();

        if (availableServices.length === 0) {
          return this.createErrorResult(this.i18n.t('cmd.no_services_configured'));
        }

        this.logger.info(this.i18n.t('cmd.available_services'));
        availableServices.forEach((service, index) => {
          this.logger.info(`${index + 1}. ${service}`);
        });

        // For now, just use the first service as default
        const defaultService = availableServices[0];
        this.logger.info(`Using default service: ${defaultService}`);
        return await this.executeShell(defaultService!, parsedOptions);
      }

      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      if (!this.validateService(serviceName)) {
        return this.createErrorResult(this.i18n.t('error.service_not_found', { service: serviceName }));
      }

      return await this.executeShell(serviceName, parsedOptions);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.shell.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }

  /**
   * Execute the shell command for a specific service
   */
  private async executeShell(serviceName: string, options: Record<string, any>): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      this.logger.info(`🐚 ${this.i18n.t('cmd.shell.opening', { service: serviceName })}...`);
      this.logger.info(this.i18n.t('cmd.shell.tip'));      // Determine shell type - detect available shell if not specified
      let shellType = options['shell'];

      if (!shellType) {
        this.logger.info('🔍 Detecting available shell...');
        shellType = await this.detectAvailableShell(serviceName);
        this.logger.info(`✅ Using shell: ${shellType}`);
      }      // Build Docker command
      const composeFile = this.context.composeFile;
      const execArgs = ['compose'];

      // Add compose file if available (always should be from context)
      if (composeFile) {
        execArgs.push('-f', composeFile);
      } else {
        this.logger.warn('ShellCommand: No compose file in context, command may fail');
      }

      execArgs.push('exec');

      // Add user if specified
      if (options['user'] || options['u']) {
        execArgs.push('--user', options['user'] || options['u']);
      }

      // Add working directory if specified
      if (options['workdir'] || options['w']) {
        execArgs.push('--workdir', options['workdir'] || options['w']);
      }

      // Add environment variables if specified
      if (options['env'] || options['e']) {
        const envVars = Array.isArray(options['env'] || options['e'])
          ? options['env'] || options['e']
          : [options['env'] || options['e']];

        for (const envVar of envVars) {
          execArgs.push('--env', envVar);
        }
      }

      // Add service name and shell
      execArgs.push(serviceName, shellType);

      this.logger.info(`\n� Executing command in ${serviceName}: ${shellType}`);
      this.logger.info('');

      // Execute the shell command
      const result = await this.executeInteractiveShell('docker', execArgs);

      const executionTime = Date.now() - startTime;

      if (result.success) {
        this.logger.success(this.i18n.t('cmd.shell.success', { service: serviceName }));
        return this.createSuccessResult(
          this.i18n.t('cmd.shell_opened', { service: serviceName }),
          executionTime
        );
      } else {
        return this.createErrorResult(result.error || 'Shell execution failed', 1, executionTime);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.shell.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }

  /**
   * Detect available shell in the container
   */
  private async detectAvailableShell(serviceName: string): Promise<string> {
    const shellsToTry = ['/bin/bash', '/bin/sh', '/bin/zsh', '/bin/ash'];

    for (const shell of shellsToTry) {
      try {
        // Test if shell exists using 'which' or 'test' command
        const testArgs = ['compose', 'exec', '-T', serviceName, 'test', '-f', shell];
        const testResult = await this.executeCommand('docker', testArgs, { silent: true });

        if (testResult.success) {
          return shell;
        }
      } catch (error) {
        // Continue to next shell
        continue;
      }
    }

    // Fallback to /bin/sh if nothing else works
    this.logger.warn('⚠️ No standard shell detected, falling back to /bin/sh');
    return '/bin/sh';
  }

  /**
   * Execute a command silently for testing
   */
  private async executeCommand(command: string, args: string[], options: { silent?: boolean } = {}): Promise<{ success: boolean; stdout?: string; stderr?: string }> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: options.silent ? ['pipe', 'pipe', 'pipe'] : 'inherit',
        cwd: this.context.workingDirectory,
        shell: true
      });

      let stdout = '';
      let stderr = '';

      if (options.silent) {
        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr
        });
      });

      child.on('error', () => {
        resolve({
          success: false,
          stdout,
          stderr
        });
      });
    });
  }

  /**
   * Execute interactive shell command
   */
  private async executeInteractiveShell(command: string, args: string[]): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        cwd: this.context.workingDirectory,
        shell: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            error: `Shell exited with code ${code}`
          });
        }
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to start shell: ${error.message}`
        });
      });
    });
  }

  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot shell                   # Show available services and open shell
  docker-pilot shell web               # Open bash shell in web container
  docker-pilot shell web --shell sh   # Open sh shell instead of bash
  docker-pilot shell web --shell /bin/sh # Specify full path to shell
  docker-pilot shell web --user root  # Open shell as root user
  docker-pilot shell web --workdir /tmp  # Start in /tmp directory
  docker-pilot shell web --env DEBUG=1   # Set environment variable
  docker-pilot shell db --shell psql     # Open PostgreSQL shell in db container

Shell Options:
  --shell <shell>         Shell to use (default: /bin/bash)
  --user <user>          User to run shell as
  --workdir <path>       Working directory
  --env <key=value>      Environment variables
`);
  }
}
