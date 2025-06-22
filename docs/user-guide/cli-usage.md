# CLI Usage

Complete guide to using Docker Pilot from the command line.

## Basic Syntax

```bash
docker-pilot [command] [options] [arguments]
```

### Global Options

```bash
--help, -h           Show help information
--version, -v        Show version number
--config <path>      Use custom configuration file
--cwd <path>         Set working directory
--log-level <level>  Set log level (debug, info, warn, error)
--silent             Suppress output
--interactive, -i    Force interactive mode
```

## Commands Overview

### Service Management

| Command | Description | Example |
|---------|-------------|---------|
| `up`, `start` | Start services | `docker-pilot up web api` |
| `down`, `stop` | Stop services | `docker-pilot down --volumes` |
| `restart` | Restart services | `docker-pilot restart web` |
| `status`, `ps` | Show service status | `docker-pilot status --detailed` |

### Development Commands

| Command | Description | Example |
|---------|-------------|---------|
| `logs`, `log` | View service logs | `docker-pilot logs web --follow` |
| `exec` | Execute command in container | `docker-pilot exec web npm test` |
| `shell`, `sh` | Open interactive shell | `docker-pilot shell web` |
| `build` | Build or rebuild services | `docker-pilot build --no-cache` |

### Scaling and Management

| Command | Description | Example |
|---------|-------------|---------|
| `scale` | Scale services | `docker-pilot scale web=3 api=2` |
| `pull` | Pull latest images | `docker-pilot pull --parallel` |
| `clean`, `cleanup` | Clean Docker resources | `docker-pilot clean --all` |

### Compose File Management **NEW**

| Command | Description | Example |
|---------|-------------|---------|
| `compose list` | List docker-compose files | `docker-pilot compose list --variants` |
| `compose find` | Find compose files in directory | `docker-pilot compose find /path/to/project` |
| `compose analyze` | Analyze compose file structure | `docker-pilot compose analyze docker-compose.yml` |
| `compose validate` | Validate compose file syntax | `docker-pilot compose validate --all` |
| `compose services` | List services from compose | `docker-pilot compose services` |

### Configuration

| Command | Description | Example |
|---------|-------------|---------|
| `config` | Manage configuration | `docker-pilot config --show` |

## Detailed Command Reference

### up / start

Start one or more services.

```bash
# Start all services
docker-pilot up

# Start specific services
docker-pilot up web database

# Start with rebuild
docker-pilot up --build

# Start in detached mode
docker-pilot up --detach

# Start with custom compose file
docker-pilot up --file docker-compose.prod.yml
```

**Options:**

- `--build`: Rebuild images before starting
- `--detach, -d`: Run containers in background
- `--file, -f <file>`: Use custom docker-compose file
- `--force-recreate`: Recreate containers even if configuration hasn't changed
- `--no-deps`: Don't start linked services
- `--remove-orphans`: Remove containers for services not defined in compose file

### down / stop

Stop and remove containers.

```bash
# Stop all services
docker-pilot down

# Stop specific services
docker-pilot stop web api

# Stop and remove volumes
docker-pilot down --volumes

# Stop and remove everything
docker-pilot down --volumes --rmi all
```

**Options:**

- `--volumes, -v`: Remove named volumes and anonymous volumes
- `--rmi <type>`: Remove images (all, local)
- `--remove-orphans`: Remove containers for services not in compose file
- `--timeout, -t <seconds>`: Timeout for container shutdown

### logs / log

View and follow service logs.

```bash
# View logs for all services
docker-pilot logs

# View logs for specific service
docker-pilot logs web

# Follow logs in real-time
docker-pilot logs --follow

# Show last 100 lines
docker-pilot logs --tail 100

# Show logs with timestamps
docker-pilot logs --timestamps

# Filter logs by time
docker-pilot logs --since 2h --until 1h
```

**Options:**

- `--follow, -f`: Follow log output
- `--tail <lines>`: Number of lines to show from end of logs
- `--timestamps, -t`: Show timestamps
- `--since <time>`: Show logs since timestamp (e.g., 2h, 30m)
- `--until <time>`: Show logs until timestamp
- `--no-color`: Disable colored output

### exec

Execute commands inside running containers.

```bash
# Run interactive bash shell
docker-pilot exec web bash

# Run command and exit
docker-pilot exec web ls -la

# Run command as specific user
docker-pilot exec --user root web apt update

# Run command with environment variables
docker-pilot exec --env NODE_ENV=test web npm test

# Run command without TTY
docker-pilot exec --no-tty web echo "Hello World"
```

**Options:**

- `--user, -u <user>`: Run as specific user
- `--env, -e <key>=<value>`: Set environment variable
- `--workdir, -w <path>`: Set working directory
- `--no-tty, -T`: Disable pseudo-TTY allocation
- `--interactive, -i`: Keep STDIN open
- `--detach, -d`: Run command in background

### shell / sh

Open an interactive shell in a container.

