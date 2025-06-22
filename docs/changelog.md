# Changelog

All notable changes to Docker Pilot are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete documentation with MkDocs
- Multi-language documentation support
- Interactive examples and tutorials
- Plugin development guides
- API reference documentation

### Changed
- Improved documentation structure
- Enhanced getting started experience
- Better code examples

## [2.0.1] - 2025-06-22

### Added
- 📄 **Enhanced Docker Compose File Management**
  - New `compose` command with comprehensive subcommands (`list`, `find`, `analyze`, `validate`, `services`)
  - Recursive docker-compose file discovery with configurable depth (up to 6 levels by default)
  - Smart file prioritization (main files, root directory preference, file size, modification date)
  - Environment variant detection (dev, prod, test, staging)
  - Detailed file analysis with service count, dependencies, and configuration details
  - Real-time file information display (size, modification date, environment type)

- 🎯 **Intelligent Project Auto-Detection**
  - Automatic scanning of project directory structure on startup
  - Interactive file selection for multi-compose projects
  - Visual indicators for main files (🎯), directory depth (📁📂), and file types
  - Support for compose file variants and overrides
  - Enhanced project setup with better user guidance

- 🖥️ **Interactive Menu Improvements**
  - New "Compose Files Management" category in interactive menu
  - Real-time compose file analysis from menu interface
  - Enhanced file selection with detailed information display
  - Improved navigation with contextual help and file details
  - Better error handling and user feedback

- 🌐 **Extended i18n Support**
  - Complete translation of all new compose management features
  - Context-aware error messages and help text
  - Localized file information display
  - Multi-language support for technical terms and file analysis

### Improved
- **FileUtils Enhancement**: Upgraded with async methods for better performance
- **Better Error Handling**: More descriptive error messages with context
- **Performance Optimization**: Efficient file scanning with smart caching
- **Code Organization**: Better separation of concerns with dedicated ComposeCommand

### Technical
- New `ComposeCommand` class with proper inheritance from `BaseCommand`
- Enhanced `FileUtils` with recursive file discovery methods
- Improved `InteractiveMenu` with dynamic compose file integration
- Updated type definitions for compose file information
- Comprehensive test coverage for new features

## [2.0.0] - 2025-06-22

### Added
- 🌍 **Multi-language Support (i18n)**
  - Complete Portuguese (Brasil) translation
  - Automatic language detection
  - Runtime language switching
  - Language selection on first run
  - Context-aware translations with parameter interpolation

- 🎮 **Enhanced Interactive Menu**
  - Language selection prompt on first run
  - Advanced settings menu with language options
  - Improved navigation and user experience
  - Better error handling and feedback

- 🔌 **Plugin System Integration**
  - i18n support for plugins
  - Language propagation to all components
  - BasePlugin and PluginManager enhancements

- 🛡️ **Validation System**
  - Comprehensive configuration validation
  - i18n validation error messages
  - Business rule validation
  - Docker Compose structure validation

- 📊 **Improved Service Management**
  - Better service status reporting
  - Enhanced health check integration
  - Priority-based service startup
  - Real-time monitoring improvements

### Changed
- **Breaking**: Updated configuration file structure
- **Breaking**: Refactored command API for better consistency
- Enhanced CLI output with better formatting and colors
- Improved error messages with actionable suggestions
- Better Docker integration and compatibility
- More robust file and configuration handling

### Fixed
- Parameter interpolation in i18n messages
- Service startup order reliability
- Configuration file validation issues
- Memory leaks in interactive menu
- Docker connection handling

### Technical Improvements
- Complete TypeScript integration
- Enhanced logging system
- Better error handling patterns
- Improved test coverage
- Code documentation and examples

## [1.5.0] - 2025-05-15

### Added
- Real-time service monitoring
- Advanced cleanup commands
- Health check integration
- Plugin system foundation
- Configuration management commands

### Changed
- Improved interactive menu navigation
- Better service discovery
- Enhanced Docker Compose integration

### Fixed
- Service startup reliability
- Log viewing improvements
- Configuration file handling

## [1.4.0] - 2025-04-20

### Added
- Service scaling commands
- Shell access to containers
- Log filtering and search
- Custom Docker Compose file support

### Changed
- Faster service detection
- Improved error messages
- Better resource management

### Fixed
- Container shell access issues
- Log streaming reliability
- Service dependency handling

## [1.3.0] - 2025-03-18

### Added
- Interactive shell command
- Service-specific operations
- Advanced logging features
- Configuration validation

### Changed
- Enhanced CLI interface
- Better command organization
- Improved help system

### Fixed
- Docker daemon connection issues
- Service status reporting
- Configuration file parsing

## [1.2.0] - 2025-02-14

### Added
- Service health monitoring
- Backup and restore commands
- Development mode features
- Custom environment support

### Changed
- Streamlined command structure
- Better Docker integration
- Enhanced error handling

