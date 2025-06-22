/**
 * Compose Command - Enhanced Docker Compose file management
 * Provides commands for discovering, analyzing, and managing docker-compose files
 */

import { BaseCommand } from './BaseCommand';
import { CommandResult } from '../types';
import { FileUtils } from '../utils/FileUtils';
import * as path from 'path';
import * as fs from 'fs';

export class ComposeCommand extends BaseCommand {
  private fileUtils: FileUtils;

  constructor(context: any) {
    super(
      'compose',
      'Enhanced Docker Compose file management',
      'Provides commands for discovering, analyzing, and managing docker-compose files',
      context
    );
    this.fileUtils = new FileUtils();
    this.initializeI18n();
  }  private initializeI18n(): void {
    const config = this.context.config;
    if (config?.language) {
      this.i18n.setLanguage(config.language);
    }
  }

  override async execute(args: string[]): Promise<CommandResult> {
    const subcommand = args[0] || 'list';

    try {
      switch (subcommand) {
        case 'list':
        case 'ls':
          return await this.listComposeFiles(args.slice(1));

        case 'find':
        case 'search':
          return await this.findComposeFiles(args.slice(1));

        case 'analyze':
        case 'info':
          return await this.analyzeComposeFile(args.slice(1));

        case 'validate':
          return await this.validateComposeFile(args.slice(1));

        case 'services':
          return await this.listServices(args.slice(1));
          case 'help':
          this.showHelp();
          return {
            success: true,
            output: this.i18n.t('compose.help.displayed'),
            error: '',
            executionTime: 0
          };

        default:
          return {
            success: false,
            output: '',
            error: this.i18n.t('error.unknown_subcommand', { command: subcommand }),
            executionTime: 0
          };
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: 0
      };
    }
  }

  private async listComposeFiles(args: string[]): Promise<CommandResult> {
    const startTime = Date.now();
    const searchDir = args[0] || process.cwd();
    const includeVariants = args.includes('--variants') || args.includes('-v');
    const maxDepth = this.extractDepthOption(args) || 6;

    try {
      const foundFiles = await this.fileUtils.findDockerComposeFilesWithInfo(searchDir, {
        maxDepth,
        includeVariants,
        includeEmptyFiles: false
      });

      if (foundFiles.length === 0) {
        return {
          success: true,
          output: this.i18n.t('compose.no_files_found'),
          error: '',
          executionTime: Date.now() - startTime
        };
      }

      let output = this.i18n.t('compose.found_files_summary', { count: foundFiles.length }) + '\n\n';

      foundFiles.forEach((file, index) => {
        const envText = file.environment ? ` (${file.environment})` : '';
        const mainFileIndicator = file.isMainFile ? ' 🎯' : '';
        const depthIndicator = file.depth === 0 ? ' 📁' : ` 📂(${file.depth})`;

        output += `${index + 1}. ${file.relativePath}${envText}${mainFileIndicator}${depthIndicator}\n`;
        output += `   📏 ${this.fileUtils.formatFileSize(file.size)} | 📅 ${file.modified.toLocaleDateString()}\n`;
        output += `   🛠️  ${file.serviceCount} ${this.i18n.t('compose.services')}: ${file.services.join(', ') || this.i18n.t('menu.no_services')}\n\n`;
      });

      return {
        success: true,
        output: output.trim(),
        error: '',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: this.i18n.t('error.generic', { message: error instanceof Error ? error.message : String(error) }),
        executionTime: Date.now() - startTime
      };
    }
  }

  private async findComposeFiles(args: string[]): Promise<CommandResult> {
    const startTime = Date.now();
    const searchDir = args[0] || process.cwd();

    try {
      const composeFiles = await this.fileUtils.findDockerComposeFiles(searchDir, {
        maxDepth: 8,
        includeVariants: true
      });

      if (composeFiles.length === 0) {
        return {
          success: true,
          output: this.i18n.t('compose.no_files_found'),
          error: '',
          executionTime: Date.now() - startTime
        };
      }

      const output = composeFiles.map((file, index) =>
        `${index + 1}. ${path.relative(searchDir, file)}`
      ).join('\n');

      return {
        success: true,
        output: `${this.i18n.t('compose.found_files_summary', { count: composeFiles.length })}\n\n${output}`,
        error: '',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: this.i18n.t('error.generic', { message: error instanceof Error ? error.message : String(error) }),
        executionTime: Date.now() - startTime
      };
    }
  }

