import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CleanupSummary {
  removed: number;
  spaceSaved: number;
}

interface CleanupResults {
  containers: CleanupSummary;
  images: CleanupSummary;
  volumes: CleanupSummary;
  networks: CleanupSummary;
  cache: CleanupSummary;
}

export class CleanCommand extends BaseCommand {
  constructor(context: CommandContext) {
    super(
      'clean',
      'Clean Docker resources (containers, images, volumes, networks)',
      'docker-pilot clean [options]',
      context
    );
  }

  async execute(args: string[], _options: CommandOptions): Promise<CommandResult> {
    const { options: parsedOptions } = this.parseOptions(args);

    try {
      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      const isDryRun = parsedOptions['dry-run'] || parsedOptions['n'];
      const isDeepClean = parsedOptions['deep'] || parsedOptions['all'];
      const skipConfirmation = parsedOptions['force'] || parsedOptions['f'];

      // Determine what to clean
      const operations = this.getCleanupOperations(parsedOptions);

      if (operations.size === 0) {
        this.logger.warn(this.i18n.t('cmd.clean.no_operations'));
        return this.createSuccessResult();
      }

      // Confirm destructive operation (unless --force or dry-run)
      if (!isDryRun && !skipConfirmation) {
        const message = isDeepClean
          ? this.i18n.t('cmd.clean.confirm_deep')
          : this.i18n.t('cmd.clean.confirm');

        if (!(await this.confirmAction(message))) {
          return this.createSuccessResult(this.i18n.t('cmd.clean.cancelled'));
        }
      }

      if (isDryRun) {
        this.logger.info(this.i18n.t('cmd.clean.dry_run_mode'));
      }

      this.logger.loading(this.i18n.t('cmd.clean.loading'));      const { executionTime } = await this.measureExecutionTime(async () => {
        return await this.executeCleanOperations(operations, isDeepClean, isDryRun);
      });

      this.logger.success(this.i18n.t('cmd.clean.success'));

      return this.createSuccessResult(
        this.i18n.t('cmd.cleanup_success'),
        executionTime
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.i18n.t('cmd.clean.failed', { error: errorMessage }));
      return this.createErrorResult(errorMessage);
    }
  }

  /**
   * Determine which cleanup operations to perform
   */
  private getCleanupOperations(options: Record<string, any>): Set<string> {
    const operations = new Set<string>();

    if (options['containers'] || options['c']) operations.add('containers');
    if (options['images'] || options['i']) operations.add('images');
    if (options['volumes'] || options['v']) operations.add('volumes');
    if (options['networks'] || options['n']) operations.add('networks');
    if (options['cache']) operations.add('cache');
    if (options['all'] || options['a']) {
      operations.add('containers');
      operations.add('images');
      operations.add('volumes');
      operations.add('networks');
      operations.add('cache');
    }

    // Default cleanup if no specific options
    if (operations.size === 0) {
      operations.add('containers');
      operations.add('images');
      operations.add('cache');
    }

    return operations;
  }

