/**
 * File system utility functions
 * Provides file and directory operations with error handling
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import * as yaml from 'yaml';
import { Logger } from './Logger';

export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  created: Date;
  modified: Date;
  accessed: Date;
}

export interface DirectoryInfo {
  path: string;
  name: string;
  files: FileInfo[];
  directories: DirectoryInfo[];
  totalFiles: number;
  totalSize: number;
}

export class FileUtils {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }

  /**
   * Check if path exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    try {
      return await fs.readFile(filePath, encoding);
    } catch (error) {
      this.logger.error(`Failed to read file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    try {
      // Ensure directory exists
      await this.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, encoding);
      this.logger.debug(`File written: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to write file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Append to file
   */
  async appendFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    try {
      await fs.appendFile(filePath, content, encoding);
      this.logger.debug(`Content appended to file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to append to file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Read JSON file
   */
  async readJson<T = any>(filePath: string): Promise<T> {
    try {
      return await fs.readJson(filePath);
    } catch (error) {
      this.logger.error(`Failed to read JSON file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Write JSON file
   */
  async writeJson(filePath: string, data: any, options: { spaces?: number } = {}): Promise<void> {
    try {
      await this.ensureDir(path.dirname(filePath));
      await fs.writeJson(filePath, data, { spaces: options.spaces || 2 });
      this.logger.debug(`JSON file written: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to write JSON file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Read YAML file
   */
  async readYaml<T = any>(filePath: string): Promise<T> {
    try {
      const content = await this.readFile(filePath);
      return yaml.parse(content) as T;
    } catch (error) {
      this.logger.error(`Failed to read YAML file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Write YAML file
   */
  async writeYaml(filePath: string, data: any, options: yaml.ToStringOptions = {}): Promise<void> {
    try {
      await this.ensureDir(path.dirname(filePath));
      const yamlContent = yaml.stringify(data, options);
      await this.writeFile(filePath, yamlContent);
      this.logger.debug(`YAML file written: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to write YAML file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Ensure directory exists
   */
  async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.ensureDir(dirPath);
    } catch (error) {
      this.logger.error(`Failed to ensure directory: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * Remove file or directory
   */
  async remove(targetPath: string): Promise<void> {
    try {
      await fs.remove(targetPath);
      this.logger.debug(`Removed: ${targetPath}`);
    } catch (error) {
      this.logger.error(`Failed to remove: ${targetPath}`, error);
      throw error;
    }
  }

  /**
   * Copy file or directory
   */
  async copy(src: string, dest: string, options: fs.CopyOptions = {}): Promise<void> {
    try {
      await fs.copy(src, dest, options);
      this.logger.debug(`Copied: ${src} -> ${dest}`);
    } catch (error) {
      this.logger.error(`Failed to copy: ${src} -> ${dest}`, error);
      throw error;
    }
  }

  /**
   * Move file or directory
   */
  async move(src: string, dest: string): Promise<void> {
    try {
      await fs.move(src, dest);
      this.logger.debug(`Moved: ${src} -> ${dest}`);
    } catch (error) {
      this.logger.error(`Failed to move: ${src} -> ${dest}`, error);
      throw error;
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const stats = await fs.stat(filePath);
      const parsedPath = path.parse(filePath);

      return {
        path: filePath,
        name: parsedPath.name,
        extension: parsedPath.ext,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime
      };
    } catch (error) {
      this.logger.error(`Failed to get file info: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string, recursive: boolean = false): Promise<string[]> {
    try {
      if (recursive) {
        const pattern = path.join(dirPath, '**', '*');
        return await glob(pattern, { dot: true });
      } else {
        const items = await fs.readdir(dirPath);
        return items.map(item => path.join(dirPath, item));
      }
    } catch (error) {
      this.logger.error(`Failed to list directory: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * Get directory information with detailed file info
   */
  async getDirectoryInfo(dirPath: string): Promise<DirectoryInfo> {
    try {
      const items = await fs.readdir(dirPath);
      const files: FileInfo[] = [];
      const directories: DirectoryInfo[] = [];
      let totalFiles = 0;
      let totalSize = 0;

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isFile()) {
          const fileInfo = await this.getFileInfo(itemPath);
          files.push(fileInfo);
          totalFiles++;
          totalSize += fileInfo.size;
        } else if (stats.isDirectory()) {
          const subDirInfo = await this.getDirectoryInfo(itemPath);
          directories.push(subDirInfo);
          totalFiles += subDirInfo.totalFiles;
          totalSize += subDirInfo.totalSize;
        }
      }

      return {
        path: dirPath,
        name: path.basename(dirPath),
        files,
        directories,
        totalFiles,
        totalSize
      };
    } catch (error) {
      this.logger.error(`Failed to get directory info: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * Find files by pattern
   */
  async findFiles(pattern: string, options: { cwd?: string; ignore?: string[] } = {}): Promise<string[]> {
    try {
      const globOptions: any = {
        cwd: options.cwd || process.cwd(),
        dot: true,
        absolute: true
      };

      if (options.ignore) {
        globOptions.ignore = options.ignore;
      }

      return await glob(pattern, globOptions);
    } catch (error) {
      this.logger.error(`Failed to find files with pattern: ${pattern}`, error);
      throw error;
    }
  }

  /**
   * Find Docker-related files
   */
  async findDockerFiles(baseDir: string = process.cwd()): Promise<{
    dockerfiles: string[];
    composeFiles: string[];
    dockerignore: string[];
  }> {
    const dockerfiles = await this.findFiles('**/Dockerfile*', {
      cwd: baseDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    const composeFiles = await this.findFiles('**/docker-compose*.{yml,yaml}', {
      cwd: baseDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    const dockerignore = await this.findFiles('**/.dockerignore', {
      cwd: baseDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    return {
      dockerfiles,
      composeFiles,
      dockerignore
    };
  }
  /**
   * Find Docker Compose files recursively with enhanced search
   */
  async findDockerComposeFiles(startDir?: string, options?: {
    maxDepth?: number;
    includeVariants?: boolean;
    skipDirectories?: string[];
  }): Promise<string[]> {
    const searchDir = startDir || process.cwd();
    const composeFiles: string[] = [];
    const maxDepth = options?.maxDepth || 6;
    const includeVariants = options?.includeVariants !== false;
    const additionalSkipDirs = options?.skipDirectories || [];

    const composeFilenames = [
      // Main compose files
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml',
    ];

    if (includeVariants) {
      composeFilenames.push(
        // Environment variants
        'docker-compose.dev.yml',
        'docker-compose.dev.yaml',
        'docker-compose.development.yml',
        'docker-compose.development.yaml',
        'docker-compose.prod.yml',
        'docker-compose.prod.yaml',
        'docker-compose.production.yml',
        'docker-compose.production.yaml',
        'docker-compose.local.yml',
        'docker-compose.local.yaml',
        'docker-compose.test.yml',
        'docker-compose.test.yaml',
        'docker-compose.testing.yml',
        'docker-compose.testing.yaml',
        'docker-compose.staging.yml',
        'docker-compose.staging.yaml',
        'docker-compose.override.yml',
        'docker-compose.override.yaml',
        // Alternative formats
        'compose.dev.yml',
        'compose.dev.yaml',
        'compose.prod.yml',
        'compose.prod.yaml',
        'compose.local.yml',
        'compose.local.yaml',
        'compose.test.yml',
        'compose.test.yaml'
      );
    }

    const searchRecursively = async (dir: string, currentDepth: number = 0): Promise<void> => {
      if (currentDepth > maxDepth) return;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isFile() && composeFilenames.includes(entry.name)) {
            composeFiles.push(fullPath);
          } else if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name, additionalSkipDirs)) {
            await searchRecursively(fullPath, currentDepth + 1);
          }
        }
      } catch (error) {
        this.logger.debug(`Failed to read directory ${dir}:`, error);
      }
    };

    await searchRecursively(searchDir);
    return composeFiles;
  }
  /**
   * Check if directory should be skipped during Docker Compose search
   */
  private shouldSkipDirectory(dirName: string, additionalSkipDirs: string[] = []): boolean {
    const skipDirectories = [
      'node_modules',
      '.git',
      '.vscode',
      '.idea',
      'dist',
      'build',
      'target',
      'out',
      'tmp',
      'temp',
      '.next',
      '.nuxt',
      'coverage',
      '__pycache__',
      '.pytest_cache',
      'venv',
      'env',
      '.env',
      'vendor',
      'logs',
      '.docker',
      'bin',
      'obj',
      '.vs',
      'packages',
      'bower_components',
      '.sass-cache',
      '.gradle',
      '.mvn',
      'target'
    ];

    const allSkipDirectories = [...skipDirectories, ...additionalSkipDirs];
    return allSkipDirectories.includes(dirName) || dirName.startsWith('.');
  }
  /**
   * Find all Docker Compose files with detailed information and enhanced search
   */
  async findDockerComposeFilesWithInfo(startDir?: string, options?: {
    maxDepth?: number;
    includeVariants?: boolean;
    skipDirectories?: string[];
    includeEmptyFiles?: boolean;
  }): Promise<Array<{
    path: string;
    relativePath: string;
    filename: string;
    directory: string;
    size: number;
    modified: Date;
    hasServices: boolean;
    serviceCount: number;
    services: string[];
    depth: number;
    environment?: string | undefined;
    isMainFile: boolean;
    priority: number;
  }>> {
    const searchDir = startDir || process.cwd();
    const composeFiles = await this.findDockerComposeFiles(searchDir, options);
    const filesWithInfo = [];

    this.logger.debug(`Found ${composeFiles.length} docker-compose files to analyze`);

    for (const filePath of composeFiles) {
      try {
        const stats = await fs.stat(filePath);
        const relativePath = path.relative(searchDir, filePath);
        const filename = path.basename(filePath);
        const directory = path.dirname(filePath);

        // Skip empty files unless explicitly requested
        if (!options?.includeEmptyFiles && stats.size === 0) {
          this.logger.debug(`Skipping empty file: ${relativePath}`);
          continue;
        }

        // Calculate depth level
        const depth = relativePath.split(path.sep).length - 1;

        // Determine environment and priority
        const environment = this.extractEnvironmentFromFilename(filename);
        const isMainFile = this.isMainComposeFile(filename);

        // Try to read and parse the compose file
        let hasServices = false;
        let serviceCount = 0;
        let services: string[] = [];

        try {
          const composeData = await this.readYaml(filePath);
          if (composeData.services && typeof composeData.services === 'object') {
            hasServices = true;
            services = Object.keys(composeData.services);
            serviceCount = services.length;
          }
        } catch (error) {
          this.logger.debug(`Failed to parse compose file ${filePath}:`, error);
        }

        // Calculate priority score (lower is better)
        let priority = 0;
        priority += depth * 10; // Prefer files closer to root
        priority += isMainFile ? 0 : 5; // Prefer main files over variants
        priority += serviceCount > 0 ? 0 : 20; // Prefer files with services
        priority -= serviceCount; // More services = higher priority (lower score)

        filesWithInfo.push({
          path: filePath,
          relativePath,
          filename,
          directory,
          size: stats.size,
          modified: stats.mtime,
          hasServices,
          serviceCount,
          services,
          depth,
          environment,
          isMainFile,
          priority
        });
      } catch (error) {
        this.logger.debug(`Failed to get info for compose file ${filePath}:`, error);
      }
    }

    // Sort by priority (lower priority number = higher importance)
    return filesWithInfo.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // If same priority, sort alphabetically
      return a.relativePath.localeCompare(b.relativePath);
    });
  }

  /**
   * Extract environment type from compose filename
   */
  private extractEnvironmentFromFilename(filename: string): string | undefined {
    const envPatterns = {
      'dev': /\.(dev|development)\./,
      'prod': /\.(prod|production)\./,
      'test': /\.(test|testing)\./,
      'staging': /\.staging\./,
      'local': /\.local\./,
      'override': /\.override\./
    };

    for (const [env, pattern] of Object.entries(envPatterns)) {
      if (pattern.test(filename)) {
        return env;
      }
    }

    return undefined;
  }

  /**
   * Check if filename is a main compose file (not an environment variant)
   */
  private isMainComposeFile(filename: string): boolean {
    const mainFiles = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml'
    ];

    return mainFiles.includes(filename);
  }

  /**
   * Check if file is empty
   */
  async isEmpty(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size === 0;
    } catch (error) {
      this.logger.error(`Failed to check if file is empty: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);

    return `${size.toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Watch file or directory for changes
   */
  watchPath(targetPath: string, callback: (eventType: string, filename: string | null) => void): fs.FSWatcher {
    this.logger.debug(`Watching path: ${targetPath}`);
    return fs.watch(targetPath, { recursive: true }, callback);
  }  /**
   * Create backup of file (maintains only one backup)
   */
  async backupFile(filePath: string, backupDir?: string): Promise<string> {
    try {
      const fileInfo = await this.getFileInfo(filePath);
      const backupName = `${fileInfo.name}.backup${fileInfo.extension}`;

      const backupPath = backupDir
        ? path.join(backupDir, backupName)
        : path.join(path.dirname(filePath), backupName);

      // Remove existing backup if it exists to avoid accumulation
      if (await this.exists(backupPath)) {
        await fs.remove(backupPath);
        this.logger.debug(`Removed existing backup: ${backupPath}`);
      }

      await this.copy(filePath, backupPath);
      this.logger.info(`Backup created: ${backupPath}`);

      return backupPath;
    } catch (error) {
      this.logger.error(`Failed to backup file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Clean old backup files with timestamp pattern
   */
  async cleanOldBackups(directory: string, pattern: string = '*-backup-*'): Promise<void> {
    try {
      const glob = require('glob');
      const backupFiles = glob.sync(path.join(directory, pattern));

      for (const backupFile of backupFiles) {
        await fs.remove(backupFile);
        this.logger.debug(`Removed old backup: ${backupFile}`);
      }

      if (backupFiles.length > 0) {
        this.logger.info(`Cleaned ${backupFiles.length} old backup files`);
      }
    } catch (error) {
      this.logger.error(`Failed to clean old backups in: ${directory}`, error);
    }
  }

  /**
   * Clean directory (remove all contents)
   */
  async cleanDirectory(dirPath: string): Promise<void> {
    try {
      await fs.emptyDir(dirPath);
      this.logger.debug(`Directory cleaned: ${dirPath}`);
    } catch (error) {
      this.logger.error(`Failed to clean directory: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * Get temporary file path
   */
  getTempPath(prefix: string = 'docker-pilot', extension: string = '.tmp'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `${prefix}-${timestamp}-${random}${extension}`;

    return path.join(require('os').tmpdir(), filename);
  }

  /**
   * Resolve path relative to current working directory
   */
  resolvePath(inputPath: string, basePath: string = process.cwd()): string {
    if (path.isAbsolute(inputPath)) {
      return inputPath;
    }
    return path.resolve(basePath, inputPath);
  }

  /**
   * Check if path is within base directory (security check)
   */
  isPathSafe(targetPath: string, basePath: string): boolean {
    const resolvedTarget = path.resolve(targetPath);
    const resolvedBase = path.resolve(basePath);

    return resolvedTarget.startsWith(resolvedBase);
  }

  /**
   * Get relative path from base
   */
  getRelativePath(targetPath: string, basePath: string = process.cwd()): string {
    return path.relative(basePath, targetPath);
  }

  /**
   * Normalize path separators
   */
  normalizePath(inputPath: string): string {
    return path.normalize(inputPath).replace(/\\/g, '/');
  }
}