  private async analyzeComposeFile(args: string[]): Promise<CommandResult> {
    const startTime = Date.now();
    const filePath = args[0];

    if (!filePath) {
      return {
        success: false,
        output: '',
        error: this.i18n.t('error.missing_argument', { argument: 'file_path' }),
        executionTime: Date.now() - startTime
      };
    }

    try {
      if (!(await this.fileUtils.exists(filePath))) {
        return {
          success: false,
          output: '',
          error: this.i18n.t('compose.file_not_found', { file: filePath }),
          executionTime: Date.now() - startTime
        };
      }

      const composeData = await this.fileUtils.readYaml(filePath);
      const stats = fs.statSync(filePath);

      let output = `📄 ${this.i18n.t('compose.file_analysis')}: ${path.basename(filePath)}\n\n`;
      output += `📏 ${this.i18n.t('compose.file_size')}: ${this.fileUtils.formatFileSize(stats.size)}\n`;
      output += `📅 ${this.i18n.t('compose.file_modified')}: ${stats.mtime.toLocaleString()}\n\n`;

      if (composeData.version) {
        output += `🔧 Version: ${composeData.version}\n`;
      }

      if (composeData.services) {
        const services = Object.keys(composeData.services);
        output += `🛠️  ${this.i18n.t('compose.services')} (${services.length}): ${services.join(', ')}\n`;

        // Analyze each service
        for (const [serviceName, serviceConfig] of Object.entries(composeData.services)) {
          output += `\n📦 ${serviceName}:\n`;
          const service = serviceConfig as any;

          if (service.image) {
            output += `   🖼️  Image: ${service.image}\n`;
          }
          if (service.build) {
            output += `   🔨 Build: ${typeof service.build === 'string' ? service.build : service.build.context || '.'}\n`;
          }
          if (service.ports) {
            output += `   🌐 Ports: ${service.ports.join(', ')}\n`;
          }
          if (service.volumes) {
            output += `   💾 Volumes: ${service.volumes.length} volume(s)\n`;
          }
          if (service.environment) {
            const envCount = Array.isArray(service.environment) ? service.environment.length : Object.keys(service.environment).length;
            output += `   🔐 Environment: ${envCount} variable(s)\n`;
          }
          if (service.depends_on) {
            const dependencies = Array.isArray(service.depends_on) ? service.depends_on : Object.keys(service.depends_on);
            output += `   🔗 Dependencies: ${dependencies.join(', ')}\n`;
          }
        }
      }

      if (composeData.networks) {
        const networks = Object.keys(composeData.networks);
        output += `\n🌐 Networks (${networks.length}): ${networks.join(', ')}\n`;
      }

      if (composeData.volumes) {
        const volumes = Object.keys(composeData.volumes);
        output += `💾 Volumes (${volumes.length}): ${volumes.join(', ')}\n`;
      }

      return {
        success: true,
        output: output.trim(),
        error: '',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: this.i18n.t('error.failed_to_analyze', { file: filePath, error: error instanceof Error ? error.message : String(error) }),
        executionTime: Date.now() - startTime
      };
    }
  }