### Fixed
- Memory usage optimizations
- Service restart reliability
- Configuration migration issues

## [1.1.0] - 2025-01-10

### Added
- Command line interface
- Service management commands
- Configuration system
- Basic plugin support

### Changed
- Improved interactive experience
- Better service detection
- Enhanced Docker Compose support

### Fixed
- Initial setup issues
- Service dependency resolution
- Configuration file generation

## [1.0.0] - 2024-12-15

### Added
- 🎉 **Initial Release**
- Interactive menu system
- Basic Docker Compose management
- Service start/stop/restart
- Log viewing
- Service status monitoring
- Configuration file management
- Cross-platform support (Windows, macOS, Linux)

### Features
- **Interactive Menu**: User-friendly interface for Docker management
- **Service Management**: Easy start, stop, restart of Docker services
- **Log Viewing**: Real-time and historical log access
- **Status Monitoring**: Live service status and health checks
- **Configuration**: Automatic detection and setup
- **Cross-platform**: Works on Windows, macOS, and Linux

---

## Version History Summary

| Version | Release Date | Key Features |
|---------|--------------|--------------|
| 2.0.1 | 2025-06-22 | Multi-language support, enhanced plugins, validation |
| 1.5.0 | 2025-05-15 | Real-time monitoring, advanced cleanup, health checks |
| 1.4.0 | 2025-04-20 | Service scaling, shell access, log filtering |
| 1.3.0 | 2025-03-18 | Interactive shell, service operations, validation |
| 1.2.0 | 2025-02-14 | Health monitoring, backup/restore, development mode |
| 1.1.0 | 2025-01-10 | CLI interface, service management, configuration |
| 1.0.0 | 2024-12-15 | Initial release, interactive menu, basic features |

## Breaking Changes

### v2.0.0
- **Configuration file structure** changed to support new features
- **Command API** updated for better consistency
- **Plugin interface** enhanced with i18n support
- **Environment variables** for configuration changed

### Migration Guide v1.x → v2.0.0

#### Configuration File
Old configuration files are automatically migrated on first run. If you have custom configurations:

```bash
# Backup your config
cp docker-pilot.config.json docker-pilot.config.json.backup

# Run migration
docker-pilot config --migrate

# Or reset and reconfigure
docker-pilot config --reset
```

#### Plugin Development
If you have custom plugins, update them to use the new i18n system:

```javascript
// Old way
console.log('Plugin executed');

// New way
console.log(this.i18n.t('plugin.executed'));
```

#### Environment Variables
Some environment variables changed:

```bash
# Old
export DOCKER_PILOT_CONFIG_PATH=/path/to/config

# New
export DOCKER_PILOT_CONFIG=/path/to/config
```

## Upgrade Instructions

### From v1.x to v2.0.0

1. **Backup your configuration**:
   ```bash
   cp docker-pilot.config.json backup.config.json
   ```

2. **Update Docker Pilot**:
   ```bash
   npm update -g docker-pilot
   ```

3. **Run migration** (automatic on first run):
   ```bash
   docker-pilot config --migrate
   ```

4. **Select your language** (if not already set):
   ```bash
   docker-pilot config --set language=your-language
   ```

5. **Test your setup**:
   ```bash
   docker-pilot status
   ```

### From v1.4.x to v1.5.0

1. **Update Docker Pilot**:
   ```bash
   npm update -g docker-pilot
   ```

2. **No breaking changes** - existing configurations work as-is

## Development Changelog

For developers interested in internal changes:

### v2.0.0 Development Changes
- **TypeScript**: Full TypeScript conversion completed
- **Testing**: Comprehensive test suite added
- **CI/CD**: GitHub Actions pipeline implemented
- **Documentation**: Complete documentation overhaul
- **Code Quality**: ESLint, Prettier, and strict type checking
- **Architecture**: Modular plugin system with proper interfaces

### v1.5.0 Development Changes
- **Performance**: Significant performance improvements
- **Memory**: Better memory management and leak prevention
- **Error Handling**: Comprehensive error handling system
- **Logging**: Enhanced logging with levels and formatting

## Contributing

We welcome contributions! See our [Contributing Guide](development/contributing.md) for details on:

- 🐛 Reporting bugs
- 💡 Suggesting features
- 🔧 Code contributions
- 🌍 Translation contributions
- 📖 Documentation improvements

## Acknowledgments

Special thanks to all contributors who made Docker Pilot possible:

- **Community**: For feedback, bug reports, and feature suggestions
- **Translators**: For multi-language support
- **Developers**: For code contributions and improvements
- **Documentation**: For examples, guides, and tutorials

---

!!! info "Stay Updated"
    - 📦 **npm**: Get notified of updates with `npm outdated -g docker-pilot`
    - 🐙 **GitHub**: Watch the repository for release notifications
    - 📧 **Newsletter**: Subscribe for major update announcements
    - 💬 **Community**: Join discussions for early previews and feedback
