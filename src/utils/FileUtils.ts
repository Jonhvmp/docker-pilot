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
  }

  /**
   * Create backup of file
   */
  async backupFile(filePath: string, backupDir?: string): Promise<string> {
    try {
      const fileInfo = await this.getFileInfo(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${fileInfo.name}-backup-${timestamp}${fileInfo.extension}`;

      const backupPath = backupDir
        ? path.join(backupDir, backupName)
        : path.join(path.dirname(filePath), backupName);

      await this.copy(filePath, backupPath);
      this.logger.info(`Backup created: ${backupPath}`);

      return backupPath;
    } catch (error) {
      this.logger.error(`Failed to backup file: ${filePath}`, error);
      throw error;
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
