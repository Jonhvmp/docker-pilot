/**
 * Interactive Menu System for Docker Pilot
 * Provides a terminal-based menu interface similar to the legacy CLI
 */

import * as readline from 'readline';
import * as path from 'path';
import { DockerPilot } from '../core/DockerPilot';
import { Logger } from '../utils/Logger';
import { DockerPilotConfig, CommandContext } from '../types';
import { I18n } from '../utils/i18n';

export interface MenuOption {
  key: string;
  label: string;
  description?: string;
  action: () => Promise<void> | void;
  category?: string;
}

export class InteractiveMenu {
  private dockerPilot: DockerPilot;
  private logger: Logger;
  private rl: readline.Interface;
  private isRunning: boolean = false;
  private i18n: I18n;
  constructor(dockerPilot: DockerPilot) {
    this.dockerPilot = dockerPilot;
    this.logger = new Logger();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Initialize i18n
    this.i18n = new I18n();
    this.updateLanguage();
  }  /**
   * Start the interactive menu
   */
  async start(): Promise<void> {
    this.isRunning = true;

    // Check if language is configured, if not ask user to choose
    const config = this.dockerPilot.getConfig();
    if (!config?.language) {
      await this.selectInitialLanguage();
    } else {
      this.updateLanguage();
    }

    // Check Docker status before starting
    if (!(await this.checkDockerStatus())) {
      await this.handleDockerNotRunning();
      return;
    }

    // Auto-detect docker-compose files
    await this.autoDetectProject();

    this.clearScreen();
    this.showWelcome();
    await this.showMainMenu();
  }  /**
   * Stop the interactive menu
   */
  stop(): void {
    this.isRunning = false;
    if (this.rl) {
      try {
        this.rl.removeAllListeners();
        this.rl.close();
      } catch (error) {
        // Ignore errors when closing readline
      }
    }
  }

