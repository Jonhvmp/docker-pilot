# Configuration

Learn how to configure Docker Pilot for your specific needs.

## Configuration File

Docker Pilot uses a `docker-pilot.config.json` file to store project-specific settings. This file is automatically created when you first run Docker Pilot in a directory.

### Location

The configuration file is created in your project root directory:

```
your-project/
├── docker-compose.yml
├── docker-pilot.config.json  ← Configuration file
└── ...
```

### Basic Configuration

Here's a basic configuration file:

```json
{
  "projectName": "my-awesome-app",
  "dockerCompose": "docker compose",
  "language": "en",
  "configVersion": "2.0",
  "services": {
    "web": {
      "port": 8080,
      "healthCheck": true,
      "priority": 1
    },
    "api": {
      "port": 3000,
      "healthCheck": true,
      "priority": 2
    },
    "database": {
      "port": 5432,
      "healthCheck": true,
      "priority": 3
    }
  }
}
```

## Configuration Options

### Core Settings

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `projectName` | string | Display name for your project | Directory name |
| `dockerCompose` | string | Docker Compose command to use | `"docker compose"` |
| `language` | string | Interface language (`en` or `pt-br`) | System language |
| `configVersion` | string | Configuration file version | `"2.0"` |

### Service Configuration

Each service in your Docker Compose file can have specific settings:

```json
{
  "services": {
    "service-name": {
      "port": 8080,
      "healthCheck": true,
      "priority": 1,
      "autoStart": true,
      "environment": {
        "NODE_ENV": "development"
      },
      "volumes": ["./data:/app/data"],
      "scaling": {
        "min": 1,
        "max": 5,
        "default": 1
      }
    }
  }
}
```

#### Service Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `port` | number | Main port for the service | Auto-detected |
| `healthCheck` | boolean | Enable health monitoring | `true` |
| `priority` | number | Startup priority (lower = first) | Order in compose file |
| `autoStart` | boolean | Start with "start all" command | `true` |
| `environment` | object | Additional environment variables | `{}` |
| `volumes` | array | Additional volume mappings | `[]` |
| `scaling` | object | Scaling configuration | Auto-detected |

### Advanced Configuration

#### CLI Settings

```json
{
  "cli": {
    "defaultCommand": "interactive",
    "logLevel": "info",
    "colorOutput": true,
    "showTimestamps": true,
    "confirmDestructive": true
  }
}
```

#### Monitoring Settings

```json
{
  "monitoring": {
    "enabled": true,
    "refreshInterval": 5,
    "alerts": {
      "enabled": true,
      "thresholds": {
        "cpu": 80,
        "memory": 85,
        "disk": 90
      }
    },
    "healthCheck": {
      "interval": 30,
      "timeout": 10,
      "retries": 3
    }
  }
}
```

#### Backup Settings

```json
{
  "backup": {
    "enabled": false,
    "path": "./backups",
    "retention": 7,
    "schedule": "0 2 * * *",
    "compression": true,
    "exclude": ["node_modules", "*.log"]
  }
}
```

#### Development Settings

```json
{
  "development": {
    "hotReload": true,
    "debugMode": false,
    "profileMemory": false,
    "watchFiles": ["src/**/*", "public/**/*"],
    "ignoreFiles": ["**/*.log", "**/node_modules/**"]
  }
}
```

## Environment-Specific Configuration

You can have different configurations for different environments:

### docker-pilot.config.development.json

```json
{
  "extends": "./docker-pilot.config.json",
  "development": {
    "hotReload": true,
    "debugMode": true
  },
  "services": {
    "web": {
      "environment": {
        "NODE_ENV": "development",
        "DEBUG": "*"
      }
    }
  }
}
```

### docker-pilot.config.production.json

```json
{
  "extends": "./docker-pilot.config.json",
  "monitoring": {
    "enabled": true,
    "alerts": {
      "enabled": true
    }
  },
  "services": {
    "web": {
      "scaling": {
        "default": 3,
        "max": 10
      }
    }
  }
}
```

Use specific configurations:

```bash
# Development environment
docker-pilot --config docker-pilot.config.development.json

# Production environment
docker-pilot --config docker-pilot.config.production.json
```

## Configuration Management

### View Current Configuration

```bash
# Show current configuration
docker-pilot config --show

# Show configuration for specific service
docker-pilot config --show --service web

# Show configuration in different formats
docker-pilot config --show --format yaml
docker-pilot config --show --format table
```

### Validate Configuration

```bash
# Validate configuration file
docker-pilot config --validate

# Validate specific configuration file
docker-pilot config --validate --config custom.config.json
```

### Reset Configuration

```bash
# Reset to default configuration
docker-pilot config --reset

# Reset specific service configuration
docker-pilot config --reset --service web
```

## Interactive Configuration

Use the interactive menu to configure settings:

1. Start Docker Pilot: `docker-pilot`
2. Navigate to **Advanced settings** (option 15)
3. Choose **Configuration management**
4. Select the setting you want to modify

### Language Configuration

Change language in the interactive menu:

1. Go to **Advanced settings**
2. Select **Change language**
3. Choose your preferred language
4. Configuration is automatically saved

## Configuration Best Practices

### 1. Version Control

Add configuration to version control but exclude sensitive data:

```gitignore
# Include base configuration
!docker-pilot.config.json

# Exclude environment-specific configs with secrets
docker-pilot.config.local.json
docker-pilot.config.*.local.json
```

### 2. Environment Variables

Use environment variables for sensitive data:

```json
{
  "services": {
    "database": {
      "environment": {
        "POSTGRES_PASSWORD": "${DATABASE_PASSWORD}"
      }
    }
  }
}
```

### 3. Service Priorities

Set startup priorities for dependent services:

```json
{
  "services": {
    "database": { "priority": 1 },
    "redis": { "priority": 2 },
    "api": { "priority": 3 },
    "web": { "priority": 4 }
  }
}
```

### 4. Health Checks

Configure appropriate health checks:

```json
{
  "services": {
    "web": {
      "healthCheck": true,
      "healthCheckUrl": "http://localhost:8080/health"
    }
  }
}
```

## Troubleshooting Configuration

### Common Issues

**Configuration file not found:**
- Run `docker-pilot` in your project directory
- Configuration will be auto-generated

**Invalid JSON syntax:**
```bash
# Validate configuration
docker-pilot config --validate
```

**Service not recognized:**
- Make sure service name matches your docker-compose.yml
- Check spelling and case sensitivity

**Port conflicts:**
- Use different ports for each service
- Check for system processes using the same ports

### Migration from v1.x

If you have an old configuration file:

```bash
# Migrate configuration
docker-pilot config --migrate

# Or start fresh
docker-pilot config --reset
```

## What's Next?

- 🚀 Learn about [First Steps](first-steps.md)
- 🎮 Explore the [Interactive Menu](../user-guide/interactive-menu.md)
- 🔧 Try [Advanced Features](../advanced/plugins.md)

---

!!! tip "Pro Tip"
    Start with the basic configuration and gradually add advanced features as needed. The interactive menu can help you configure most settings without editing JSON files manually!
