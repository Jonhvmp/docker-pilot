import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const existsAsync = promisify(fs.exists);

export class ConfigCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'config',
      'View and manage Docker Pilot configuration',
      'docker-pilot config <action> [options]',
      context
    );
  }
  async execute(args: string[], _options: CommandOptions): Promise<CommandResult> {
    const { args: parsedArgs, options: parsedOptions } = this.parseOptions(args);
    const action = parsedArgs[0];

    try {
      switch (action) {
        case 'show':
        case 'view':
          return await this.showConfig(parsedOptions);

        case 'validate':
        case 'check':
          return await this.validateConfig(parsedOptions);

        case 'init':
        case 'create':
          return await this.initConfig(parsedOptions);

        case 'path':
          return await this.showConfigPath(parsedOptions);

        case 'edit':
          return await this.editConfig(parsedOptions);

        default:
          return this.createErrorResult(
            this.i18n.t('error.generic', {
              message: `Unknown action: ${action}. Available actions: show, validate, init, path, edit`
            })
          );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.config.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }

  private async showConfig(options: Record<string, any>): Promise<CommandResult> {
    this.logger.info(this.i18n.t('cmd.config.title'));

    const config = this.context.config;

    if (options['json']) {
      console.log(JSON.stringify(config, null, 2));
    } else {
      this.displayConfigSummary(config);
    }

    return this.createSuccessResult('Configuration displayed');
  }

  private async validateConfig(_options: Record<string, any>): Promise<CommandResult> {
    this.logger.loading('🔍 Validating configuration...');

    const config = this.context.config;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!config.projectName || config.projectName.trim() === '') {
      errors.push('Project name is required');
    }

    if (!config.services || Object.keys(config.services).length === 0) {
      warnings.push('No services defined');
    }

    // Validate services
    for (const [serviceName, serviceConfig] of Object.entries(config.services || {})) {
      if (serviceConfig.port && (serviceConfig.port < 1 || serviceConfig.port > 65535)) {
        errors.push(`Service '${serviceName}': Invalid port ${serviceConfig.port}`);
      }

      if (serviceConfig.scale && serviceConfig.scale < 1) {
        errors.push(`Service '${serviceName}': Scale must be at least 1`);
      }
    }

    // Display results
    if (errors.length > 0) {
      this.logger.error('❌ Configuration validation failed:');
      errors.forEach(error => this.logger.error(`  • ${error}`));
    }

    if (warnings.length > 0) {
      this.logger.warn('⚠️  Configuration warnings:');
      warnings.forEach(warning => this.logger.warn(`  • ${warning}`));
    }

    if (errors.length === 0) {
      this.logger.success('✅ Configuration is valid');

      if (warnings.length === 0) {
        this.logger.info('🎉 No warnings found');
      }
    }

    return errors.length > 0
      ? this.createErrorResult(`Configuration validation failed with ${errors.length} error(s)`)
      : this.createSuccessResult('Configuration is valid');
  }
  private async initConfig(options: Record<string, any>): Promise<CommandResult> {
    const configPath = path.join(this.context.workingDirectory, 'docker-pilot.config.json');

    // Check if config already exists
    if (await existsAsync(configPath)) {
      const forceCreate = options['force'] || options['f'];
      if (!forceCreate) {
        return this.createErrorResult(
          `Configuration file already exists at ${configPath}. Use --force to overwrite.`
        );
      }
      this.logger.warn('⚠️  Overwriting existing configuration file');
    }

    this.logger.loading('📝 Creating new configuration file...');

    const projectName = options['name'] || path.basename(this.context.workingDirectory);

    const newConfig = {
      projectName,
      dockerCompose: 'docker compose',
      configVersion: '1.0',
      language: 'en',
      services: {},
      plugins: [],
      cli: {
        version: '1.0.0',
        welcomeMessage: `Welcome to ${projectName} Docker Pilot! 🐳`,
        goodbyeMessage: `Thank you for using ${projectName} Docker Pilot!`,
        interactiveMode: true,
        colorOutput: true,
        verboseLogging: false,
        confirmDestructiveActions: true
      },
      backup: {
        enabled: false,
        schedule: '0 2 * * *',
        retention: 7,
        compression: true,
        location: './backups'
      },
      monitoring: {
        enabled: false,
        interval: 30,
        healthChecks: true,
        notifications: false
      },
      development: {
        hotReload: true,
        debugMode: false,
        logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',
        autoMigrate: false,
        seedData: false,
        testMode: false,
        watchFiles: [],
        environment: 'development'
      },
      networks: {},
      volumes: {}
    };

    try {
      // Actually write the configuration file
      await writeFileAsync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');

      this.logger.success(`✅ Configuration file created at: ${configPath}`);

      if (!options['quiet']) {
        this.logger.info('🔧 Configuration structure:');
        this.displayConfigSummary(newConfig);
      }

      this.logger.info('💡 Edit the configuration file to customize your setup');
      this.logger.info('� Run "docker-pilot config validate" to check your configuration');

      return this.createSuccessResult('Configuration file created successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create configuration file: ${errorMessage}`);
      return this.createErrorResult(`Failed to create configuration file: ${errorMessage}`);
    }
  }
  private async showConfigPath(_options: Record<string, any>): Promise<CommandResult> {
    const configPath = path.join(this.context.workingDirectory, 'docker-pilot.config.json');
    const configExists = await existsAsync(configPath);

    this.logger.info('📍 Configuration file location:');
    console.log(configPath);

    if (configExists) {
      this.logger.success('✅ Configuration file exists');

      try {
        const stats = fs.statSync(configPath);
        this.logger.info(`📏 File size: ${this.formatFileSize(stats.size)}`);
        this.logger.info(`📅 Last modified: ${stats.mtime.toLocaleString()}`);
      } catch (error) {
        this.logger.debug('Could not read file stats');
      }
    } else {
      this.logger.warn('⚠️  Configuration file does not exist');
      this.logger.info('💡 Run "docker-pilot config init" to create one');
    }

    return this.createSuccessResult('Configuration path displayed');
  }

  private async editConfig(_options: Record<string, any>): Promise<CommandResult> {
    const configPath = path.join(this.context.workingDirectory, 'docker-pilot.config.json');
    const configExists = await existsAsync(configPath);

    if (!configExists) {
      this.logger.error('❌ Configuration file does not exist');
      this.logger.info('💡 Run "docker-pilot config init" to create one');
      return this.createErrorResult('Configuration file not found');
    }

    this.logger.info('✏️  Edit configuration:');
    this.logger.info(`📁 File: ${configPath}`);
    this.logger.info('💡 Use your preferred editor to modify the configuration');
    this.logger.info('🔄 Run "docker-pilot config validate" after making changes');

    // Show some helpful editing tips
    this.logger.newLine();
    this.logger.info('📝 Editing tips:');
    this.logger.info('  • Use a JSON-aware editor for syntax highlighting');
    this.logger.info('  • Backup the file before making major changes');
    this.logger.info('  • Validate JSON syntax with your editor');
    this.logger.info('  • Check the documentation for available options');

    return this.createSuccessResult('Configuration edit information displayed');
  }

  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private displayConfigSummary(config: any): void {
    console.log(`
📋 Project: ${config.projectName}
🐳 Docker Compose: ${config.dockerCompose}
📋 Version: ${config.configVersion}

🔧 Services: ${Object.keys(config.services || {}).length}
${Object.keys(config.services || {}).map(name => `  • ${name}`).join('\n')}

🔌 Plugins: ${config.plugins?.length || 0}
${config.plugins?.map((plugin: string) => `  • ${plugin}`).join('\n') || '  (none)'}

🌐 Networks: ${Object.keys(config.networks || {}).length}
💾 Volumes: ${Object.keys(config.volumes || {}).length}

⚙️  CLI Configuration:
  • Interactive Mode: ${config.cli?.interactiveMode ? 'enabled' : 'disabled'}
  • Color Output: ${config.cli?.colorOutput ? 'enabled' : 'disabled'}
  • Verbose Logging: ${config.cli?.verboseLogging ? 'enabled' : 'disabled'}

🔄 Development Mode:
  • Hot Reload: ${config.development?.hotReload ? 'enabled' : 'disabled'}
  • Debug Mode: ${config.development?.debugMode ? 'enabled' : 'disabled'}
  • Log Level: ${config.development?.logLevel || 'info'}
    `.trim());
  }
  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot config show               # Display current configuration
  docker-pilot config show --json        # Display configuration as JSON
  docker-pilot config validate           # Validate configuration
  docker-pilot config init               # Create new configuration
  docker-pilot config init --name myapp  # Create config with project name
  docker-pilot config init --force       # Overwrite existing configuration
  docker-pilot config path               # Show configuration file path
  docker-pilot config edit               # Show edit instructions
`);
  }
}
