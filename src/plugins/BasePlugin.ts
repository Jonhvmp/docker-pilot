/**
 * Base Plugin class for Docker Pilot
 * Provides common functionality for all plugins
 */

import { Plugin, PluginMetadata, PluginHooks, CommandContext, CommandOptions, CommandResult } from '../types';
import { Logger } from '../utils/Logger';
import { I18n } from '../utils/i18n';

export abstract class BasePlugin implements Plugin {
  protected logger: Logger;
  protected context: CommandContext | null = null;
  protected i18n: I18n;
  public readonly hooks?: PluginHooks;
  public readonly commands?: Record<string, (args: string[], options: CommandOptions) => Promise<CommandResult>>;

  constructor(
    public readonly metadata: PluginMetadata,
    hooks?: PluginHooks,
    commands?: Record<string, (args: string[], options: CommandOptions) => Promise<CommandResult>>
  ) {
    this.logger = new Logger();
    this.i18n = new I18n();
    if (hooks) this.hooks = hooks;
    if (commands) this.commands = commands;
  }
  /**
   * Initialize the plugin
   */
  async initialize(context: CommandContext): Promise<void> {
    this.context = context;

    // Configure i18n based on context config
    if (context.config?.language) {
      this.i18n.setLanguage(context.config.language as any);
    }

    this.logger.debug(this.i18n.t('plugin.initializing', { name: this.metadata.name }));
    await this.onInitialize();
  }
  /**
   * Cleanup the plugin
   */
  async cleanup(): Promise<void> {
    this.logger.debug(this.i18n.t('plugin.cleanup', { name: this.metadata.name }));
    await this.onCleanup();
    this.context = null;
  }
  /**
   * Update plugin configuration
   */
  async updateConfig(config: any): Promise<void> {
    await this.onConfigUpdate(config);
  }

  /**
   * Update language for the plugin
   */
  updateLanguage(language: string): void {
    this.i18n.setLanguage(language as any);
  }

  /**
   * Check if plugin is compatible with Docker Pilot version
   */
  isCompatible(_dockerPilotVersion: string): boolean {
    // Simple version compatibility check
    // In a real implementation, you'd use semver for proper version comparison
    return true;
  }

  /**
   * Get plugin status
   */
  getStatus(): 'active' | 'inactive' | 'error' {
    return this.context ? 'active' : 'inactive';
  }

  /**
   * Called when plugin is initialized
   * Override this method in your plugin
   */
  protected async onInitialize(): Promise<void> {
    // Override in subclass
  }

  /**
   * Called when plugin is being cleaned up
   * Override this method in your plugin
   */
  protected async onCleanup(): Promise<void> {
    // Override in subclass
  }
  /**
   * Called when plugin configuration is updated
   * Override this method in your plugin
   */
  protected async onConfigUpdate(_config: any): Promise<void> {
    // Override in subclass
  }

  /**
   * Helper method to emit events
   */
  protected emit(event: string, data?: any): void {
    // In a real implementation, this would emit events to the Docker Pilot event system
    this.logger.debug(`Plugin ${this.metadata.name} emitted event: ${event}`, data);
  }

  /**
   * Helper method to execute Docker commands
   */
  protected async executeCommand(command: string, args: string[] = []): Promise<any> {
    // In a real implementation, this would use the Docker Pilot command system
    this.logger.debug(`Plugin ${this.metadata.name} executing command: ${command} ${args.join(' ')}`);
    return { success: true, output: '' };
  }

  /**
   * Helper method to get service status
   */
  protected async getServiceStatus(serviceName?: string): Promise<any> {
    // In a real implementation, this would use the Docker Pilot service manager
    this.logger.debug(`Plugin ${this.metadata.name} getting service status for: ${serviceName || 'all'}`);
    return [];
  }

  /**
   * Helper method to log messages
   */
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const prefixedMessage = `[${this.metadata.name}] ${message}`;

    switch (level) {
      case 'debug':
        this.logger.debug(prefixedMessage, data);
        break;
      case 'info':
        this.logger.info(prefixedMessage, data);
        break;
      case 'warn':
        this.logger.warn(prefixedMessage, data);
        break;
      case 'error':
        this.logger.error(prefixedMessage, data);
        break;
    }
  }
}
