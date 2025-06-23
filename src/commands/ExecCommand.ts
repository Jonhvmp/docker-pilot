import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ExecCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'exec',
      'Execute a command in a running container',
      'docker-pilot exec <service> <command> [options]',
      context
    );
  }async execute(args: string[], _options: CommandOptions): Promise<CommandResult> {
    const { args: parsedArgs, options: parsedOptions } = this.parseOptions(args);
    const serviceName = parsedArgs[0];
    const command = parsedArgs.slice(1).join(' ');

    try {
      if (!serviceName) {
        return this.createErrorResult('Service name is required');
      }

      if (!command) {
        return this.createErrorResult('Command is required');
      }

      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      this.logger.loading(`🔧 Executing command in ${serviceName}: ${command}`);

      const { result: execOutput, executionTime } = await this.measureExecutionTime(async () => {
        return await this.executeCommand(serviceName, command, parsedOptions);
      });

      // Display command output
      this.showCommandOutput(execOutput, serviceName, command);

      this.logger.success(`✅ Command executed successfully in ${serviceName}`);

      return this.createSuccessResult(
        `Command "${command}" executed in service "${serviceName}"`,
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to execute command: ${errorMessage}`);
      return this.createErrorResult(errorMessage);
    }
  }
  private async executeCommand(serviceName: string, command: string, options: any): Promise<string> {
    const execArgs = ['compose', 'exec'];

    // Add options flags
    if (options.detach) {
      execArgs.push('--detach');
    }
    if (options.user) {
      execArgs.push('--user', options.user);
    }
    if (options.workdir || options.w) {
      execArgs.push('--workdir', options.workdir || options.w);
    }
    if (options.env || options.e) {
      const envVars = Array.isArray(options.env || options.e)
        ? options.env || options.e
        : [options.env || options.e];
      envVars.forEach((env: string) => {
        execArgs.push('--env', env);
      });
    }

    // Interactive flags (default for shells)
    const isShell = ['bash', 'sh', 'zsh', 'fish'].some(shell => command.includes(shell));
    if (options.i !== false && (isShell || options.i)) {
      execArgs.push('-i');
    }
    if (options.t !== false && (isShell || options.t)) {
      execArgs.push('-t');
    }

    // Add service name
    execArgs.push(serviceName);

    // Add command (split by spaces for proper argument passing)
    execArgs.push(...command.split(' '));

    this.logger.info(`📝 Executing: ${command} in ${serviceName}`);    // Execute the real Docker command
    const result = await this.execDockerCommand('docker ' + execArgs.join(' '));

    if (result.stdout) {
      return result.stdout;
    } else if (result.stderr) {
      throw new Error(result.stderr);
    } else {
      return '';
    }
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

  private showCommandOutput(output: string, serviceName: string, command: string): void {
    if (!output.trim()) {
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📋 Output from "${command}" in service "${serviceName}"`);
    console.log('='.repeat(60));
    console.log(output);
    console.log('='.repeat(60) + '\n');
  }

  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot exec web bash            # Open bash shell in web container
  docker-pilot exec web ls -la          # List files in web container
  docker-pilot exec web npm install     # Run npm install in web container
  docker-pilot exec --user root web sh  # Run as root user
  docker-pilot exec -it web bash        # Interactive terminal
  docker-pilot exec --env DEBUG=1 web node app.js  # Set environment variable
  docker-pilot exec --workdir /tmp web pwd  # Set working directory
`);
  }
}