  /**
   * Select initial language if not configured
   */
  private async selectInitialLanguage(): Promise<void> {
    this.clearScreen();

    // Use default language for initial display
    this.i18n.setLanguage('en');

    console.log(this.i18n.t('language.welcome'));
    console.log('');
    console.log(this.i18n.t('language.choose_initial'));
    console.log(this.i18n.t('language.option_english'));
    console.log(this.i18n.t('language.option_portuguese'));
    console.log('');

    let validChoice = false;
    let selectedLanguage: 'en' | 'pt-br' = 'en';

    while (!validChoice) {
      const choice = await this.askQuestion(this.i18n.t('language.enter_choice'));

      if (choice === '1') {
        selectedLanguage = 'en';
        validChoice = true;
      } else if (choice === '2') {
        selectedLanguage = 'pt-br';
        validChoice = true;
      } else {
        console.log(this.i18n.t('language.invalid_choice'));
        console.log('');
      }
    }

    // Update language in i18n
    this.i18n.setLanguage(selectedLanguage);

    // Update language in DockerPilot and save to config
    await this.dockerPilot.updateLanguage(selectedLanguage);

    console.log('');
    console.log(this.i18n.t('language.configured'));
    console.log('');

    await this.sleep(1500);
  }/**
   * Check if Docker is running
   */
  private async checkDockerStatus(): Promise<boolean> {
    try {
      const result = await this.dockerPilot.getCommandRunner().exec('docker info', {
        silent: true
      });
      return result.success;
    } catch (error) {
      return false;
    }
  }
  /**
   * Handle Docker not running scenario
   */
  private async handleDockerNotRunning(): Promise<void> {
    this.updateLanguage();

    this.logger.error(this.i18n.t('docker.not_running'));
    this.logger.newLine();
    this.logger.info(this.i18n.t('docker.options_available'));
    this.logger.info(this.i18n.t('docker.start_desktop'));
    this.logger.info(this.i18n.t('docker.start_linux'));
    this.logger.info(this.i18n.t('docker.start_macos'));
    this.logger.newLine();
    this.logger.info(this.i18n.t('docker.restart_tip'));
    this.logger.newLine();

    const answer = await this.askQuestion(this.i18n.t('docker.retry_or_exit'));

    const exitWords = ['sair', 'exit', 'quit', 'q'];
    if (exitWords.some(word => answer.toLowerCase() === word)) {
      this.logger.info(`👋 ${this.i18n.t('docker.pilot_finished')}`);
      process.exit(0);
    } else {
      this.clearScreen();
      if (await this.checkDockerStatus()) {
        this.logger.success(this.i18n.t('docker.working_now'));
        this.logger.newLine();
        await this.showMainMenu();
      } else {
        await this.handleDockerNotRunning();
      }
    }
  }/**
   * Show welcome message
   */
  private showWelcome(): void {
    this.updateLanguage();

    const config = this.dockerPilot.getConfig();
    const projectName = config?.projectName || 'Docker Project';

    console.log(this.i18n.t('menu.welcome', {
      projectName: projectName,
      version: '2.0'
    }));

    // Show project info
    const workingDir = this.dockerPilot.getWorkingDirectory();
    const services = config ? Object.keys(config.services) : [];
    const servicesText = services.length > 0 ? services.join(', ') : this.i18n.t('menu.no_services');

    console.log(this.i18n.t('menu.directory', { path: workingDir }));
    console.log(this.i18n.t('menu.services', { services: servicesText }));
    console.log('');
  }/**
   * Show main menu
   */
  private async showMainMenu(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const config = this.dockerPilot.getConfig();
      if (!config) {
        this.logger.error('Configuração não encontrada!');
        this.stop();
        process.exit(1);
      }

      const menuOptions = this.buildMenuOptions(config);

      this.displayMenu(menuOptions);      const choice = await this.askQuestion(this.i18n.t('menu.choose') + ' ');      if (choice === '0') {
        const config = this.dockerPilot.getConfig();
        const projectName = config?.projectName || 'Docker Project';
        this.logger.info(`👋 ${this.i18n.t('menu.goodbye', { projectName })}`);
        this.stop();
        process.exit(0);
      }

      const selectedOption = menuOptions.find(option => option.key === choice);
        if (selectedOption) {
        this.clearScreen();        console.log('='.repeat(60));
        console.log(this.i18n.t('menu.executing', { command: selectedOption.label }));
        console.log('='.repeat(60));
        console.log('');

        try {
          await selectedOption.action();
          await this.askToContinue();
        } catch (error) {
          this.logger.error('Erro ao executar comando', error);
          await this.askToContinue();
        }      } else {
        this.logger.error(this.i18n.t('menu.invalid_choice'));
        await this.sleep(2000);
        this.clearScreen();
        this.showWelcome();
        await this.showMainMenu();
      }} catch (error) {      // Handle readline closure gracefully
      if (error instanceof Error && (error.message.includes('fechada') || error.message.includes('closed'))) {
        const config = this.dockerPilot.getConfig();
        const projectName = config?.projectName || 'Docker Project';
        console.log('\n👋 ' + this.i18n.t('menu.goodbye', { projectName }));
        this.stop();
        process.exit(0);
      } else {
        this.logger.error('Erro no menu principal:', error);
        this.stop();
        process.exit(1);
      }
    }
  }

  /**
   * Build menu options dynamically
   */
  private buildMenuOptions(config: DockerPilotConfig): MenuOption[] {
    const options: MenuOption[] = [];
    let optionKey = 1;    // Basic commands
    options.push(
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.setup'),
        category: '🚀 ' + this.i18n.t('command.basic'),        action: async () => {          console.log(this.i18n.t('command.detecting_services'));

          // Ask user if they want to replace existing services
          const config = this.dockerPilot.getConfig();
          const currentServices = config ? Object.keys(config.services) : [];

          let replaceExisting = false;
          if (currentServices.length > 0) {
            console.log('');
            console.log(this.i18n.t('command.current_services', { services: currentServices.join(', ') }));
            const replaceAnswer = await this.askQuestion(this.i18n.t('command.replace_services_question'));
            replaceExisting = ['s', 'sim', 'y', 'yes'].some(ans => replaceAnswer.toLowerCase() === ans);
          } else {
            // If no current services, always replace (sync)
            replaceExisting = true;
          }

          await this.dockerPilot.detectServices(replaceExisting);
          console.log(this.i18n.t('command.detection_complete'));

          // Show updated service status after detection
          await this.displayServiceStatus();
          await this.sleep(2000);
          this.clearScreen();
          this.showWelcome();
          await this.showMainMenu();
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.start_all'),
        category: '🚀 ' + this.i18n.t('command.basic'),        action: async () => {
          await this.dockerPilot.executeCommand('up', []);
          await this.displayServiceStatus();
        }
      },      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.stop_all'),
        category: '🚀 ' + this.i18n.t('command.basic'),
        action: async () => {
          try {            // Execute DownCommand directly
            const context = this.createCommandContext();
            if (!context) {
              this.logger.error('Failed to create command context');
              return;
            }
            const { DownCommand } = await import('../commands/DownCommand');
            const downCommand = new DownCommand(context);

            this.logger.info('🛑 Stopping all services...');
            console.log('\n' + '='.repeat(50));

            const result = await downCommand.execute([], {});

            console.log('='.repeat(50));

            if (result.success) {
              this.logger.success('✅ All services stopped successfully');
              if (result.executionTime) {
                this.logger.info(`⏱️ Completed in ${result.executionTime.toFixed(2)}ms`);
              }
            } else {
              this.logger.error(`❌ Failed to stop services: ${result.error}`);
            }
          } catch (error) {
            this.logger.error('Failed to stop services', error);
          }
        }
      },{
        key: (optionKey++).toString(),
        label: this.i18n.t('command.restart_all'),
        category: '🚀 ' + this.i18n.t('command.basic'),
        action: async () => {
          try {            // Execute RestartCommand directly
            const context = this.createCommandContext();
            if (!context) {
              this.logger.error('Failed to create command context');
              return;
            }
            const { RestartCommand } = await import('../commands/RestartCommand');
            const restartCommand = new RestartCommand(context);

            const result = await restartCommand.execute([], {});

            if (result.success) {
              console.log('');
              this.logger.success('✅ All services restarted successfully');
              if (result.executionTime) {
                this.logger.info(`⏱️ Completed in ${result.executionTime.toFixed(2)}ms`);
              }

              // Show updated status after restart
              await this.displayServiceStatus();
            } else {
              this.logger.error(result.error || 'Failed to restart services');
            }
          } catch (error) {
            this.logger.error(`Restart command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      },{
        key: (optionKey++).toString(),
        label: 'Build todos os serviços',
        category: '🚀 ' + this.i18n.t('command.basic'),
        action: async () => {
          // Ask user for build options
          this.logger.info('🔨 Opções de build:');
          console.log('1. Build normal');
          console.log('2. Build sem cache (--no-cache)');
          console.log('3. Build com pull (--pull)');
          console.log('4. Build sem cache e com pull');
          console.log('');

          const choice = await this.askQuestion(this.i18n.t('menu.choose') + ' ');

          switch (choice) {
            case '1':
              await this.dockerPilot.executeCommand('build', []);
              break;
            case '2':
              await this.dockerPilot.executeCommand('build', ['--no-cache']);
              break;
            case '3':
              await this.dockerPilot.executeCommand('build', ['--pull']);
              break;
            case '4':
              await this.dockerPilot.executeCommand('build', ['--pull', '--no-cache']);
              break;
            default:
              this.logger.warn(this.i18n.t('error.invalid_choice'));
              return;
          }

          await this.displayServiceStatus();
          await this.askToContinue();
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.rebuild_all'),
        category: '🚀 ' + this.i18n.t('command.basic'),
        action: async () => {
          await this.dockerPilot.executeCommand('build', ['--no-cache']);
          await this.dockerPilot.executeCommand('up', []);
          await this.displayServiceStatus();
        }
      },      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.logs_all'),
        category: '🚀 ' + this.i18n.t('command.basic'),
        action: async () => {
          try {
            // Ask user if they want to follow logs or see recent logs
            this.logger.info('📋 ' + this.i18n.t('command.logs_options'));
            console.log('1. ' + this.i18n.t('command.logs_follow_all'));
            console.log('2. ' + this.i18n.t('command.logs_recent_all'));
            console.log('3. ' + this.i18n.t('command.logs_tail_custom'));
            console.log('');

            const choice = await this.askQuestion(this.i18n.t('menu.choose') + ' ');            // Execute LogsCommand directly
            const context = this.createCommandContext();
            if (!context) {
              this.logger.error('Failed to create command context');
              return;
            }
            const { LogsCommand } = await import('../commands/LogsCommand');
            const logsCommand = new LogsCommand(context);

            let logsArgs: string[] = [];

            switch (choice) {
              case '1':
                this.logger.info('🔄 ' + this.i18n.t('command.following_logs_all'));
                this.logger.info('💡 ' + this.i18n.t('command.stop_logs_tip'));
                this.logger.newLine();
                logsArgs.push('--follow');
                break;
              case '2':
                logsArgs.push('--tail', '50');
                break;
              case '3':
                const tailCount = await this.askQuestion(this.i18n.t('command.logs_tail_count'));
                const count = parseInt(tailCount) || 50;
                logsArgs.push('--tail', count.toString());
                break;
              default:
                this.logger.warn(this.i18n.t('error.invalid_choice'));
                return;
            }

            const result = await logsCommand.execute(logsArgs, {});

            if (result.success) {
              if (result.output && result.output.trim() !== '') {
                console.log('');
                console.log(result.output);
              }
              console.log('');
              this.logger.success('✅ Logs retrieved successfully');
              if (result.executionTime) {
                this.logger.info(`⏱️ Completed in ${result.executionTime.toFixed(2)}ms`);
              }
            } else {
              this.logger.error(result.error || 'Failed to retrieve logs');
            }
          } catch (error) {
            this.logger.error(`Logs command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      },{
        key: (optionKey++).toString(),
        label: this.i18n.t('command.status'),
        category: '🚀 ' + this.i18n.t('command.basic'),        action: async () => {
          try {
            const context = this.createCommandContext();
            if (!context) {
              this.logger.error('Configuration not available in context');
              return;
            }
            
            const { StatusCommand } = await import('../commands/StatusCommand');
            const statusCommand = new StatusCommand(context);

            const result = await statusCommand.execute([], {});

            if (result.success) {
              // Show the status output if available
              if (result.output && result.output.trim() !== '[]') {
                console.log('');
                console.log(result.output);
              }
              console.log('');
              this.logger.success(this.i18n.t('command.status_complete'));
              if (result.executionTime) {
                this.logger.info(`⏱️ Completed in ${result.executionTime.toFixed(2)}ms`);
              }
            } else {
              this.logger.error(result.error || this.i18n.t('command.status_failed'));
            }
          } catch (error) {
            this.logger.error(`Status command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    );    // Advanced commands
    options.push(
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.shell'),
        category: '🛠️ ' + this.i18n.t('command.advanced'),        action: async () => {
          try {
            // Get current config first
            const currentConfig = this.dockerPilot.getConfig();
            if (!currentConfig) {
              this.logger.error('Configuration not available');
              return;
            }

            const services = Object.keys(currentConfig.services);
            if (services.length === 0) {
              this.logger.warn(this.i18n.t('command.no_services_configured'));
              return;
            }

            this.logger.info(this.i18n.t('command.available_services'));
            services.forEach((service, index) => {
              this.logger.info(`${index + 1}. ${service}`);
            });

            const choice = await this.askQuestion(this.i18n.t('command.choose_service'));
            const serviceIndex = parseInt(choice) - 1;
            const serviceName = services[serviceIndex] || services[0];

            if (!serviceName) {
              this.logger.error(this.i18n.t('command.no_valid_service'));
              return;
            }            // Execute ShellCommand directly
            const context = this.createCommandContext();
            if (!context) {
              this.logger.error('Failed to create command context');
              return;
            }
            const { ShellCommand } = await import('../commands/ShellCommand');
            const shellCommand = new ShellCommand(context);

            const result = await shellCommand.execute([serviceName], {});

            if (result.success) {
              console.log('');
              this.logger.success(`✅ Shell session completed for ${serviceName}`);
              if (result.executionTime) {
                this.logger.info(`⏱️ Session duration: ${result.executionTime.toFixed(2)}ms`);
              }
            } else {
              this.logger.error(result.error || `Failed to open shell for ${serviceName}`);
            }
          } catch (error) {
            this.logger.error(`Shell command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }      },
      {
        key: (optionKey++).toString(),
        label: 'Executar comando customizado',
        category: '🛠️ ' + this.i18n.t('command.advanced'),
        action: async () => {
          try {
            // Get current config first
            const currentConfig = this.dockerPilot.getConfig();
            if (!currentConfig) {
              this.logger.error('Configuration not available');
              return;
            }

            const services = Object.keys(currentConfig.services);
            if (services.length === 0) {
              this.logger.warn(this.i18n.t('command.no_services_configured'));
              return;
            }

            this.logger.info(this.i18n.t('command.available_services'));
            services.forEach((service, index) => {
              this.logger.info(`${index + 1}. ${service}`);
            });

            const serviceChoice = await this.askQuestion(this.i18n.t('command.choose_service'));
            const serviceIndex = parseInt(serviceChoice) - 1;
            const serviceName = services[serviceIndex] || services[0];

            if (!serviceName) {
              this.logger.error(this.i18n.t('command.no_valid_service'));
              return;
            }

            const command = await this.askQuestion('Digite o comando para executar: ');
            if (!command.trim()) {
              this.logger.error('Command is required');
              return;
            }

            console.log('');
            this.logger.info(`🚀 Executando comando no serviço ${serviceName}: ${command}`);            // Execute ExecCommand directly
            const context = this.createCommandContext();
            if (!context) {
              this.logger.error('Failed to create command context');
              return;
            }
            const { ExecCommand } = await import('../commands/ExecCommand');
            const execCommand = new ExecCommand(context);

            const result = await execCommand.execute([serviceName, ...command.split(' ')], {});

            if (result.success) {
              console.log('');
              this.logger.success(`✅ Command executed successfully in ${serviceName}`);
              if (result.executionTime) {
                this.logger.info(`⏱️ Execution time: ${result.executionTime.toFixed(2)}ms`);
              }
            } else {
              this.logger.error(result.error || `Failed to execute command in ${serviceName}`);
            }
          } catch (error) {
            this.logger.error(`Exec command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.health'),
        category: '🛠️ ' + this.i18n.t('command.advanced'),action: async () => {
          const serviceManager = this.dockerPilot.getServiceManager();
          if (!serviceManager) {
            this.logger.error(this.i18n.t('command.service_manager_unavailable'));
            return;
          }

          const services = await serviceManager.getServiceStatus();

          this.logger.info(this.i18n.t('command.health_status'));
          this.logger.newLine();

          for (const service of services) {
            const statusIcon = service.state === 'running' ? '✅' :
                              service.state === 'stopped' ? '❌' : '⚠️';
            const health = service.health || 'N/A';

            this.logger.info(`${statusIcon} ${service.name}: ${service.state} (Health: ${health})`);
          }

          this.logger.newLine();
          this.logger.success(this.i18n.t('command.health_check_complete'));
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.monitor'),
        category: '🛠️ ' + this.i18n.t('command.advanced'),
        action: async () => {
          this.logger.info(this.i18n.t('command.monitoring_start'));
          this.logger.info(this.i18n.t('command.monitoring_tip'));
          this.logger.newLine();

          const monitorProcess = setInterval(async () => {
            try {
              this.clearScreen();
              this.logger.info(this.i18n.t('command.docker_monitor', { time: new Date().toLocaleString() }));
              this.logger.separator('=', 50);
              this.logger.newLine();

              await this.displayServiceStatus();

              this.logger.info(this.i18n.t('command.press_ctrl_c'));
            } catch (error) {
              clearInterval(monitorProcess);
            }
          }, 5000);

          // Listen for Ctrl+C
          process.on('SIGINT', () => {
            clearInterval(monitorProcess);
            this.logger.newLine();
            this.logger.info(this.i18n.t('command.monitoring_stopped'));
          });
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.update'),
        category: '🛠️ ' + this.i18n.t('command.advanced'),
        action: async () => {
          this.logger.loading(this.i18n.t('command.updating_images'));
          await this.dockerPilot.executeCommand('pull', []);
          await this.dockerPilot.executeCommand('build', ['--pull']);
          await this.dockerPilot.executeCommand('up', []);
          this.logger.success(this.i18n.t('command.update_complete'));
        }
      }
    );    // Maintenance commands
    options.push(
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.clean'),
        category: '⚙️ ' + this.i18n.t('command.maintenance'),
        action: async () => {
          await this.dockerPilot.executeCommand('clean', []);
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.deep_clean'),
        category: '⚙️ ' + this.i18n.t('command.maintenance'),
        action: async () => {
          const confirm = await this.askQuestion(this.i18n.t('command.deep_clean_warning'));

          if (confirm.toLowerCase() === 's' || confirm.toLowerCase() === 'sim' ||
              confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
            await this.dockerPilot.executeCommand('down', ['--volumes']);
            await this.dockerPilot.executeCommand('clean', ['--all']);
            this.logger.success(this.i18n.t('command.deep_clean_complete'));
          } else {
            this.logger.info(this.i18n.t('command.operation_cancelled'));
          }
        }
      },      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.show_config'),
        category: '⚙️ ' + this.i18n.t('command.maintenance'),
        action: async () => {          try {
            // Execute ConfigCommand directly
            const context = this.createCommandContext();
            if (!context) {
              this.logger.error('Failed to create command context');
              return;
            }
            const { ConfigCommand } = await import('../commands/ConfigCommand');
            const configCommand = new ConfigCommand(context);

            const result = await configCommand.execute(['show'], {});

            if (result.success) {
              console.log('');
              this.logger.success('✅ Configuration displayed successfully');
              if (result.executionTime) {
                this.logger.info(`⏱️ Completed in ${result.executionTime.toFixed(2)}ms`);
              }
            } else {
              this.logger.error(result.error || 'Failed to show configuration');
            }
          } catch (error) {
            this.logger.error(`Config command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.advanced_settings'),
        category: '⚙️ ' + this.i18n.t('command.maintenance'),
        action: async () => {
          await this.showAdvancedSettings();
        }
      }    );

    // Compose file management commands
    options.push(
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.compose_list'),
        category: '📄 ' + this.i18n.t('command.compose_management'),        action: async () => {
          const context = this.createCommandContext();

          const composeCommand = new (await import('../commands/ComposeCommand')).ComposeCommand(context);
          const result = await composeCommand.execute(['list', '--variants']);

          if (result.success) {
            console.log(result.output);
          } else {
            this.logger.error(result.error || 'Erro desconhecido');
          }
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.compose_find'),
        category: '📄 ' + this.i18n.t('command.compose_management'),        action: async () => {
          const searchDir = await this.askQuestion(this.i18n.t('command.compose_search_dir_prompt'));
          const dirToSearch = searchDir.trim() || process.cwd();

          const context = this.createCommandContext();

          const composeCommand = new (await import('../commands/ComposeCommand')).ComposeCommand(context);
          const result = await composeCommand.execute(['find', dirToSearch]);

          if (result.success) {
            console.log(result.output);
          } else {
            this.logger.error(result.error || 'Erro desconhecido');
          }
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.compose_analyze'),
        category: '📄 ' + this.i18n.t('command.compose_management'),
        action: async () => {
          // First, let user select from available compose files
          const fileUtils = this.dockerPilot.getFileUtils();
          const foundFiles = await fileUtils.findDockerComposeFilesWithInfo(undefined, {
            maxDepth: 6,
            includeVariants: true,
            includeEmptyFiles: false
          });

          if (foundFiles.length === 0) {
            this.logger.warn(this.i18n.t('compose.no_files_found'));
            return;
          }          if (foundFiles.length === 1) {
            // Only one file, analyze it directly
            const firstFile = foundFiles[0];
            if (firstFile) {
              const context = this.createCommandContext();
              const composeCommand = new (await import('../commands/ComposeCommand')).ComposeCommand(context);
              const result = await composeCommand.execute(['analyze', firstFile.path]);

              if (result.success) {
                console.log(result.output);
              } else {
                this.logger.error(result.error || 'Erro desconhecido');
              }
            }
          } else {
            // Multiple files, let user choose
            console.log(this.i18n.t('compose.available_files'));
            foundFiles.slice(0, 10).forEach((file, index) => {
              const envText = file.environment ? ` (${file.environment})` : '';
              console.log(`${index + 1}. ${file.relativePath}${envText}`);
            });

            const choice = await this.askQuestion(this.i18n.t('compose.select_file_to_analyze'));
            const selectedIndex = parseInt(choice) - 1;

            if (selectedIndex >= 0 && selectedIndex < foundFiles.length) {
              const selectedFile = foundFiles[selectedIndex];
              if (selectedFile) {
                const context = this.createCommandContext();
                const composeCommand = new (await import('../commands/ComposeCommand')).ComposeCommand(context);
                const result = await composeCommand.execute(['analyze', selectedFile.path]);

                if (result.success) {
                  console.log(result.output);
                } else {
                  this.logger.error(result.error || 'Erro desconhecido');
                }
              }
            } else {
              this.logger.error(this.i18n.t('error.invalid_choice'));
            }
          }
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.compose_validate'),
        category: '📄 ' + this.i18n.t('command.compose_management'),
        action: async () => {
          // Similar to analyze, but for validation
          const fileUtils = this.dockerPilot.getFileUtils();
          const foundFiles = await fileUtils.findDockerComposeFilesWithInfo(undefined, {
            maxDepth: 6,
            includeVariants: true,
            includeEmptyFiles: false
          });

          if (foundFiles.length === 0) {
            this.logger.warn(this.i18n.t('compose.no_files_found'));
            return;
          }          if (foundFiles.length === 1) {
            const firstFile = foundFiles[0];
            if (firstFile) {
              const context = this.createCommandContext();
              const composeCommand = new (await import('../commands/ComposeCommand')).ComposeCommand(context);
              const result = await composeCommand.execute(['validate', firstFile.path]);

              if (result.success) {
                console.log(result.output);
              } else {
                this.logger.error(result.error || 'Erro desconhecido');
              }
            }
          } else {
            console.log(this.i18n.t('compose.available_files'));
            foundFiles.slice(0, 10).forEach((file, index) => {
              const envText = file.environment ? ` (${file.environment})` : '';
              console.log(`${index + 1}. ${file.relativePath}${envText}`);
            });

            const choice = await this.askQuestion(this.i18n.t('compose.select_file_to_validate'));
            const selectedIndex = parseInt(choice) - 1;

            if (selectedIndex >= 0 && selectedIndex < foundFiles.length) {
              const selectedFile = foundFiles[selectedIndex];
              if (selectedFile) {
                const context = this.createCommandContext();
                const composeCommand = new (await import('../commands/ComposeCommand')).ComposeCommand(context);
                const result = await composeCommand.execute(['validate', selectedFile.path]);

                if (result.success) {
                  console.log(result.output);
                } else {
                  this.logger.error(result.error || 'Erro desconhecido');
                }
              }
            } else {
              this.logger.error(this.i18n.t('error.invalid_choice'));
            }
          }
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.compose_services'),
        category: '📄 ' + this.i18n.t('command.compose_management'),        action: async () => {
          const context = this.createCommandContext();
          const composeCommand = new (await import('../commands/ComposeCommand')).ComposeCommand(context);
          const result = await composeCommand.execute(['services']);

          if (result.success) {
            console.log(result.output);
          } else {
            this.logger.error(result.error || 'Erro desconhecido');
          }
        }      }
    );

    // Compose file management commands
    options.push(
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.compose_show_primary'),
        category: '📄 ' + this.i18n.t('command.compose_management'),
        action: async () => {
          const primaryFile = this.dockerPilot.getPrimaryComposeFile();
          if (primaryFile) {
            console.log(this.i18n.t('compose.current_primary', { file: path.relative(process.cwd(), primaryFile) }));
          } else {
            console.log(this.i18n.t('compose.no_primary_file'));
          }
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.compose_change_primary'),
        category: '📄 ' + this.i18n.t('command.compose_management'),
        action: async () => {
          await this.selectAndSetPrimaryComposeFile();
        }
      }
    );

    // Service-specific commands
    Object.keys(config.services).forEach(serviceName => {
      const serviceDisplayName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);

      options.push(
        {
          key: (optionKey++).toString(),
          label: this.i18n.t('command.start_service', { service: serviceName }),
          category: `🔧 ${serviceDisplayName}`,
          action: async () => {
            await this.dockerPilot.executeCommand('up', [serviceName]);
            await this.displayServiceStatus(serviceName);
          }
        },        {
          key: (optionKey++).toString(),
          label: this.i18n.t('command.restart_service', { service: serviceName }),
          category: `🔧 ${serviceDisplayName}`,
          action: async () => {
            try {
              // Execute RestartCommand directly for specific service
              const currentConfig = this.dockerPilot.getConfig();
              if (!currentConfig) {
                this.logger.error('Configuration not available');
                return;
              }              const context = this.createCommandContext();
              if (!context) {
                this.logger.error('Failed to create command context');
                return;
              }
              const { RestartCommand } = await import('../commands/RestartCommand');
              const restartCommand = new RestartCommand(context);

              const result = await restartCommand.execute([serviceName], {});

              if (result.success) {
                console.log('');
                this.logger.success(`✅ Service "${serviceName}" restarted successfully`);
                if (result.executionTime) {
                  this.logger.info(`⏱️ Completed in ${result.executionTime.toFixed(2)}ms`);
                }

                // Show updated status after restart
                await this.displayServiceStatus(serviceName);
              } else {
                this.logger.error(result.error || `Failed to restart service "${serviceName}"`);
              }
            } catch (error) {
              this.logger.error(`Restart command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }        },{
          key: (optionKey++).toString(),
          label: `Build ${serviceName}`,
          category: `🔧 ${serviceDisplayName}`,
          action: async () => {
            // Ask user for build options for specific service
            this.logger.info(`🔨 Build options para ${serviceName}:`);
            console.log('1. Build normal');
            console.log('2. Build sem cache (--no-cache)');
            console.log('3. Build com pull (--pull)');
            console.log('4. Build sem cache e com pull');
            console.log('');

            const choice = await this.askQuestion(this.i18n.t('menu.choose') + ' ');

            switch (choice) {
              case '1':
                await this.dockerPilot.executeCommand('build', [serviceName]);
                break;
              case '2':
                await this.dockerPilot.executeCommand('build', [serviceName, '--no-cache']);
                break;
              case '3':
                await this.dockerPilot.executeCommand('build', [serviceName, '--pull']);
                break;
              case '4':
                await this.dockerPilot.executeCommand('build', [serviceName, '--pull', '--no-cache']);
                break;
              default:
                this.logger.warn(this.i18n.t('error.invalid_choice'));
                return;
            }

            await this.displayServiceStatus(serviceName);
            await this.askToContinue();
          }
        },        {
          key: (optionKey++).toString(),
          label: this.i18n.t('command.logs_service', { service: serviceName }),
          category: `🔧 ${serviceDisplayName}`,
          action: async () => {
            try {
              // Ask user for log viewing options
              this.logger.info(`📋 Logs do ${serviceName}:`);
              console.log('1. Seguir logs em tempo real');
              console.log('2. Ver últimas 50 linhas');
              console.log('3. Ver últimas N linhas');
              console.log('4. Logs desde um tempo específico');
              console.log('');

              const choice = await this.askQuestion('Escolha uma opção: ');

              // Execute LogsCommand directly
              const config = this.dockerPilot.getConfig();
              if (!config) {
                this.logger.error('Configuration not available');
                return;
              }              const context = this.createCommandContext();
              if (!context) {
                this.logger.error('Failed to create command context');
                return;
              }
              const { LogsCommand } = await import('../commands/LogsCommand');
              const logsCommand = new LogsCommand(context);

              let logsArgs: string[] = [serviceName];

              switch (choice) {
                case '1':
                  this.logger.info(`🔄 Seguindo logs do ${serviceName}...`);
                  this.logger.info('💡 ' + this.i18n.t('command.press_ctrl_c'));
                  this.logger.newLine();
                  logsArgs.push('--follow');
                  break;
                case '2':
                  logsArgs.push('--tail', '50');
                  break;
                case '3':
                  const tailCount = await this.askQuestion('Quantas linhas mostrar? ');
                  const count = parseInt(tailCount) || 50;
                  logsArgs.push('--tail', count.toString());
                  break;
                case '4':
                  const since = await this.askQuestion('Desde quando? (ex: 1h, 30m, 2023-01-01): ');
                  if (since.trim()) {
                    logsArgs.push('--since', since.trim());
                  } else {
                    this.logger.warn('Tempo inválido fornecido');
                    return;
                  }
                  break;
                default:
                  this.logger.warn(this.i18n.t('error.invalid_choice'));
                  return;
              }

              const result = await logsCommand.execute(logsArgs, {});

              if (result.success) {
                if (result.output && result.output.trim() !== '') {
                  console.log('');
                  console.log(result.output);
                }
                console.log('');
                this.logger.success(`✅ Logs for ${serviceName} retrieved successfully`);
                if (result.executionTime) {
                  this.logger.info(`⏱️ Completed in ${result.executionTime.toFixed(2)}ms`);
                }
              } else {
                this.logger.error(result.error || `Failed to retrieve logs for ${serviceName}`);
              }
            } catch (error) {
              this.logger.error(`Logs command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      );
    });

    return options;
  }  /**
   * Display menu with categories
   */
  private displayMenu(options: MenuOption[]): void {
    this.updateLanguage();
    let currentCategory = '';

    for (const option of options) {
      if (option.category && option.category !== currentCategory) {
        console.log(`\n${option.category}`);
        currentCategory = option.category;
      }

      console.log(`${option.key}. ${option.label}`);
    }

    console.log(`\n0. ${this.i18n.t('menu.exit')}\n`);
  }
  /**
   * Display service status
   */
  private async displayServiceStatus(serviceName?: string): Promise<void> {
    try {
      const serviceManager = this.dockerPilot.getServiceManager();
      if (!serviceManager) {
        this.logger.error('Service Manager não disponível');
        return;
      }

      const services = await serviceManager.getServiceStatus(serviceName);

      if (services.length === 0) {
        this.logger.warn('Nenhum serviço encontrado');
        return;
      }

      this.logger.newLine();
      this.logger.info('📊 Status dos Serviços:');
      this.logger.separator('-', 40);

      const config = this.dockerPilot.getConfig();

      for (const service of services) {
        const serviceConfig = config?.services[service.name];
        let statusLine = `${service.name}: ${service.state}`;

        if (service.health && service.health !== 'none') {
          statusLine += ` (${service.health})`;
        }

        if (serviceConfig?.port && service.state === 'running') {
          const url = service.name === 'redis'
            ? `redis://localhost:${serviceConfig.port}`
            : `http://localhost:${serviceConfig.port}`;
          statusLine += ` - ${url}`;
        }

        if (serviceConfig?.description) {
          statusLine += ` - ${serviceConfig.description}`;
        }

        const statusIcon = service.state === 'running' ? '✅' :
                          service.state === 'stopped' ? '❌' : '⚠️';

        this.logger.info(`${statusIcon} ${statusLine}`);
      }

      this.logger.newLine();
    } catch (error) {
      this.logger.debug('Erro ao exibir status dos serviços', error);
    }
  }  /**
   * Ask if user wants to continue
   */
  private async askToContinue(): Promise<void> {
    console.log('\n' + '='.repeat(50));

    try {
      const answer = await this.askQuestion(this.i18n.t('menu.continue_question'));

      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim' ||
          answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        this.clearScreen();
        this.showWelcome();
        await this.showMainMenu();      } else {
        const config = this.dockerPilot.getConfig();
        const projectName = config?.projectName || 'Docker Project';
        console.log('👋 ' + this.i18n.t('menu.goodbye', { projectName }));
        this.stop();
        process.exit(0);
      }
    } catch (error) {      // Handle readline closure gracefully
      if (error instanceof Error && error.message.includes('fechada')) {
        const config = this.dockerPilot.getConfig();
        const projectName = config?.projectName || 'Docker Project';
        console.log('\n👋 ' + this.i18n.t('menu.goodbye', { projectName }));
        this.stop();
        process.exit(0);
      }else {
        this.logger.error('Erro ao perguntar sobre continuar:', error);
        this.stop();
        process.exit(1);
      }
    }
  }/**
   * Ask a question and wait for user input
   */
  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.rl || !this.isRunning) {
        reject(new Error('Menu não está mais ativo'));
        return;
      }

      // Clean up any existing listeners
      this.rl.removeAllListeners('close');

      const onAnswer = (answer: string) => {
        this.rl.removeAllListeners('close');
        resolve(answer.trim());
      };

      const onClose = () => {
        this.rl.removeAllListeners('line');
        if (this.isRunning) {
          // Only treat as error if we're still supposed to be running
          reject(new Error('Interface fechada pelo usuário'));
        } else {
          // Normal closure
          resolve('0'); // Default to exit
        }
      };

      this.rl.question(question, onAnswer);
      this.rl.once('close', onClose);
    });
  }
  /**
   * Clear screen properly
   */
  private clearScreen(): void {
    // Force clear with multiple methods for better compatibility
    console.clear();
    process.stdout.write('\x1Bc'); // Reset terminal
    process.stdout.write('\x1b[2J\x1b[0f'); // Clear and move cursor to top
    process.stdout.write('\x1b[H'); // Move cursor to home position
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }  /**
   * Create context for compose commands
   */
  private createCommandContext(): CommandContext | null {
    const config = this.dockerPilot.getConfig();
    
    if (!config) {
      return null;
    }

    const composeFile = this.dockerPilot.getComposeFile();
    
    const context: CommandContext = {
      config: config,
      logger: this.logger,
      workingDirectory: this.dockerPilot.getWorkingDirectory()
    };
    
    // Only add composeFile if it exists
    if (composeFile) {
      context.composeFile = composeFile;
    }
    
    return context;
  }
  /**
   * Auto-detect docker-compose files recursively and suggest setup
   */
  private async autoDetectProject(): Promise<void> {
    try {
      this.updateLanguage();

      // Check if primary compose file is already configured
      if (this.dockerPilot.hasPrimaryComposeFile()) {
        const primaryFile = this.dockerPilot.getPrimaryComposeFile();
        if (primaryFile) {
          console.log(this.i18n.t('compose.current_primary', { file: path.relative(process.cwd(), primaryFile) }));
          console.log('');

          // Ask if user wants to change or keep current
          const answer = await this.askQuestion(this.i18n.t('compose.keep_primary_or_change'));
          const keepCurrent = ['s', 'sim', 'y', 'yes', ''].some(ans => answer.toLowerCase() === ans);          if (keepCurrent) {
            // Use current primary file and synchronize services automatically
            console.log(this.i18n.t('command.detecting_services'));
            await this.dockerPilot.detectServices(true); // Always replace to ensure sync
            console.log(this.i18n.t('command.detection_complete'));
            console.log('');
            console.log(this.i18n.t('compose.services_synchronized'));
            await this.displayServiceStatus();
            return;
          }
          // If not keeping current, continue with detection and selection
        }
      }

      console.log(this.i18n.t('compose.recursive_search'));
      console.log(this.i18n.t('compose.search_depth', { depth: '6' }));

      // Use enhanced FileUtils to search recursively for docker-compose files
      const fileUtils = this.dockerPilot.getFileUtils();
      const foundFiles = await fileUtils.findDockerComposeFilesWithInfo(undefined, {
        maxDepth: 6,
        includeVariants: true,
        includeEmptyFiles: false
      });

      if (foundFiles.length === 0) {
        console.log(this.i18n.t('autodetect.no_compose_found'));
        console.log(this.i18n.t('autodetect.directory_tip'));

        const answer = await this.askQuestion(this.i18n.t('autodetect.continue_anyway'));
        const positiveAnswers = ['s', 'sim', 'y', 'yes'];
        if (!positiveAnswers.some(ans => answer.toLowerCase() === ans)) {
          console.log(`👋 ${this.i18n.t('autodetect.finishing_pilot')}`);
          process.exit(0);
        }
        return;
      }

      if (foundFiles.length === 1) {
        const file = foundFiles[0];
        if (file) {
          console.log(this.i18n.t('autodetect.compose_found', { file: file.relativePath }));

          // Show detailed file information
          console.log(this.i18n.t('compose.file_info', { dir: file.directory }));
          console.log(this.i18n.t('compose.file_size', { size: fileUtils.formatFileSize(file.size) }));
          console.log(this.i18n.t('compose.file_modified', { modified: file.modified.toLocaleDateString() }));

          if (file.serviceCount > 0) {
            console.log(`   ${this.i18n.t('compose.services')}: ${file.services.join(', ')}`);
          }

          if (file.environment) {
            console.log(`   Environment: ${file.environment}`);
          }

          // Set as primary compose file and persist
          await this.dockerPilot.setPrimaryComposeFile(file.path);
        }
      } else {
        console.log(this.i18n.t('compose.multiple_files_found', { count: foundFiles.length }));
        console.log('');
        console.log(this.i18n.t('compose.prioritizing_files'));
        console.log('');

        // Show detailed information about each file (top 5)
        const topFiles = foundFiles.slice(0, 5);
        topFiles.forEach((file, index) => {
          const envText = file.environment ? ` (${file.environment})` : '';
          const mainFileIndicator = file.isMainFile ? ' 🎯' : '';
          const depthIndicator = file.depth === 0 ? ' 📁' : ` 📂(${file.depth})`;
          const servicesText = file.services.length > 0 ? file.services.join(', ') : this.i18n.t('menu.no_services');

          console.log(this.i18n.t('compose.file_details', {
            index: index + 1,
            path: file.relativePath,
            serviceCount: file.serviceCount,
            services: servicesText
          }) + mainFileIndicator + depthIndicator + envText);

          console.log(`     📏 ${fileUtils.formatFileSize(file.size)} | 📅 ${file.modified.toLocaleDateString()}`);
        });

        if (foundFiles.length > 5) {
          console.log(`   ... e mais ${foundFiles.length - 5} arquivos`);
        }

        console.log('');

        // Ask user to select a file or use the first one by default
        const firstFile = foundFiles[0];
        if (!firstFile) {
          console.log(this.i18n.t('error.generic', { message: 'No valid compose file found' }));
          return;
        }

        const answer = await this.askQuestion(this.i18n.t('compose.select_file_prompt', {
          count: Math.min(foundFiles.length, 5),
          defaultFile: firstFile.relativePath
        }));

        let selectedFile = firstFile; // Default to first (highest priority)

        if (answer.trim() !== '' && answer !== '1') {
          const selectedIndex = parseInt(answer) - 1;
          if (selectedIndex >= 0 && selectedIndex < Math.min(foundFiles.length, 5)) {
            const fileAtIndex = foundFiles[selectedIndex];
            if (fileAtIndex) {
              selectedFile = fileAtIndex;
              console.log(this.i18n.t('compose.using_selected_file', { file: selectedFile.relativePath }));
            }
          } else {
            console.log(this.i18n.t('error.invalid_choice'));
            console.log(this.i18n.t('compose.using_first_file', { file: firstFile.relativePath }));
          }
        } else {
          console.log(this.i18n.t('compose.using_first_file', { file: selectedFile.relativePath }));
        }

        // Set as primary compose file and persist
        await this.dockerPilot.setPrimaryComposeFile(selectedFile.path);
      }      // Try to auto-detect services from the selected compose file
      await this.dockerPilot.detectServices(true); // Replace existing with services from compose file

    } catch (error) {
      this.logger.debug(this.i18n.t('autodetect.detection_error'), error);
    }
  }

  /**
   * Show advanced settings menu
   */
  private async showAdvancedSettings(): Promise<void> {
    this.clearScreen();    console.log(this.i18n.t('settings.title'));
    console.log(this.i18n.t('settings.divider'));
    console.log('');

    const config = this.dockerPilot.getConfig();
    if (!config) {
      console.log(this.i18n.t('settings.config_not_found'));
      return;
    }

    console.log(this.i18n.t('settings.change_language'));
    console.log(this.i18n.t('settings.configure_log_level'));
    console.log(this.i18n.t('settings.toggle_interactive'));
    console.log(this.i18n.t('settings.custom_messages'));
    console.log(this.i18n.t('settings.dev_settings'));
    console.log(this.i18n.t('settings.back_to_main'));
    console.log('');

    const choice = await this.askQuestion('Digite sua escolha: ');

    switch (choice) {
      case '1':
        await this.changeLanguageSettings();
        break;
      case '2':
        await this.changeLogLevelSettings();
        break;
      case '3':
        await this.toggleInteractiveMode();
        break;
      case '4':
        await this.customizeMessages();
        break;
      case '5':
        await this.developmentSettings();
        break;
      case '0':
        return;      default:
        console.log(this.i18n.t('settings.invalid_option'));
        await this.sleep(2000);
        await this.showAdvancedSettings();
        break;
    }
  }

  /**
   * Change language settings
   */
  private async changeLanguageSettings(): Promise<void> {
    this.clearScreen();

    console.log(this.i18n.t('settings.language_title'));
    console.log('═══════════════════════════');
    console.log('');

    const config = this.dockerPilot.getConfig();
    if (!config) return;    const currentLangName = config.language === 'pt-br' ? '🇧🇷 Português (Brasil)' : '🇺🇸 English';
    console.log(`📍 ${this.i18n.t('language.current', { language: currentLangName })}`);
    console.log('');
    console.log(this.i18n.t('language.select_new'));
    console.log(this.i18n.t('language.option_en'));
    console.log(this.i18n.t('language.option_pt'));
    console.log(`0. ${this.i18n.t('common.back')}`);
    console.log('');

    const choice = await this.askQuestion(this.i18n.t('language.prompt'));

    let newLanguage: 'en' | 'pt-br' | null = null;

    switch (choice) {
      case '1':
        newLanguage = 'en';
        break;
      case '2':
        newLanguage = 'pt-br';
        break;
      case '0':
        await this.showAdvancedSettings();
        return;      default:
        console.log(`❌ ${this.i18n.t('language.invalid')}`);
        await this.sleep(2000);
        await this.changeLanguageSettings();
        return;
    }    if (newLanguage && newLanguage !== config.language) {      try {
        // Use the new updateLanguage method
        await this.dockerPilot.updateLanguage(newLanguage);

        // Update own i18n instance
        this.i18n.setLanguage(newLanguage);

        console.log('');
        const newLangName = newLanguage === 'pt-br' ? 'Português (Brasil)' : 'English';
        console.log(`✅ ${this.i18n.t('language.changed_success', { language: newLangName })}`);
        console.log('');
      } catch (error) {
        console.log(`❌ ${this.i18n.t('error.save_config')}:`, error);
      }
    } else {
      console.log(`ℹ️ ${this.i18n.t('common.no_changes')}`);
    }

    await this.askToContinue();
    await this.showAdvancedSettings();
  }

  /**
   * Change log level settings
   */
  private async changeLogLevelSettings(): Promise<void> {
    this.clearScreen();

    console.log('📊 Configuração de Nível de Log');
    console.log('═════════════════════════════════');
    console.log('');

    const config = this.dockerPilot.getConfig();
    if (!config) return;

    console.log(`📍 Nível atual: ${config.development.logLevel}`);
    console.log('');
    console.log('1. debug (Detalhado)');
    console.log('2. info (Informativo)');
    console.log('3. warn (Avisos)');
    console.log('4. error (Apenas erros)');
    console.log('0. Voltar');
    console.log('');

    const choice = await this.askQuestion('Escolha o nível de log: ');

    let newLogLevel: 'debug' | 'info' | 'warn' | 'error' | null = null;

    switch (choice) {
      case '1':
        newLogLevel = 'debug';
        break;
      case '2':
        newLogLevel = 'info';
        break;
      case '3':
        newLogLevel = 'warn';
        break;
      case '4':
        newLogLevel = 'error';
        break;
      case '0':
        await this.showAdvancedSettings();
        return;
      default:
        console.log('❌ Opção inválida!');
        await this.sleep(2000);
        await this.changeLogLevelSettings();
        return;
    }

    if (newLogLevel && newLogLevel !== config.development.logLevel) {
      try {
        await this.dockerPilot.updateConfig({
          development: {
            ...config.development,
            logLevel: newLogLevel
          }
        });
        console.log('');
        console.log('✅ Nível de log alterado com sucesso!');
        console.log('');
      } catch (error) {
        console.log('❌ Erro ao salvar configuração:', error);
      }
    } else {
      console.log('ℹ️ Nenhuma alteração foi feita.');
    }

    await this.askToContinue();
    await this.showAdvancedSettings();
  }

  /**
   * Toggle interactive mode
   */
  private async toggleInteractiveMode(): Promise<void> {
    this.clearScreen();

    console.log('🎛️ Modo Interativo');
    console.log('═══════════════════');
    console.log('');

    const config = this.dockerPilot.getConfig();
    if (!config) return;

    console.log(`📍 Status atual: ${config.cli.interactiveMode ? '✅ Ativado' : '❌ Desativado'}`);
    console.log('');
    console.log('1. Ativar modo interativo');
    console.log('2. Desativar modo interativo');
    console.log('0. Voltar');
    console.log('');

    const choice = await this.askQuestion('Digite sua escolha: ');

    let newMode: boolean | null = null;

    switch (choice) {
      case '1':
        newMode = true;
        break;
      case '2':
        newMode = false;
        break;
      case '0':
        await this.showAdvancedSettings();
        return;
      default:
        console.log('❌ Opção inválida!');
        await this.sleep(2000);
        await this.toggleInteractiveMode();
        return;
    }

    if (newMode !== null && newMode !== config.cli.interactiveMode) {
      try {
        await this.dockerPilot.updateConfig({
          cli: {
            ...config.cli,
            interactiveMode: newMode
          }
        });
        console.log('');
        console.log('✅ Modo interativo alterado com sucesso!');
        console.log('');
      } catch (error) {
        console.log('❌ Erro ao salvar configuração:', error);
      }
    } else {
      console.log('ℹ️ Nenhuma alteração foi feita.');
    }

    await this.askToContinue();
    await this.showAdvancedSettings();
  }

  /**
   * Customize messages
   */
  private async customizeMessages(): Promise<void> {
    this.clearScreen();

    console.log('💬 Mensagens Personalizadas');
    console.log('═══════════════════════════');
    console.log('');

    const config = this.dockerPilot.getConfig();
    if (!config) return;

    console.log('📍 Mensagens atuais:');
    console.log(`   Boas-vindas: ${config.cli.welcomeMessage}`);
    console.log(`   Despedida: ${config.cli.goodbyeMessage}`);
    console.log('');
    console.log('1. Alterar mensagem de boas-vindas');
    console.log('2. Alterar mensagem de despedida');
    console.log('3. Restaurar mensagens padrão');
    console.log('0. Voltar');
    console.log('');

    const choice = await this.askQuestion('Digite sua escolha: ');

    switch (choice) {
      case '1':
        const newWelcome = await this.askQuestion('Nova mensagem de boas-vindas: ');
        if (newWelcome.trim()) {
          await this.dockerPilot.updateConfig({
            cli: {
              ...config.cli,
              welcomeMessage: newWelcome
            }
          });
          console.log('✅ Mensagem de boas-vindas atualizada!');
        }
        break;
      case '2':
        const newGoodbye = await this.askQuestion('Nova mensagem de despedida: ');
        if (newGoodbye.trim()) {
          await this.dockerPilot.updateConfig({
            cli: {
              ...config.cli,
              goodbyeMessage: newGoodbye
            }
          });
          console.log('✅ Mensagem de despedida atualizada!');
        }
        break;
      case '3':
        const defaultWelcome = config.language === 'pt-br'
          ? 'Bem-vindo ao {projectName} Docker Pilot v{version}! 🐳'
          : 'Welcome to {projectName} Docker Pilot v{version}! 🐳';
        const defaultGoodbye = config.language === 'pt-br'
          ? 'Obrigado por usar o {projectName} Docker Pilot!'
          : 'Thank you for using {projectName} Docker Pilot!';

        await this.dockerPilot.updateConfig({
          cli: {
            ...config.cli,
            welcomeMessage: defaultWelcome,
            goodbyeMessage: defaultGoodbye
          }
        });
        console.log('✅ Mensagens restauradas para o padrão!');
        break;
      case '0':
        await this.showAdvancedSettings();
        return;
      default:
        console.log('❌ Opção inválida!');
        await this.sleep(2000);
        break;
    }

    await this.askToContinue();
    await this.customizeMessages();
  }

  /**
   * Development settings
   */
  private async developmentSettings(): Promise<void> {
    this.clearScreen();

    console.log('🔧 Configurações de Desenvolvimento');
    console.log('═══════════════════════════════════');
    console.log('');

    const config = this.dockerPilot.getConfig();
    if (!config) return;

    console.log('📍 Status atual:');
    console.log(`   Hot Reload: ${config.development.hotReload ? '✅' : '❌'}`);
    console.log(`   Debug Mode: ${config.development.debugMode ? '✅' : '❌'}`);
    console.log(`   Test Mode: ${config.development.testMode ? '✅' : '❌'}`);
    console.log(`   Environment: ${config.development.environment}`);
    console.log('');
    console.log('1. Ativar/desativar Hot Reload');
    console.log('2. Ativar/desativar Debug Mode');
    console.log('3. Ativar/desativar Test Mode');
    console.log('4. Alterar ambiente');
    console.log('0. Voltar');
    console.log('');

    const choice = await this.askQuestion('Digite sua escolha: ');

    switch (choice) {
      case '1':
        await this.dockerPilot.updateConfig({
          development: {
            ...config.development,
            hotReload: !config.development.hotReload
          }
        });
        console.log(`✅ Hot Reload ${!config.development.hotReload ? 'ativado' : 'desativado'}!`);
        break;
      case '2':
        await this.dockerPilot.updateConfig({
          development: {
            ...config.development,
            debugMode: !config.development.debugMode
          }
        });
        console.log(`✅ Debug Mode ${!config.development.debugMode ? 'ativado' : 'desativado'}!`);
        break;
      case '3':
        await this.dockerPilot.updateConfig({
          development: {
            ...config.development,
            testMode: !config.development.testMode
          }
        });
        console.log(`✅ Test Mode ${!config.development.testMode ? 'ativado' : 'desativado'}!`);
        break;
      case '4':
        console.log('Ambientes disponíveis:');
        console.log('1. development');
        console.log('2. staging');
        console.log('3. production');
          const envChoice = await this.askQuestion('Escolha o ambiente: ');
        let newEnv: 'development' | 'staging' | 'production' = 'development';

        switch (envChoice) {
          case '1': newEnv = 'development'; break;
          case '2': newEnv = 'staging'; break;
          case '3': newEnv = 'production'; break;
          default:
            console.log('❌ Opção inválida!');
            await this.sleep(2000);
            await this.developmentSettings();
            return;
        }

        await this.dockerPilot.updateConfig({
          development: {
            ...config.development,
            environment: newEnv
          }
        });
        console.log(`✅ Ambiente alterado para: ${newEnv}!`);
        break;
      case '0':
        await this.showAdvancedSettings();
        return;
      default:
        console.log('❌ Opção inválida!');
        await this.sleep(2000);
        break;
    }

    await this.askToContinue();
    await this.developmentSettings();
  }

  /**
   * Update language based on config
   */
  private updateLanguage(): void {
    const config = this.dockerPilot.getConfig();
    if (config?.language) {
      this.i18n.setLanguage(config.language);
    }
  }

  /**
   * Select and set primary compose file
   */
  private async selectAndSetPrimaryComposeFile(): Promise<void> {
    try {
      this.clearScreen();
      console.log('='.repeat(60));
      console.log(this.i18n.t('compose.persistence_menu'));
      console.log('='.repeat(60));
      console.log('');

      // Search for available compose files
      const fileUtils = this.dockerPilot.getFileUtils();
      const foundFiles = await fileUtils.findDockerComposeFilesWithInfo(undefined, {
        maxDepth: 6,
        includeVariants: true,
        includeEmptyFiles: false
      });

      if (foundFiles.length === 0) {
        console.log(this.i18n.t('compose.no_files_found'));
        return;
      }

      // Show current primary file if exists
      const currentPrimary = this.dockerPilot.getPrimaryComposeFile();
      if (currentPrimary) {
        console.log(this.i18n.t('compose.current_primary', { file: path.relative(process.cwd(), currentPrimary) }));
        console.log('');
      }

      console.log(this.i18n.t('compose.choose_new_primary'));
      console.log('');

      // Show available files
      foundFiles.slice(0, 10).forEach((file, index) => {
        const envText = file.environment ? ` (${file.environment})` : '';
        const mainFileIndicator = file.isMainFile ? ' 🎯' : '';
        const currentIndicator = currentPrimary && file.path === currentPrimary ? ' ⭐' : '';

        console.log(`${index + 1}. ${file.relativePath}${envText}${mainFileIndicator}${currentIndicator}`);
        console.log(`     📏 ${fileUtils.formatFileSize(file.size)} | ⚙️ ${file.serviceCount} services | 📅 ${file.modified.toLocaleDateString()}`);
      });

      if (foundFiles.length > 10) {
        console.log(`   ... e mais ${foundFiles.length - 10} arquivos`);
      }

      console.log('');
      console.log('0. Cancel');
      console.log('');      const choice = await this.askQuestion('Select new primary file (1-10): ');

      if (choice === '0') {
        console.log(this.i18n.t('compose.operation_cancelled'));
        return;
      }

      const selectedIndex = parseInt(choice) - 1;
      if (selectedIndex >= 0 && selectedIndex < Math.min(foundFiles.length, 10)) {
        const selectedFile = foundFiles[selectedIndex];
        if (selectedFile) {
          console.log('');
          console.log(this.i18n.t('compose.setting_primary', { file: selectedFile.relativePath }));

          // Set as primary compose file and persist
          await this.dockerPilot.setPrimaryComposeFile(selectedFile.path);

          console.log(this.i18n.t('compose.primary_set_success', { file: selectedFile.relativePath }));
          console.log('');

          // Ask if user wants to reload/re-detect services
          const reloadAnswer = await this.askQuestion(this.i18n.t('compose.reload_services_question'));
          const shouldReload = ['s', 'sim', 'y', 'yes'].some(ans => reloadAnswer.toLowerCase() === ans);          if (shouldReload) {
            console.log(this.i18n.t('command.detecting_services'));
            await this.dockerPilot.detectServices(true); // Replace existing with services from new primary file
            console.log(this.i18n.t('command.detection_complete'));
            console.log('');
            console.log(this.i18n.t('compose.services_synchronized'));

            // Show updated service status
            await this.displayServiceStatus();
          } else {
            console.log(this.i18n.t('compose.services_not_reloaded'));
          }
        }
      } else {
        console.log(this.i18n.t('error.invalid_choice'));
      }
        } catch (error) {
      this.logger.error(this.i18n.t('compose.error_setting_primary'), error);
    }
  }
}
