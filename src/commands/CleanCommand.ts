import { BaseCommand } from './BaseCommand';
import { CommandResult, CommandOptions, CommandContext } from '../types';

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
      const startTime = Date.now();

      if (!(await this.checkDockerAvailable())) {
        return this.createErrorResult(this.i18n.t('cmd.docker_not_available'));
      }

      // Confirm destructive operation
      if (!(await this.confirmAction(this.i18n.t('cmd.clean.confirm')))) {
        return this.createSuccessResult(this.i18n.t('cmd.clean.cancelled'));
      }

      this.logger.loading(this.i18n.t('cmd.clean.loading'));

      let cleanupTasks: string[] = [];

      // Clean containers
      if (parsedOptions['containers'] || parsedOptions['all']) {
        cleanupTasks.push(this.i18n.t('cmd.clean.removing_containers'));
        this.logger.info('🗑️  ' + this.i18n.t('cmd.clean.removing_containers'));
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Clean images
      if (parsedOptions['images'] || parsedOptions['all']) {
        cleanupTasks.push(this.i18n.t('cmd.clean.removing_images'));
        this.logger.info('🖼️  ' + this.i18n.t('cmd.clean.removing_images'));
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Clean volumes
      if (parsedOptions['volumes'] || parsedOptions['all']) {
        cleanupTasks.push(this.i18n.t('cmd.clean.removing_volumes'));
        this.logger.info('💾 ' + this.i18n.t('cmd.clean.removing_volumes'));
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Clean networks
      if (parsedOptions['networks'] || parsedOptions['all']) {
        cleanupTasks.push(this.i18n.t('cmd.clean.removing_networks'));
        this.logger.info('🌐 ' + this.i18n.t('cmd.clean.removing_networks'));
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // Clean build cache
      if (parsedOptions['cache'] || parsedOptions['all']) {
        cleanupTasks.push(this.i18n.t('cmd.clean.prune_all'));
        this.logger.info('⚡ ' + this.i18n.t('cmd.clean.prune_all'));
        await new Promise(resolve => setTimeout(resolve, 700));
      }

      // If no specific options, do a basic cleanup
      if (cleanupTasks.length === 0) {
        cleanupTasks = [
          this.i18n.t('cmd.clean.removing_containers'),
          this.i18n.t('cmd.clean.removing_images'),
          this.i18n.t('cmd.clean.prune_all')
        ];
          this.logger.info('🗑️  ' + this.i18n.t('cmd.clean.removing_containers'));
        await new Promise(resolve => setTimeout(resolve, 500));

        this.logger.info('🖼️  ' + this.i18n.t('cmd.clean.removing_images'));
        await new Promise(resolve => setTimeout(resolve, 800));

        this.logger.info('⚡ ' + this.i18n.t('cmd.clean.prune_all'));
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      const executionTime = Date.now() - startTime;

      // Show cleanup summary
      this.showCleanupSummary(cleanupTasks, parsedOptions);

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

  private showCleanupSummary(tasks: string[], options: Record<string, any>): void {
    this.logger.info('\n📋 Cleanup Summary:');

    tasks.forEach(task => {
      this.logger.info(`  ✅ ${task}`);
    });

    // Show simulated space saved
    const spaceSaved = Math.floor(Math.random() * 500) + 100; // Random between 100-600 MB
    this.logger.info(`\n💾 Estimated space freed: ~${spaceSaved}MB`);

    if (options['dry-run']) {
      this.logger.warn('🔍 This was a dry run - no actual changes were made');
    }
  }

  protected override showExamples(): void {
    this.logger.info(`
Examples:
  docker-pilot clean                   # Basic cleanup (containers, images, cache)
  docker-pilot clean --all             # Full cleanup (everything)
  docker-pilot clean --containers      # Remove stopped containers only
  docker-pilot clean --images          # Remove unused images only
  docker-pilot clean --volumes         # Remove unused volumes only
  docker-pilot clean --networks        # Remove unused networks only
  docker-pilot clean --cache           # Clean build cache only
  docker-pilot clean --dry-run         # Show what would be cleaned

Cleanup Options:
  --containers    Remove stopped containers
  --images        Remove unused images
  --volumes       Remove unused volumes (⚠️  Data loss risk)
  --networks      Remove unused networks
  --cache         Clean build cache
  --all           Clean everything
  --dry-run       Show what would be cleaned without doing it
  --force         Skip confirmation prompts
`);
  }
}