```bash
# Open default shell (usually bash or sh)
docker-pilot shell web

# Open specific shell
docker-pilot shell --shell zsh web

# Open shell as root user
docker-pilot shell --user root web

# Open shell with custom working directory
docker-pilot shell --workdir /app web
```

**Options:**

- `--shell <shell>`: Shell to use (bash, sh, zsh, fish)
- `--user, -u <user>`: Run as specific user
- `--workdir, -w <path>`: Set working directory

### build

Build or rebuild service images.

```bash
# Build all services
docker-pilot build

# Build specific services
docker-pilot build web api

# Build without cache
docker-pilot build --no-cache

# Build with build arguments
docker-pilot build --build-arg NODE_VERSION=16

# Build in parallel
docker-pilot build --parallel
```

**Options:**

- `--no-cache`: Don't use cache when building
- `--pull`: Always attempt to pull newer image versions
- `--build-arg <key>=<value>`: Set build-time variables
- `--parallel`: Build images in parallel
- `--progress <type>`: Set progress output type (auto, plain, tty)

### scale

Scale services to specified number of replicas.

```bash
# Scale single service
docker-pilot scale web=3

# Scale multiple services
docker-pilot scale web=3 api=2 worker=5

# Scale to zero (stop all replicas)
docker-pilot scale web=0
```

### status / ps

Show status of services.

```bash
# Show basic status
docker-pilot status

# Show detailed status
docker-pilot status --detailed

# Show status in different formats
docker-pilot status --format table
docker-pilot status --format json
docker-pilot status --format yaml

# Show only running services
docker-pilot status --filter status=running

# Show resource usage
docker-pilot status --stats
```

**Options:**

- `--detailed, -d`: Show detailed information
- `--format <format>`: Output format (table, json, yaml)
- `--filter <key>=<value>`: Filter services
- `--stats`: Show resource usage statistics
- `--no-trunc`: Don't truncate output

### pull

Pull service images from registry.

```bash
# Pull all images
docker-pilot pull

# Pull specific service images
docker-pilot pull web api

# Pull images in parallel
docker-pilot pull --parallel

# Pull images quietly
docker-pilot pull --quiet
```

**Options:**

- `--parallel`: Pull images in parallel
- `--quiet, -q`: Suppress output
- `--ignore-pull-failures`: Continue pulling other images if one fails

### clean / cleanup

Clean up Docker resources.

```bash
# Basic cleanup (stopped containers, unused networks)
docker-pilot clean

# Clean everything (containers, images, volumes, networks)
docker-pilot clean --all

# Clean with confirmation prompts
docker-pilot clean --interactive

# Clean specific resource types
docker-pilot clean --containers --images --networks

# Force cleanup without confirmations
docker-pilot clean --force
```

**Options:**

- `--all, -a`: Remove all unused resources
- `--containers`: Remove stopped containers
- `--images`: Remove unused images
- `--volumes`: Remove unused volumes
- `--networks`: Remove unused networks
- `--force, -f`: Don't prompt for confirmation
- `--interactive, -i`: Prompt before each removal

### config

Manage Docker Pilot configuration.

```bash
# Show current configuration
docker-pilot config --show

# Show configuration for specific service
docker-pilot config --show --service web

# Validate configuration
docker-pilot config --validate

# Reset configuration to defaults
docker-pilot config --reset

# Set configuration values
docker-pilot config --set language=pt-br
docker-pilot config --set services.web.port=8080
```

**Options:**

- `--show`: Display current configuration
- `--validate`: Validate configuration file
- `--reset`: Reset to default configuration
- `--set <key>=<value>`: Set configuration value
- `--service <name>`: Target specific service
- `--format <format>`: Output format (json, yaml, table)

## Environment Variables

Docker Pilot recognizes these environment variables:

```bash
# Configuration file location
export DOCKER_PILOT_CONFIG=/path/to/config.json

# Default working directory
export DOCKER_PILOT_CWD=/path/to/project

# Log level
export DOCKER_PILOT_LOG_LEVEL=debug

# Disable colored output
export NO_COLOR=1

# Force language
export DOCKER_PILOT_LANG=pt-br
```

## Configuration File

You can specify a custom configuration file:

```bash
# Use specific config file
docker-pilot --config /path/to/custom.config.json

# Use environment variable
export DOCKER_PILOT_CONFIG=/path/to/custom.config.json
docker-pilot up
```

## Exit Codes

Docker Pilot uses standard exit codes:

- `0`: Success
- `1`: General error
- `2`: Command line usage error
- `125`: Docker daemon error
- `126`: Container command not executable
- `127`: Container command not found
- `130`: Process terminated by Ctrl+C

## Compose File Management (NEW)

The `compose` command provides comprehensive management of docker-compose files with recursive discovery and detailed analysis capabilities.

### compose list

List all docker-compose files found recursively in the project directory.

```bash
# List all compose files with basic information
docker-pilot compose list

# Include environment variants (dev, prod, test)
docker-pilot compose list --variants

# Specify custom search depth
docker-pilot compose list --depth 8

# Search in specific directory
docker-pilot compose list /path/to/project --variants
```