  private async validateComposeFile(args: string[]): Promise<CommandResult> {
    const startTime = Date.now();
    const filePath = args[0];

    if (!filePath) {
      return {
        success: false,
        output: '',
        error: this.i18n.t('error.missing_argument', { argument: 'file_path' }),
        executionTime: Date.now() - startTime
      };
    }

    try {
      // Basic file existence check
      if (!(await this.fileUtils.exists(filePath))) {
        return {
          success: false,
          output: '',
          error: this.i18n.t('compose.file_not_found', { file: filePath }),
          executionTime: Date.now() - startTime
        };
      }

      // Try to parse YAML
      const composeData = await this.fileUtils.readYaml(filePath);

      let output = `✅ ${this.i18n.t('compose.file_valid')}: ${path.basename(filePath)}\n\n`;

      // Basic structure validation
      if (!composeData.services) {
        output += `⚠️  ${this.i18n.t('compose.no_services_warning')}\n`;
      } else {
        const serviceCount = Object.keys(composeData.services).length;
        output += `🛠️  ${serviceCount} ${this.i18n.t('compose.services')} ${this.i18n.t('compose.found')}\n`;
      }

      if (composeData.version) {
        output += `🔧 Version: ${composeData.version}\n`;
      } else {
        output += `⚠️  ${this.i18n.t('compose.no_version_warning')}\n`;
      }

      return {
        success: true,
        output: output.trim(),
        error: '',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: this.i18n.t('compose.file_invalid', { file: filePath, error: error instanceof Error ? error.message : String(error) }),
        executionTime: Date.now() - startTime
      };
    }
  }

  private async listServices(args: string[]): Promise<CommandResult> {
    const startTime = Date.now();
    const filePath = args[0] || await this.findDefaultComposeFile();

    try {
      if (!(await this.fileUtils.exists(filePath))) {
        return {
          success: false,
          output: '',
          error: this.i18n.t('compose.file_not_found', { file: filePath }),
          executionTime: Date.now() - startTime
        };
      }

      const composeData = await this.fileUtils.readYaml(filePath);

      if (!composeData.services) {
        return {
          success: true,
          output: this.i18n.t('compose.no_services_in_file'),
          error: '',
          executionTime: Date.now() - startTime
        };
      }

      const services = Object.keys(composeData.services);
      const output = `🛠️  ${this.i18n.t('compose.services')} in ${path.basename(filePath)} (${services.length}):\n\n${services.map((service, index) => `${index + 1}. ${service}`).join('\n')}`;

      return {
        success: true,
        output,
        error: '',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: this.i18n.t('error.generic', { message: error instanceof Error ? error.message : String(error) }),
        executionTime: Date.now() - startTime
      };
    }
  }

  override showHelp(): void {
    const output = `
${this.i18n.t('cmd.compose.title')}

${this.i18n.t('cmd.compose.usage')}:
  docker-pilot compose <subcommand> [options]

${this.i18n.t('cmd.compose.subcommands')}:
  list, ls         ${this.i18n.t('cmd.compose.list_desc')}
  find, search     ${this.i18n.t('cmd.compose.find_desc')}
  analyze, info    ${this.i18n.t('cmd.compose.analyze_desc')}
  validate         ${this.i18n.t('cmd.compose.validate_desc')}
  services         ${this.i18n.t('cmd.compose.services_desc')}
  help             ${this.i18n.t('cmd.compose.help_desc')}

${this.i18n.t('cmd.compose.options')}:
  --variants, -v   ${this.i18n.t('cmd.compose.variants_desc')}
  --depth <n>      ${this.i18n.t('cmd.compose.depth_desc')}

${this.i18n.t('cmd.compose.examples')}:  docker-pilot compose list
  docker-pilot compose find /path/to/project
  docker-pilot compose analyze docker-compose.yml
  docker-pilot compose list --variants --depth 4
    `.trim();

    console.log(output);
  }
  private extractDepthOption(args: string[]): number | null {
    const depthIndex = args.findIndex(arg => arg === '--depth');
    if (depthIndex !== -1 && depthIndex + 1 < args.length) {
      const depthValue = args[depthIndex + 1];
      if (depthValue) {
        const depth = parseInt(depthValue);
        return isNaN(depth) ? null : depth;
      }
    }
    return null;
  }

  private async findDefaultComposeFile(): Promise<string> {
    const possibleFiles = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml'
    ];

    for (const file of possibleFiles) {
      if (await this.fileUtils.exists(file)) {
        return file;
      }
    }

    return 'docker-compose.yml'; // Default fallback
  }
}
