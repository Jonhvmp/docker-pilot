#!/usr/bin/env node

/**
 * Docker Pilot CLI
 * Command-line interface for Docker Pilot library
 */

import { DockerPilot } from './core/DockerPilot';
import { DockerPilotConfig } from './types';
import {
  UpCommand,
  DownCommand,
  StatusCommand,
  BuildCommand,
  LogsCommand,
  ExecCommand,
  ShellCommand,
  ScaleCommand,
  ConfigCommand,
  RestartCommand,
  CleanCommand,
  PullCommand,
  ComposeCommand
} from './commands';
import { Logger } from './utils/Logger';
import { InteractiveMenu } from './interactive/InteractiveMenu';
import { I18n } from './utils/i18n';

interface CLIOptions {
  configPath?: string;
  workingDirectory?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  silent?: boolean;
  help?: boolean;
  version?: boolean;
}

class DockerPilotCLI {
  private dockerPilot: DockerPilot;
  private logger: Logger;
  private commands: Map<string, any> = new Map();
  private i18n: I18n;
    constructor() {
    this.logger = new Logger();
    this.i18n = new I18n();
    // Disable auto-loading to prevent duplicate initialization
    this.dockerPilot = new DockerPilot({ autoLoadConfig: false });
  }

  /**
   * Initialize CLI with language configuration
   */
  private initializeLanguage(): void {
    const config = this.dockerPilot.getConfig();
    if (config?.language) {
      this.i18n.setLanguage(config.language as any);
    }
  }/**
   * Initialize CLI
   */  async initialize(_options: CLIOptions = {}): Promise<void> {
    try {
      // Only show initialization messages in debug mode
      this.logger.debug(this.i18n.t('cli.initialization_debug'));

      // Try to initialize Docker Pilot, but don't fail if Docker is not running
      try {
        await this.dockerPilot.initialize();
        this.initializeLanguage(); // Set language after DockerPilot is initialized
      } catch (error) {
        // Log the error but continue - some commands can work without Docker
        const errorMessage = error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Docker initialization failed';
        this.logger.debug(this.i18n.t('cli.docker_init_failed') + ' ' + errorMessage);
      }

      // Register commands regardless of Docker status
      await this.registerCommands();

      this.logger.debug(this.i18n.t('cli.init_success'));
    } catch (error) {
      this.logger.error(this.i18n.t('cli.init_failed'), error);
      throw error;
    }
  }
  /**
   * Register available commands
   */
  private async registerCommands(): Promise<void> {
    let config = this.dockerPilot.getConfig();    // If no config is loaded, create a minimal default config
    if (!config) {
      config = {
        projectName: 'docker-project',
        dockerCompose: 'docker compose',
        configVersion: '1.0',
        services: {},
        plugins: [],
        cli: {
          version: '1.0.0',
          welcomeMessage: 'Welcome to Docker Pilot! 🐳',
          goodbyeMessage: 'Thank you for using Docker Pilot!',
          interactiveMode: true,
          colorOutput: true,
          verboseLogging: false,
          confirmDestructiveActions: true
        },
        backup: {
          enabled: false,
          directory: './backups',
          retention: 7,
          services: {},
          cloud: undefined
        },
        monitoring: {
          enabled: false,
          refreshInterval: 30,
          services: [],
          urls: {},
          alerts: {
            enabled: false,
            thresholds: {
              cpu: 80,
              memory: 80,
              disk: 90
            }
          }
        },
        development: {
          hotReload: true,
          debugMode: false,
          logLevel: 'info',
          autoMigrate: false,
          seedData: false,
          testMode: false,
          watchFiles: [],
          environment: 'development'        },
        networks: {},
        volumes: {},
        language: 'en' as const
      };
    }    // Ensure config is never null for command context
    const context = {
      config: config as DockerPilotConfig, // Type assertion since we guaranteed it's not null above
      logger: this.logger,
      workingDirectory: this.dockerPilot.getWorkingDirectory()
    };    // Register core commands
    this.commands.set('up', new UpCommand(context));
    this.commands.set('down', new DownCommand(context));
    this.commands.set('status', new StatusCommand(context));
    this.commands.set('build', new BuildCommand(context));
    this.commands.set('logs', new LogsCommand(context));
    this.commands.set('exec', new ExecCommand(context));
    this.commands.set('shell', new ShellCommand(context));
    this.commands.set('scale', new ScaleCommand(context));
    this.commands.set('config', new ConfigCommand(context));
    this.commands.set('restart', new RestartCommand(context));
    this.commands.set('clean', new CleanCommand(context));
    this.commands.set('pull', new PullCommand(context));
    this.commands.set('compose', new ComposeCommand(context));

    // Add aliases
    this.commands.set('start', this.commands.get('up'));
    this.commands.set('stop', this.commands.get('down'));
    this.commands.set('ps', this.commands.get('status'));
    this.commands.set('sh', this.commands.get('shell'));
    this.commands.set('bash', this.commands.get('shell'));
    this.commands.set('log', this.commands.get('logs'));
    this.commands.set('cleanup', this.commands.get('clean'));

    this.logger.debug(this.i18n.t('cli.commands_registered', { count: this.commands.size.toString() }));
  }

