/**
 * Command Runner for Docker Pilot
 * Executes system commands with proper error handling and logging
 */

import { spawn, exec, execSync, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { CommandResult, CommandExecutionError } from '../types';
import { Logger } from '../utils/Logger';

const execAsync = promisify(exec);

export interface CommandRunnerOptions {
  timeout?: number;
  silent?: boolean;
  cwd?: string;
  env?: Record<string, string>;
  shell?: boolean;
}

export class CommandRunner {
  private logger: Logger;
  private defaultOptions: CommandRunnerOptions;

  constructor(logger?: Logger, defaultOptions: CommandRunnerOptions = {}) {
    this.logger = logger || new Logger();
    this.defaultOptions = {
      timeout: 300000, // 5 minutes
      silent: false,
      cwd: process.cwd(),
      env: process.env as Record<string, string>,
      shell: true,
      ...defaultOptions
    };
  }

  /**
   * Execute command synchronously
   */
  execSync(
    command: string,
    options: CommandRunnerOptions & { encoding?: BufferEncoding } = {}
  ): CommandResult {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...options };

    if (!mergedOptions.silent) {
      this.logger.command(command);
    }    try {
      const result = execSync(command, {
        encoding: options.encoding || 'utf8',
        stdio: mergedOptions.silent ? 'pipe' : 'inherit',
        cwd: mergedOptions.cwd,
        env: mergedOptions.env,
        timeout: mergedOptions.timeout
      });

      const executionTime = Date.now() - startTime;

      if (!mergedOptions.silent) {
        this.logger.success(`Command completed in ${executionTime}ms`);
      }

      return {
        success: true,
        output: result.toString(),
        executionTime
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      const result: CommandResult = {
        success: false,
        error: error.message || 'Unknown error',
        exitCode: error.status || error.code || 1,
        executionTime
      };

      if (!mergedOptions.silent) {
        this.logger.error(`Command failed after ${executionTime}ms: ${error.message}`);
      }

      return result;
    }
  }

  /**
   * Execute command asynchronously
   */
  async exec(
    command: string,
    options: CommandRunnerOptions = {}
  ): Promise<CommandResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...options };

    if (!mergedOptions.silent) {
      this.logger.command(command);
    }    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: mergedOptions.cwd,
        env: mergedOptions.env,
        timeout: mergedOptions.timeout
      });

      const executionTime = Date.now() - startTime;
      const output = stdout || stderr || '';

      if (!mergedOptions.silent && output) {
        console.log(output);
      }

      if (!mergedOptions.silent) {
        this.logger.success(`Command completed in ${executionTime}ms`);
      }

      return {
        success: true,
        output,
        executionTime
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      const result: CommandResult = {
        success: false,
        error: error.message || 'Unknown error',
        exitCode: error.code || 1,
        executionTime,
        output: error.stdout || ''
      };

      if (!mergedOptions.silent) {
        this.logger.error(`Command failed after ${executionTime}ms: ${error.message}`);
        if (error.stderr) {
          console.error(error.stderr);
        }
      }

      return result;
    }
  }

  /**
   * Spawn a process for interactive or long-running commands
   */
  spawn(
    command: string,
    args: string[] = [],
    options: CommandRunnerOptions & {
      interactive?: boolean;
      onOutput?: (data: string) => void;
      onError?: (data: string) => void;
      onClose?: (code: number | null, signal: string | null) => void;
    } = {}
  ): ChildProcess {
    const mergedOptions = { ...this.defaultOptions, ...options };

    if (!mergedOptions.silent) {
      this.logger.command(`${command} ${args.join(' ')}`);
    }

    const childProcess = spawn(command, args, {
      cwd: mergedOptions.cwd,
      env: mergedOptions.env,
      shell: mergedOptions.shell,
      stdio: options.interactive ? 'inherit' : 'pipe'
    });

    // Handle output if not interactive
    if (!options.interactive) {
      if (childProcess.stdout) {
        childProcess.stdout.on('data', (data) => {
          const output = data.toString();
          if (options.onOutput) {
            options.onOutput(output);
          } else if (!mergedOptions.silent) {
            process.stdout.write(output);
          }
        });
      }

      if (childProcess.stderr) {
        childProcess.stderr.on('data', (data) => {
          const error = data.toString();
          if (options.onError) {
            options.onError(error);
          } else if (!mergedOptions.silent) {
            process.stderr.write(error);
          }
        });
      }
    }

    // Handle process close
    childProcess.on('close', (code, signal) => {
      if (options.onClose) {
        options.onClose(code, signal);
      } else if (!mergedOptions.silent) {
        if (code === 0) {
          this.logger.success(`Process completed successfully`);
        } else {
          this.logger.error(`Process exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`);
        }
      }
    });

    // Handle process error
    childProcess.on('error', (error) => {
      if (!mergedOptions.silent) {
        this.logger.error(`Process error: ${error.message}`);
      }
    });

    return childProcess;
  }

  /**
   * Execute Docker command
   */
  async execDocker(
    subcommand: string,
    args: string[] = [],
    options: CommandRunnerOptions = {}
  ): Promise<CommandResult> {
    const command = `docker ${subcommand} ${args.join(' ')}`.trim();
    return this.exec(command, options);
  }

  /**
   * Execute Docker Compose command
   */
  async execDockerCompose(
    subcommand: string,
    args: string[] = [],
    options: CommandRunnerOptions & { composeFile?: string; projectName?: string } = {}
  ): Promise<CommandResult> {
    const composeArgs: string[] = [];

    if (options.composeFile) {
      composeArgs.push('-f', options.composeFile);
    }

    if (options.projectName) {
      composeArgs.push('-p', options.projectName);
    }

    composeArgs.push(subcommand, ...args);

    const command = `docker compose ${composeArgs.join(' ')}`.trim();
    return this.exec(command, options);
  }

  /**
   * Execute Docker Compose command synchronously
   */
  execDockerComposeSync(
    subcommand: string,
    args: string[] = [],
    options: CommandRunnerOptions & { composeFile?: string; projectName?: string } = {}
  ): CommandResult {
    const composeArgs: string[] = [];

    if (options.composeFile) {
      composeArgs.push('-f', options.composeFile);
    }

    if (options.projectName) {
      composeArgs.push('-p', options.projectName);
    }

    composeArgs.push(subcommand, ...args);

    const command = `docker compose ${composeArgs.join(' ')}`.trim();
    return this.execSync(command, options);
  }

  /**
   * Spawn Docker Compose command for interactive use
   */
  spawnDockerCompose(
    subcommand: string,
    args: string[] = [],
    options: CommandRunnerOptions & {
      composeFile?: string;
      projectName?: string;
      interactive?: boolean;
      onOutput?: (data: string) => void;
      onError?: (data: string) => void;
      onClose?: (code: number | null, signal: string | null) => void;
    } = {}
  ): ChildProcess {
    const composeArgs: string[] = [];

    if (options.composeFile) {
      composeArgs.push('-f', options.composeFile);
    }

    if (options.projectName) {
      composeArgs.push('-p', options.projectName);
    }

    composeArgs.push(subcommand, ...args);

    return this.spawn('docker', ['compose', ...composeArgs], options);
  }

  /**
   * Execute command with retry logic
   */
  async execWithRetry(
    command: string,
    options: CommandRunnerOptions & {
      maxRetries?: number;
      retryDelay?: number;
      retryCondition?: (result: CommandResult) => boolean;
    } = {}
  ): Promise<CommandResult> {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    const retryCondition = options.retryCondition || ((result) => !result.success);

    let lastResult: CommandResult;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      lastResult = await this.exec(command, { ...options, silent: options.silent || attempt > 1 });

      if (!retryCondition(lastResult)) {
        return lastResult;
      }

      if (attempt < maxRetries) {
        if (!options.silent) {
          this.logger.warn(`Command failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
        }
        await this.sleep(retryDelay);
      }
    }

    if (!options.silent) {
      this.logger.error(`Command failed after ${maxRetries} attempts`);
    }

    return lastResult!;
  }

  /**
   * Execute multiple commands in sequence
   */
  async execSequence(
    commands: string[],
    options: CommandRunnerOptions & { stopOnError?: boolean } = {}
  ): Promise<CommandResult[]> {
    const results: CommandResult[] = [];
    const stopOnError = options.stopOnError ?? true;

    for (const command of commands) {
      const result = await this.exec(command, options);
      results.push(result);

      if (!result.success && stopOnError) {
        if (!options.silent) {
          this.logger.error(`Sequence stopped due to command failure: ${command}`);
        }
        break;
      }
    }

    return results;
  }

  /**
   * Execute multiple commands in parallel
   */
  async execParallel(
    commands: string[],
    options: CommandRunnerOptions = {}
  ): Promise<CommandResult[]> {
    const promises = commands.map(command => this.exec(command, options));
    return Promise.all(promises);
  }

  /**
   * Check if command exists in system PATH
   */
  async commandExists(command: string): Promise<boolean> {
    try {
      const checkCommand = process.platform === 'win32'
        ? `where ${command}`
        : `which ${command}`;

      const result = await this.exec(checkCommand, { silent: true });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get command version
   */
  async getCommandVersion(command: string, versionFlag: string = '--version'): Promise<string | null> {
    try {
      const result = await this.exec(`${command} ${versionFlag}`, { silent: true });
      return result.success ? result.output?.trim() || null : null;
    } catch {
      return null;
    }
  }

  /**
   * Kill process by PID
   */
  async killProcess(pid: number, signal: string = 'SIGTERM'): Promise<boolean> {
    try {
      const killCommand = process.platform === 'win32'
        ? `taskkill /PID ${pid} /F`
        : `kill -${signal} ${pid}`;

      const result = await this.exec(killCommand, { silent: true });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Execute command with timeout
   */
  async execWithTimeout(
    command: string,
    timeoutMs: number,
    options: CommandRunnerOptions = {}
  ): Promise<CommandResult> {
    return this.exec(command, { ...options, timeout: timeoutMs });
  }

  /**
   * Execute command and return only success status
   */
  async execQuiet(command: string, options: CommandRunnerOptions = {}): Promise<boolean> {
    const result = await this.exec(command, { ...options, silent: true });
    return result.success;
  }

  /**
   * Execute command and throw error if it fails
   */
  async execOrThrow(
    command: string,
    options: CommandRunnerOptions = {}
  ): Promise<string> {
    const result = await this.exec(command, options);

    if (!result.success) {
      throw new CommandExecutionError(
        `Command failed: ${command}`,
        {
          command,
          exitCode: result.exitCode,
          error: result.error,
          output: result.output
        }
      );
    }

    return result.output || '';
  }

  /**
   * Set default options for all commands
   */
  setDefaultOptions(options: Partial<CommandRunnerOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Get current default options
   */
  getDefaultOptions(): CommandRunnerOptions {
    return { ...this.defaultOptions };
  }

  /**
   * Sleep utility for retry logic
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
