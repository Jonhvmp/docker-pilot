/**
 * Interactive Menu System for Docker Pilot
 * Provides a terminal-based menu interface similar to the legacy CLI
 */

import * as readline from 'readline';
import { DockerPilot } from '../core/DockerPilot';
import { Logger } from '../utils/Logger';
import { DockerPilotConfig } from '../types';
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
        category: '🚀 ' + this.i18n.t('command.basic'),
        action: async () => {
          console.log(this.i18n.t('command.detecting_services'));
          await this.dockerPilot.detectServices();
          console.log(this.i18n.t('command.detection_complete'));
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
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.stop_all'),
        category: '🚀 ' + this.i18n.t('command.basic'),
        action: async () => {
          await this.dockerPilot.executeCommand('down', []);
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.restart_all'),
        category: '🚀 ' + this.i18n.t('command.basic'),
        action: async () => {
          await this.dockerPilot.executeCommand('restart', []);
          await this.displayServiceStatus();
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
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.logs_all'),
        category: '🚀 ' + this.i18n.t('command.basic'),
        action: async () => {
          this.logger.info(this.i18n.t('command.stop_logs_tip'));
          this.logger.newLine();
          await this.dockerPilot.executeCommand('logs', ['--follow']);
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.status'),
        category: '🚀 ' + this.i18n.t('command.basic'),
        action: async () => {
          await this.dockerPilot.executeCommand('status', []);
        }
      }
    );    // Advanced commands
    options.push(
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.shell'),
        category: '🛠️ ' + this.i18n.t('command.advanced'),
        action: async () => {
          const services = Object.keys(config.services);
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
          }

          this.logger.info(this.i18n.t('command.opening_shell', { service: serviceName }));
          this.logger.info(this.i18n.t('command.shell_tip'));
          this.logger.newLine();

          await this.dockerPilot.executeCommand('shell', [serviceName]);
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.health'),
        category: '🛠️ ' + this.i18n.t('command.advanced'),        action: async () => {
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
        action: async () => {
          await this.dockerPilot.executeCommand('config', ['--show']);
        }
      },
      {
        key: (optionKey++).toString(),
        label: this.i18n.t('command.advanced_settings'),
        category: '⚙️ ' + this.i18n.t('command.maintenance'),
        action: async () => {
          await this.showAdvancedSettings();
        }
      }
    );    // Service-specific commands
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
        },
        {
          key: (optionKey++).toString(),
          label: this.i18n.t('command.restart_service', { service: serviceName }),
          category: `🔧 ${serviceDisplayName}`,
          action: async () => {
            await this.dockerPilot.executeCommand('restart', [serviceName]);
            await this.displayServiceStatus(serviceName);
          }
        },
        {
          key: (optionKey++).toString(),
          label: this.i18n.t('command.logs_service', { service: serviceName }),
          category: `🔧 ${serviceDisplayName}`,
          action: async () => {
            this.logger.info(this.i18n.t('command.showing_logs', { service: serviceName }));
            this.logger.info(this.i18n.t('command.press_ctrl_c'));
            this.logger.newLine();
            await this.dockerPilot.executeCommand('logs', [serviceName, '--follow']);
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
  }
  /**
   * Auto-detect docker-compose files and suggest setup
   */
  private async autoDetectProject(): Promise<void> {
    try {
      this.updateLanguage();

      const fs = require('fs');
      const path = require('path');
      const cwd = process.cwd();

      // Check for docker-compose files
      const composeFiles = [
        'docker-compose.yml',
        'docker-compose.yaml',
        'compose.yml',
        'compose.yaml',
        'docker-compose.dev.yml',
        'docker-compose.prod.yml'
      ];

      const foundFiles = composeFiles.filter(file =>
        fs.existsSync(path.join(cwd, file))
      );

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

      if (foundFiles.length > 1) {
        console.log(this.i18n.t('autodetect.multiple_compose_found'));
        foundFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file}`);
        });        console.log(this.i18n.t('autodetect.using_first_default'));
      } else {
        console.log(this.i18n.t('autodetect.compose_found', { file: foundFiles[0] || '' }));
      }

      // Try to auto-detect services
      await this.dockerPilot.detectServices();

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
}
