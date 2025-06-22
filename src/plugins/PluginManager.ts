/**
 * Plugin Manager for Docker Pilot
 * Manages plugin loading, initialization, and lifecycle
 */

import * as path from 'path';
import { Plugin, PluginMetadata, PluginHooks, CommandContext } from '../types';
import { Logger } from '../utils/Logger';
import { FileUtils } from '../utils/FileUtils';
import { I18n } from '../utils/i18n';

export interface PluginManagerOptions {
  pluginDir?: string;
  autoLoad?: boolean;
  enabledPlugins?: string[];
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private logger: Logger;
  private fileUtils: FileUtils;
  private i18n: I18n;
  private options: Required<PluginManagerOptions>;
  private hooks: Map<string, Function[]> = new Map();

  constructor(options: PluginManagerOptions = {}) {
    this.logger = new Logger();
    this.fileUtils = new FileUtils(this.logger);
    this.i18n = new I18n();
    this.options = {
      pluginDir: options.pluginDir || path.join(process.cwd(), 'plugins'),
      autoLoad: options.autoLoad ?? true,
      enabledPlugins: options.enabledPlugins || []
    };
  }  /**
   * Initialize plugin manager
   */
  async initialize(): Promise<void> {
    this.logger.debug(this.i18n.t('plugin.manager_initialized'));

    if (this.options.autoLoad) {
      await this.loadPlugins();
    }
      this.logger.success(this.i18n.t('plugin.manager_initialized'));
  }

  /**
   * Load plugins from directory
   */
  async loadPlugins(): Promise<void> {
    try {      if (!(await this.fileUtils.exists(this.options.pluginDir))) {
        this.logger.debug(this.i18n.t('plugin.dir_not_found', { dir: this.options.pluginDir }));
        return;
      }

      const pluginFiles = await this.fileUtils.findFiles('**/*.js', {
        cwd: this.options.pluginDir
      });

      for (const pluginFile of pluginFiles) {
        try {
          await this.loadPlugin(pluginFile);        } catch (error) {
          this.logger.error(this.i18n.t('plugin.failed_load', { name: pluginFile }), error);
        }
      }    } catch (error) {
      this.logger.error(this.i18n.t('plugin.failed_load'), error);
    }
  }

  /**
   * Load a specific plugin
   */
  async loadPlugin(pluginPath: string): Promise<Plugin> {
    const pluginName = path.basename(pluginPath, '.js');
      // Check if plugin is enabled
    if (this.options.enabledPlugins.length > 0 &&
        !this.options.enabledPlugins.includes(pluginName)) {
      this.logger.debug(this.i18n.t('plugin.not_enabled', { name: pluginName }));
      throw new Error(this.i18n.t('plugin.not_enabled', { name: pluginName }));
    }

    // Dynamic import of plugin
    const pluginModule = await import(pluginPath);
    const PluginClass = pluginModule.default || pluginModule;    if (typeof PluginClass !== 'function') {
      throw new Error(this.i18n.t('plugin.invalid', { name: pluginName }));
    }

    const plugin = new PluginClass() as Plugin;

    // Validate plugin structure
    if (!this.isValidPlugin(plugin)) {
      throw new Error(this.i18n.t('plugin.invalid', { name: pluginName }));
    }// Initialize plugin
    if (plugin.initialize) {
      // Create a minimal context for plugin initialization
      const context: CommandContext = {
        config: { projectName: '', dockerCompose: 'docker compose', configVersion: '1.0', services: {}, plugins: [], cli: {}, backup: {}, monitoring: {}, development: {}, networks: {}, volumes: {} } as any,
        logger: this.logger,
        workingDirectory: process.cwd()
      };
      await plugin.initialize(context);
    }

    // Register plugin hooks
    if (plugin.hooks) {
      this.registerPluginHooks(pluginName, plugin.hooks);
    }    this.plugins.set(pluginName, plugin);
    this.logger.success(this.i18n.t('plugin.loaded', { name: pluginName }));

    return plugin;
  }