**Output Example:**
```
Found 3 docker-compose files:

1. docker-compose.yml 🎯📁
   📏 2.1 KB | 📅 22/06/2025
   🛠️ 4 services: web, api, database, redis

2. backend/docker-compose.dev.yml (development) 📂(2)
   📏 1.8 KB | 📅 21/06/2025
   🛠️ 2 services: api-dev, database-dev
```

**Options:**
- `--variants, -v`: Include environment variants
- `--depth <n>`: Maximum search depth (default: 6)

### compose find

Search for docker-compose files in a specific directory or project.

```bash
# Find in current directory
docker-pilot compose find

# Find in specific path
docker-pilot compose find /path/to/project

# Simple file path listing
docker-pilot compose find --simple
```

### compose analyze

Perform detailed analysis of a docker-compose file structure.

```bash
# Analyze main compose file (auto-detected)
docker-pilot compose analyze

# Analyze specific file
docker-pilot compose analyze docker-compose.yml

# Analyze with full service details
docker-pilot compose analyze docker-compose.dev.yml --detailed
```

**Analysis Output:**
- File size and modification date
- Compose version
- Services with images, ports, volumes
- Networks and volumes defined
- Dependencies between services
- Environment variables count
- Health check configurations

### compose validate

Validate docker-compose file syntax and structure.

```bash
# Validate main compose file
docker-pilot compose validate

# Validate specific file
docker-pilot compose validate docker-compose.prod.yml

# Validate with detailed error reporting
docker-pilot compose validate --verbose
```

**Validation Checks:**
- YAML syntax validation
- Docker Compose schema compliance
- Service dependency validation
- Port conflict detection
- Required image/build validation
- Environment variable references

### compose services

List all services defined in docker-compose files.

```bash
# List services from main compose file
docker-pilot compose services

# List from specific file
docker-pilot compose services docker-compose.dev.yml

# Include service details
docker-pilot compose services --detailed
```

## Advanced Usage

### Chaining Commands

```bash
# Build, start, and view logs
docker-pilot build && docker-pilot up && docker-pilot logs --follow

# Stop, clean, and restart
docker-pilot down && docker-pilot clean && docker-pilot up
```

### Using with Scripts

```bash
#!/bin/bash

# Development startup script
echo "Starting development environment..."

# Start services
docker-pilot up --build

# Wait for services to be ready
sleep 10

# Run tests
docker-pilot exec web npm test

# Show status
docker-pilot status --detailed
```

### Integration with CI/CD

```yaml
# GitHub Actions example
- name: Start services
  run: docker-pilot up --detach

- name: Wait for services
  run: docker-pilot exec web wget --retry-connrefused --tries=30 --timeout=1 --spider http://localhost:8080

- name: Run tests
  run: docker-pilot exec web npm test

- name: Cleanup
  run: docker-pilot down --volumes
  if: always()
```

## Tips and Best Practices

### 1. Use Aliases

```bash
# Add to your .bashrc or .zshrc
alias dp='docker-pilot'
alias dpu='docker-pilot up'
alias dpd='docker-pilot down'
alias dpl='docker-pilot logs --follow'
alias dps='docker-pilot status'
```

### 2. Project-Specific Scripts

Create a `scripts/` directory in your project:

```bash
# scripts/dev.sh
#!/bin/bash
docker-pilot up --build
docker-pilot logs --follow

# scripts/test.sh
#!/bin/bash
docker-pilot exec web npm test
docker-pilot exec api npm test
```

### 3. Environment Management

```bash
# Development
docker-pilot --config docker-pilot.dev.json up

# Production
docker-pilot --config docker-pilot.prod.json up --detach
```

### 4. Health Checks

```bash
# Check if services are healthy
if docker-pilot status --filter health=healthy --quiet; then
  echo "All services healthy"
else
  echo "Some services unhealthy"
  docker-pilot status --detailed
fi
```

## Troubleshooting

### Common Issues

**Command not found:**
```bash
# Check installation
npm list -g docker-pilot

# Reinstall if needed
npm install -g docker-pilot
```

**Permission denied:**
```bash
# Check Docker permissions
docker info

# Add user to docker group (Linux)
sudo usermod -aG docker $USER
```

**Configuration errors:**
```bash
# Validate configuration
docker-pilot config --validate

# Reset to defaults
docker-pilot config --reset
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Set log level
docker-pilot --log-level debug up

# Use environment variable
export DOCKER_PILOT_LOG_LEVEL=debug
docker-pilot up
```

## What's Next?

- 🎮 Learn about the [Interactive Menu](interactive-menu.md)
- 🔧 Explore [Configuration Files](config-files.md)
- 🌍 Set up [Multi-language Support](i18n.md)
- 🚀 Try [Advanced Features](../advanced/plugins.md)

---

!!! tip "Pro Tip"
    The CLI commands are perfect for automation and scripting, while the interactive menu is great for exploration and daily development tasks. Use both modes to maximize your productivity!
