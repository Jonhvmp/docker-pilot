/**
 * Docker Pilot - A powerful, scalable Docker CLI library
 *
 * @description Main entry point for the Docker Pilot library
 * @author Jonhvmp
 * @version 1.0.0
 */

// Core exports
export { DockerPilot } from './core/DockerPilot';
export { ConfigManager } from './core/ConfigManager';
export { CommandRunner } from './core/CommandRunner';
export { ServiceManager } from './core/ServiceManager';

// Types
export * from './types';

// Utils
export { Logger } from './utils/Logger';
export { DockerUtils } from './utils/DockerUtils';
export { FileUtils } from './utils/FileUtils';
export { ValidationUtils } from './utils/ValidationUtils';

// Plugins
export { PluginManager } from './plugins/PluginManager';
export { BasePlugin } from './plugins/BasePlugin';

// Commands
export { BaseCommand } from './commands/BaseCommand';
export * from './commands';

// Default instance for quick usage
import { DockerPilot } from './core/DockerPilot';

/**
 * Default Docker Pilot instance for quick usage
 *
 * @example
 * ```typescript
 * import { dockerPilot } from 'docker-pilot';
 *
 * await dockerPilot.up();
 * await dockerPilot.down();
 * ```
 */
export const dockerPilot = new DockerPilot();

// Version
export const VERSION = '1.0.0';
