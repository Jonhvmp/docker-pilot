# Docker Pilot

<div align="center">
  Advanced Docker Compose management tool with interactive CLI, multi-language support, and plugin system
</div>

---

## What is Docker Pilot?

Docker Pilot is a powerful command-line interface (CLI) tool designed to simplify and enhance your Docker Compose workflow. Whether you're a beginner learning Docker or an experienced developer managing complex multi-container applications, Docker Pilot provides an intuitive interface with advanced features.

### Key Features

- **Interactive Menu**: User-friendly interactive interface for all operations
- **Multi-language Support**: Available in English and Portuguese (Brasil)
- **Plugin System**: Extensible architecture with custom plugins
- **Smart Commands**: Intelligent Docker Compose command management
- **Real-time Monitoring**: Live service status and log monitoring
- **Advanced Configuration**: Flexible configuration system
- **Beautiful CLI**: Colored output with intuitive feedback
- **Service Management**: Individual service control and scaling
- **Health Checks**: Built-in service health monitoring
- **Cleanup Tools**: Smart resource cleanup and optimization

## Why Choose Docker Pilot?

| Traditional Docker Compose | Docker Pilot |
|:---|:---|
| `docker-compose up -d` | Interactive service selection or `docker-pilot up` |
| `docker-compose logs -f service` | `docker-pilot logs service --follow` with smart formatting |
| Complex configuration files | Guided setup with validation |
| Manual service management | Automated health checks and monitoring |
| English only | Multi-language support |
| Basic error messages | Detailed, contextual feedback |

## Quick Start

### Installation

=== "npm"

    ```bash
    npm install -g docker-pilot
    ```

=== "yarn"

    ```bash
    yarn global add docker-pilot
    ```

=== "pnpm"

    ```bash
    pnpm add -g docker-pilot
    ```

### First Run

1. Navigate to your Docker Compose project:

   ```bash
   cd your-docker-project
   ```

2. Start Docker Pilot:

   ```bash
   docker-pilot
   ```

3. Choose your language (first run only)
4. Use the interactive menu or CLI commands

### Example Usage

```bash
# Interactive mode (default)
docker-pilot

# Start all services
docker-pilot up

# View service status
docker-pilot status

# Monitor logs in real-time
docker-pilot logs --follow

# Open shell in a service
docker-pilot shell web

# Scale services
docker-pilot scale web=3 api=2
```

## 🌟 Features Overview

### Interactive Menu System

The interactive menu provides a intuitive way to manage your Docker environment:

- **Quick Setup**: Auto-detect and configure services
- **Service Management**: Start, stop, restart individual or all services
- **Real-time Monitoring**: Live status updates and log streaming
- **Advanced Operations**: Shell access, scaling, health checks
- **Maintenance Tools**: Cleanup, updates, and optimization

### Multi-language Support

Docker Pilot supports multiple languages with automatic detection:

- **English**: Full support with comprehensive documentation
- **Portuguese (Brasil)**: Complete translation including CLI and interactive menu
- **Automatic Detection**: Uses system language or manual selection
- **Runtime Switching**: Change language anytime in settings

### Plugin System

Extend Docker Pilot functionality with plugins:

- **Custom Commands**: Add your own commands
- **Hooks System**: React to Docker Pilot events
- **Service Integration**: Integrate with external services
- **Configuration**: Flexible plugin configuration

## 📚 Documentation Structure

This documentation is organized into several sections:

- **[Getting Started](getting-started/installation.md)**: Installation, setup, and first steps
- **[User Guide](user-guide/cli-usage.md)**: Detailed usage instructions and features
- **[Advanced](advanced/plugins.md)**: Plugin development and advanced configurations
- **[Examples](examples/basic.md)**: Real-world examples and use cases
- **[API Reference](api/core.md)**: Complete API documentation
- **[Development](development/contributing.md)**: Contributing and development guide

## 🤝 Community

- **GitHub**: [docker-pilot repository](https://github.com/jonhvmp/docker-pilot)
- **Issues**: [Report bugs or request features](https://github.com/jonhvmp/docker-pilot/issues)
- **Discussions**: [Community discussions](https://github.com/jonhvmp/docker-pilot/discussions)
- **Contributing**: [How to contribute](development/contributing.md)

## License

Docker Pilot is released under the [ISC License](https://opensource.org/licenses/ISC).

---

**Ready to pilot your Docker containers? Let's get started!**

[Get Started →](getting-started/installation.md){ .md-button .md-button--primary }
[View Examples →](examples/basic.md){ .md-button }