  /**
   * Execute clean operations based on selected types
   */
  private async executeCleanOperations(
    operations: Set<string>,
    isDeepClean: boolean,
    isDryRun: boolean
  ): Promise<CleanupResults> {
    const results: CleanupResults = {
      containers: { removed: 0, spaceSaved: 0 },
      images: { removed: 0, spaceSaved: 0 },
      volumes: { removed: 0, spaceSaved: 0 },
      networks: { removed: 0, spaceSaved: 0 },
      cache: { removed: 0, spaceSaved: 0 }
    };

    const totalStartTime = Date.now();

    try {
      if (operations.has('containers')) {
        this.logger.info('🗑️  ' + this.i18n.t('cmd.clean.cleaning_containers'));
        await this.cleanContainers(isDryRun, results.containers);
      }

      if (operations.has('images')) {
        this.logger.info('🖼️  ' + this.i18n.t('cmd.clean.cleaning_images'));
        await this.cleanImages(isDeepClean, isDryRun, results.images);
      }

      if (operations.has('volumes')) {
        this.logger.info('💾 ' + this.i18n.t('cmd.clean.cleaning_volumes'));
        await this.cleanVolumes(isDryRun, results.volumes);
      }

      if (operations.has('networks')) {
        this.logger.info('🌐 ' + this.i18n.t('cmd.clean.cleaning_networks'));
        await this.cleanNetworks(isDryRun, results.networks);
      }

      if (operations.has('cache')) {
        this.logger.info('⚡ ' + this.i18n.t('cmd.clean.cleaning_cache'));
        await this.cleanBuildCache(isDryRun, results.cache);
      }

      const totalTime = Date.now() - totalStartTime;
      this.showCleanupSummary(results, totalTime, isDryRun);

      return results;
    } catch (error) {
      this.logger.error(this.i18n.t('cmd.clean.cleanup_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }

  /**
   * Clean stopped containers
   */
  private async cleanContainers(isDryRun: boolean, summary: CleanupSummary): Promise<void> {
    try {
      const command = isDryRun
        ? 'docker container prune --dry-run --format "{{.ID}}\t{{.Size}}"'
        : 'docker container prune -f --format "{{.ID}}\t{{.Size}}"';

      const result = await this.execDockerCommand(command);

      if (result.stdout) {
        const lines = result.stdout.trim().split('\n').filter(line => line.trim());
        summary.removed = lines.length;

        // Calculate space saved from output
        lines.forEach(line => {
          const parts = line.split('\t');
          if (parts[1]) {
            summary.spaceSaved += this.parseSizeString(parts[1]);
          }
        });
      }

      if (isDryRun && result.stdout) {
        this.logger.info(`  Would remove ${summary.removed} containers`);
      } else if (summary.removed > 0) {
        this.logger.success(`  Removed ${summary.removed} containers`);
      } else {
        this.logger.info('  No containers to remove');
      }
    } catch (error) {
      this.logger.warn(`  Warning: Failed to clean containers - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean unused images
   */
  private async cleanImages(isDeepClean: boolean, isDryRun: boolean, summary: CleanupSummary): Promise<void> {
    try {
      const baseCommand = isDeepClean ? 'docker image prune -a' : 'docker image prune';
      const command = isDryRun
        ? `${baseCommand} --dry-run --format "{{.ID}}\t{{.Size}}"`
        : `${baseCommand} -f --format "{{.ID}}\t{{.Size}}"`;

      const result = await this.execDockerCommand(command);

      if (result.stdout) {
        const lines = result.stdout.trim().split('\n').filter(line => line.trim());
        summary.removed = lines.length;

        // Calculate space saved from output
        lines.forEach(line => {
          const parts = line.split('\t');
          if (parts[1]) {
            summary.spaceSaved += this.parseSizeString(parts[1]);
          }
        });
      }

      if (isDryRun && result.stdout) {
        const imageType = isDeepClean ? 'images (including tagged)' : 'dangling images';
        this.logger.info(`  Would remove ${summary.removed} ${imageType}`);
      } else if (summary.removed > 0) {
        this.logger.success(`  Removed ${summary.removed} images`);
      } else {
        this.logger.info('  No images to remove');
      }
    } catch (error) {
      this.logger.warn(`  Warning: Failed to clean images - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean unused volumes
   */
  private async cleanVolumes(isDryRun: boolean, summary: CleanupSummary): Promise<void> {
    try {
      const command = isDryRun
        ? 'docker volume prune --dry-run --format "{{.Name}}\t{{.Size}}"'
        : 'docker volume prune -f --format "{{.Name}}\t{{.Size}}"';

      const result = await this.execDockerCommand(command);

      if (result.stdout) {
        const lines = result.stdout.trim().split('\n').filter(line => line.trim());
        summary.removed = lines.length;

        // Calculate space saved from output (if available)
        lines.forEach(line => {
          const parts = line.split('\t');
          if (parts[1]) {
            summary.spaceSaved += this.parseSizeString(parts[1]);
          }
        });
      }

      if (isDryRun && result.stdout) {
        this.logger.info(`  Would remove ${summary.removed} volumes`);
      } else if (summary.removed > 0) {
        this.logger.success(`  Removed ${summary.removed} volumes`);
      } else {
        this.logger.info('  No volumes to remove');
      }
    } catch (error) {
      this.logger.warn(`  Warning: Failed to clean volumes - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean unused networks
   */
  private async cleanNetworks(isDryRun: boolean, summary: CleanupSummary): Promise<void> {
    try {
      const command = isDryRun
        ? 'docker network prune --dry-run --format "{{.ID}}\t{{.Name}}"'
        : 'docker network prune -f --format "{{.ID}}\t{{.Name}}"';

      const result = await this.execDockerCommand(command);

      if (result.stdout) {
        const lines = result.stdout.trim().split('\n').filter(line => line.trim());
        summary.removed = lines.length;
      }

      if (isDryRun && result.stdout) {
        this.logger.info(`  Would remove ${summary.removed} networks`);
      } else if (summary.removed > 0) {
        this.logger.success(`  Removed ${summary.removed} networks`);
      } else {
        this.logger.info('  No networks to remove');
      }
    } catch (error) {
      this.logger.warn(`  Warning: Failed to clean networks - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean build cache
   */
  private async cleanBuildCache(isDryRun: boolean, summary: CleanupSummary): Promise<void> {
    try {
      const command = isDryRun
        ? 'docker builder prune --dry-run --format "{{.ID}}\t{{.Size}}"'
        : 'docker builder prune -f --format "{{.ID}}\t{{.Size}}"';

      const result = await this.execDockerCommand(command);

      if (result.stdout) {
        const lines = result.stdout.trim().split('\n').filter(line => line.trim());
        summary.removed = lines.length;

        // Calculate space saved from output
        lines.forEach(line => {
          const parts = line.split('\t');
          if (parts[1]) {
            summary.spaceSaved += this.parseSizeString(parts[1]);
          }
        });
      }

      if (isDryRun && result.stdout) {
        this.logger.info(`  Would clean build cache (${this.formatSize(summary.spaceSaved)})`);
      } else if (summary.spaceSaved > 0) {
        this.logger.success(`  Cleaned build cache (${this.formatSize(summary.spaceSaved)})`);
      } else {
        this.logger.info('  No build cache to clean');
      }
    } catch (error) {
      this.logger.warn(`  Warning: Failed to clean build cache - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute Docker command with proper error handling
   */
  private async execDockerCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const result = await execAsync(command, { cwd: this.context.workingDirectory });
      return result;
    } catch (error: any) {
      // Docker prune commands may exit with code 0 but have stderr output
      // Only throw if it's actually an error
      if (error.code && error.code !== 0) {
        throw new Error(`Docker command failed: ${error.message}`);
      }
      return { stdout: error.stdout || '', stderr: error.stderr || '' };
    }
  }

  /**
   * Parse Docker size output (e.g., "1.2GB", "500MB")
   */
  private parseSizeString(sizeStr: string): number {
    if (!sizeStr) return 0;

    const match = sizeStr.match(/(\d+\.?\d*)\s*([KMGT]?B)/i);
    if (!match) return 0;

    const value = parseFloat(match[1] || '0');
    const unit = (match[2] || 'B').toUpperCase();

    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };

    return value * (multipliers[unit] || 1);
  }

  /**
   * Format bytes to human-readable size
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Show cleanup summary
   */
  private showCleanupSummary(results: CleanupResults, totalTime: number, isDryRun: boolean): void {
    this.logger.info('\n📋 Cleanup Summary:');

    const totalRemoved = results.containers.removed + results.images.removed +
                        results.volumes.removed + results.networks.removed + results.cache.removed;
    const totalSpaceSaved = results.containers.spaceSaved + results.images.spaceSaved +
                           results.volumes.spaceSaved + results.networks.spaceSaved + results.cache.spaceSaved;

    if (results.containers.removed > 0) {
      this.logger.info(`  🗑️  Containers: ${results.containers.removed} removed (${this.formatSize(results.containers.spaceSaved)})`);
    }
    if (results.images.removed > 0) {
      this.logger.info(`  🖼️  Images: ${results.images.removed} removed (${this.formatSize(results.images.spaceSaved)})`);
    }
    if (results.volumes.removed > 0) {
      this.logger.info(`  💾 Volumes: ${results.volumes.removed} removed (${this.formatSize(results.volumes.spaceSaved)})`);
    }
    if (results.networks.removed > 0) {
      this.logger.info(`  🌐 Networks: ${results.networks.removed} removed`);
    }
    if (results.cache.spaceSaved > 0) {
      this.logger.info(`  ⚡ Build cache: ${this.formatSize(results.cache.spaceSaved)} cleaned`);
    }

    if (totalRemoved > 0 || totalSpaceSaved > 0) {
      this.logger.info(`\n💾 Total space freed: ${this.formatSize(totalSpaceSaved)}`);
      this.logger.info(`⏱️  Execution time: ${(totalTime / 1000).toFixed(1)}s`);
    } else {
      this.logger.info('  ✨ Nothing to clean - your Docker environment is already tidy!');
    }

    if (isDryRun) {
      this.logger.warn('\n🔍 This was a dry run - no actual changes were made');
    }
  }

  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot clean                   # Basic cleanup (containers, images, cache)
  docker-pilot clean --all             # Full cleanup (everything)
  docker-pilot clean --deep            # Deep cleanup (includes tagged images)
  docker-pilot clean --containers      # Remove stopped containers only
  docker-pilot clean --images          # Remove unused images only
  docker-pilot clean --volumes         # Remove unused volumes only
  docker-pilot clean --networks        # Remove unused networks only
  docker-pilot clean --cache           # Clean build cache only
  docker-pilot clean --dry-run         # Show what would be cleaned
  docker-pilot clean --force           # Skip confirmation prompts

Cleanup Options:
  -c, --containers    Remove stopped containers
  -i, --images        Remove unused images
  -v, --volumes       Remove unused volumes (⚠️  Data loss risk)
  -n, --networks      Remove unused networks
      --cache         Clean build cache
  -a, --all           Clean everything
      --deep          Deep cleanup (includes tagged images)
      --dry-run       Show what would be cleaned without doing it
  -f, --force         Skip confirmation prompts
`);
  }
}