  /**
   * Unload a plugin
   */  async unloadPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(this.i18n.t('plugin.not_found', { name: pluginName }));
    }

    // Cleanup plugin
    if (plugin.cleanup) {
      await plugin.cleanup();
    }

    // Unregister hooks
    this.unregisterPluginHooks(pluginName);

    this.plugins.delete(pluginName);
    this.logger.success(this.i18n.t('plugin.unloaded', { name: pluginName }));
  }

  /**
   * Get loaded plugin
   */
  getPlugin(pluginName: string): Plugin | null {
    return this.plugins.get(pluginName) || null;
  }

  /**
   * Get all loaded plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if plugin is loaded
   */
  hasPlugin(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }

  /**
   * Register plugin hooks
   */
  private registerPluginHooks(pluginName: string, hooks: PluginHooks): void {
    for (const [hookName, handler] of Object.entries(hooks)) {
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, []);
      }

      this.hooks.get(hookName)!.push(handler);
      this.logger.debug(`Registered hook: ${hookName} for plugin: ${pluginName}`);
    }
  }
  /**
   * Unregister plugin hooks
   */
  private unregisterPluginHooks(_pluginName: string): void {
    for (const [_hookName, _handlers] of this.hooks.entries()) {
      // Remove handlers that belong to this plugin
      // This is a simplified approach - in a real implementation,
      // you'd need to track which handlers belong to which plugin
      this.hooks.set(_hookName, []);
    }
  }

  /**
   * Execute hook
   */
  async executeHook(hookName: string, ...args: any[]): Promise<any[]> {
    const handlers = this.hooks.get(hookName) || [];
    const results: any[] = [];

    for (const handler of handlers) {
      try {
        const result = await handler(...args);
        results.push(result);
      } catch (error) {
        this.logger.error(`Hook execution failed: ${hookName}`, error);
        results.push(null);
      }
    }

    return results;
  }

  /**
   * Validate plugin structure
   */
  private isValidPlugin(plugin: any): plugin is Plugin {
    return (
      typeof plugin === 'object' &&
      plugin !== null &&
      typeof plugin.metadata === 'object' &&
      typeof plugin.metadata.name === 'string' &&
      typeof plugin.metadata.version === 'string'
    );
  }

  /**
   * Get plugin metadata
   */
  getPluginMetadata(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map(plugin => plugin.metadata);
  }

  /**
   * Enable plugin
   */
  async enablePlugin(pluginName: string): Promise<void> {
    if (!this.options.enabledPlugins.includes(pluginName)) {
      this.options.enabledPlugins.push(pluginName);
    }

    if (!this.hasPlugin(pluginName)) {
      const pluginPath = path.join(this.options.pluginDir, `${pluginName}.js`);
      await this.loadPlugin(pluginPath);
    }
  }

  /**
   * Disable plugin
   */
  async disablePlugin(pluginName: string): Promise<void> {
    const index = this.options.enabledPlugins.indexOf(pluginName);
    if (index > -1) {
      this.options.enabledPlugins.splice(index, 1);
    }

    if (this.hasPlugin(pluginName)) {
      await this.unloadPlugin(pluginName);
    }
  }  /**
   * Update plugin configuration
   */
  async updatePluginConfig(pluginName: string, config: any): Promise<void> {
    const plugin = this.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(this.i18n.t('plugin.not_found', { name: pluginName }));
    }

    // For now, we just log the config update
    // In a full implementation, this would notify the plugin
    this.logger.debug(this.i18n.t('plugin.config_updated', { name: pluginName }), config);
  }

  /**
   * Update language for all plugins
   */
  updateLanguage(language: string): void {
    this.i18n.setLanguage(language as any);

    // Update language for all loaded plugins
    for (const plugin of this.plugins.values()) {
      if (plugin && typeof (plugin as any).updateLanguage === 'function') {
        (plugin as any).updateLanguage(language);
      }
    }
  }

  /**
   * Cleanup all plugins
   */
  async cleanup(): Promise<void> {
    this.logger.debug(this.i18n.t('plugin.cleanup_completed'));

    const pluginNames = Array.from(this.plugins.keys());
    for (const pluginName of pluginNames) {
      try {
        await this.unloadPlugin(pluginName);
      } catch (error) {
        this.logger.error(this.i18n.t('plugin.failed_unload', { name: pluginName }), error);
      }
    }

    this.hooks.clear();
    this.logger.success(this.i18n.t('plugin.cleanup_completed'));
  }
}