  /**
   * Parse CLI arguments
   */
  private parseArgs(args: string[]): { command: string; commandArgs: string[]; options: CLIOptions } {
    const options: CLIOptions = {};
    const commandArgs: string[] = [];
    let command = '';    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (!arg) continue;

      if (arg === '--help' || arg === '-h') {
        options.help = true;
      } else if (arg === '--version' || arg === '-v') {
        options.version = true;      } else if (arg === '--config' && args[i + 1]) {
        const nextArg = args[++i];
        if (nextArg) options.configPath = nextArg;
      } else if (arg === '--cwd' && args[i + 1]) {
        const nextArg = args[++i];
        if (nextArg) options.workingDirectory = nextArg;
      } else if (arg === '--log-level' && args[i + 1]) {
        options.logLevel = args[++i] as any;      } else if (arg === '--silent') {
        options.silent = true;
      } else if (arg === '--interactive' || arg === '-i') {
        command = 'interactive';
      } else if (!command && !arg.startsWith('-')) {
        command = arg;
      } else if (command) {
        commandArgs.push(arg);
      }
    }

    return { command, commandArgs, options };
  }
  /**
   * Show CLI help
   */
  private showHelp(): void {
    const config = this.dockerPilot.getConfig();
    const projectName = config?.projectName || 'Docker Project';

    console.log(`
${this.i18n.t('cli.help.title', { projectName, version: '1.0.0' })}

${this.i18n.t('cli.help.usage')}
${this.i18n.t('cli.help.usage_main')}
${this.i18n.t('cli.help.usage_interactive')}
${this.i18n.t('cli.help.usage_interactive_flag')}

${this.i18n.t('cli.help.commands')}
${this.i18n.t('cli.help.cmd_up')}
${this.i18n.t('cli.help.cmd_down')}
${this.i18n.t('cli.help.cmd_status')}
${this.i18n.t('cli.help.cmd_build')}
${this.i18n.t('cli.help.cmd_logs')}
${this.i18n.t('cli.help.cmd_exec')}
${this.i18n.t('cli.help.cmd_shell')}
${this.i18n.t('cli.help.cmd_scale')}
${this.i18n.t('cli.help.cmd_restart')}
${this.i18n.t('cli.help.cmd_pull')}
${this.i18n.t('cli.help.cmd_clean')}
${this.i18n.t('cli.help.cmd_config')}

${this.i18n.t('cli.help.options')}
${this.i18n.t('cli.help.opt_help')}
${this.i18n.t('cli.help.opt_version')}
${this.i18n.t('cli.help.opt_interactive')}
${this.i18n.t('cli.help.opt_config')}
${this.i18n.t('cli.help.opt_cwd')}
${this.i18n.t('cli.help.opt_log_level')}
${this.i18n.t('cli.help.opt_silent')}

${this.i18n.t('cli.help.examples')}
${this.i18n.t('cli.help.example_interactive')}
${this.i18n.t('cli.help.example_interactive_flag')}
${this.i18n.t('cli.help.example_up')}
${this.i18n.t('cli.help.example_up_service')}
${this.i18n.t('cli.help.example_down')}
${this.i18n.t('cli.help.example_status')}
${this.i18n.t('cli.help.example_build')}
${this.i18n.t('cli.help.example_logs')}
${this.i18n.t('cli.help.example_exec')}
${this.i18n.t('cli.help.example_shell')}
${this.i18n.t('cli.help.example_scale')}
${this.i18n.t('cli.help.example_restart')}
${this.i18n.t('cli.help.example_pull')}
${this.i18n.t('cli.help.example_clean')}
${this.i18n.t('cli.help.example_config')}

${this.i18n.t('cli.help.more_info')}
${this.i18n.t('cli.help.more_info_cmd')}
`);
  }
  /**
   * Show version information
   */
  private showVersion(): void {
    const config = this.dockerPilot.getConfig();
    const projectName = config?.projectName || 'Docker Project';

    console.log(this.i18n.t('cli.version.title', { projectName, version: '1.0.0' }));
    console.log(this.i18n.t('cli.version.library', { version: '1.0.0' }));
    console.log(this.i18n.t('cli.version.node', { version: process.version }));
  }/**
   * Execute CLI command
   */
  async execute(args: string[] = process.argv.slice(2)): Promise<void> {
    try {
      const { command, commandArgs, options } = this.parseArgs(args);

      // Handle global options that don't require initialization
      if (options.help && !command) {
        this.showHelp();
        return;
      }

      if (options.version) {
        this.showVersion();
        return;
      }      // Handle no command case - start interactive menu
      if (!command || command === 'interactive') {
        await this.smartInitialize(options);
        await this.startInteractiveMenu();
        return;
      }

      // Initialize only when we have a command to execute
      await this.smartInitialize(options);      // Get command instance
      const commandInstance = this.commands.get(command);
      if (!commandInstance) {
        this.logger.error(this.i18n.t('cli.unknown_command', { command }));
        this.logger.info(this.i18n.t('cli.use_help'));
        process.exit(1);
      }

      // Show command help if requested
      if (options.help) {
        commandInstance.showHelp();
        return;
      }

      // Execute command
      const result = await commandInstance.execute(commandArgs, options);      if (!result.success) {
        this.logger.error(this.i18n.t('cli.command_failed', { error: result.error || 'Unknown error' }));
        process.exit(result.exitCode || 1);
      }

      if (result.executionTime) {
        this.logger.debug(this.i18n.t('cli.command_completed', { time: result.executionTime.toString() }));
      }

    } catch (error) {
      this.logger.error(this.i18n.t('cli.execution_failed'), error);
      process.exit(1);
    }
  }

  /**
   * Start interactive menu
   */  async startInteractiveMenu(): Promise<void> {
    try {
      // Don't re-initialize if already done
      if (!this.dockerPilot.isInitialized()) {
        await this.smartInitialize();
      }      const menu = new InteractiveMenu(this.dockerPilot);
      await menu.start();
    } catch (error) {
      this.logger.error(this.i18n.t('cli.menu_start_error'), error);
      process.exit(1);
    }
  }

  /**
   * Cleanup CLI resources
   */
  async cleanup(): Promise<void> {
    await this.dockerPilot.cleanup();
  }

  /**
   * Smart initialization - auto-detect if no config exists
   */
  private async smartInitialize(options: CLIOptions = {}): Promise<void> {
    try {
      // Try normal initialization first
      await this.initialize(options);    } catch (error) {
      // If config doesn't exist, create a basic one and try again
      this.logger.info(this.i18n.t('cli.creating_auto_config'));
      await this.createDefaultConfig();
      await this.initialize(options);
    }
  }

  /**
   * Create default configuration if none exists
   */
  private async createDefaultConfig(): Promise<void> {
    const fs = require('fs');
    const path = require('path');

    const defaultConfig = {
      projectName: path.basename(process.cwd()),
      dockerCompose: "docker compose",
      services: {
        app: {
          port: 3000,
          description: "Main application"
        }
      }
    };
      const configPath = path.join(process.cwd(), 'docker-pilot.config.json');
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));

    this.logger.success(this.i18n.t('cli.config_created', { path: configPath }));
  }
}

// Export for programmatic use
export { DockerPilotCLI };

// Run CLI if executed directly
if (require.main === module) {
  const cli = new DockerPilotCLI();
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n' + (new I18n()).t('settings.graceful_shutdown'));
    await cli.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await cli.cleanup();
    process.exit(0);
  });

  // Execute CLI
  cli.execute().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
