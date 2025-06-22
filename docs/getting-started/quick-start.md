# Quick Start

Get up and running with Docker Pilot in just a few minutes!

## Before You Start

Make sure you have:

- ✅ Docker Pilot installed ([Installation Guide](installation.md))
- ✅ Docker and Docker Compose running
- ✅ A Docker Compose project ready

## Your First Docker Pilot Experience

### Step 1: Navigate to Your Project

```bash
cd your-docker-project
```

Your project should have a `docker-compose.yml` file:

```yaml
# Example docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
  database:
    image: postgres:13
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
```

### Step 2: Start Docker Pilot

```bash
docker-pilot
```

On first run, you'll see:

```
🌍 Welcome to Docker Pilot!
Please choose your language / Por favor, escolha seu idioma:

1. English
2. Português (Brasil)

Select option / Selecione a opção (1-2):
```

Choose your preferred language by typing `1` or `2`.

### Step 3: Explore the Interactive Menu

After language selection, you'll see the main menu:

```
============================================================
🐳 Welcome to MyApp Docker Pilot v2.0! 🐳
============================================================

📁 Directory: /path/to/your/project
🔧 Services: web, database

====================================
🚀 Basic Commands
====================================
1. Quick setup (detect services)
2. Start all services
3. Stop all services
4. Restart all services
5. Rebuild and start all services
6. View logs of all services
7. View services status

====================================
🛠️ Advanced Commands
====================================
8. Open shell in service
9. Check services health
10. Monitor in real time
11. Update all images

====================================
⚙️ Maintenance
====================================
12. Clean unused resources
13. Deep clean
14. Show configuration
15. Advanced settings

0. Exit

Choose your option:
```

### Step 4: Try Some Basic Operations

Let's try the most common operations:

#### Start All Services

Type `2` to start all services:

```
🚀 Executing: Start all services
================================

✅ Starting services...
✅ Services started successfully!

Service Status:
┌─────────────┬─────────┬────────────┬───────────────┐
│ Service     │ Status  │ Health     │ Ports         │
├─────────────┼─────────┼────────────┼───────────────┤
│ web         │ running │ healthy    │ 0.0.0.0:8080  │
│ database    │ running │ healthy    │ 5432/tcp      │
└─────────────┴─────────┴────────────┴───────────────┘

Press Enter to continue...
```

#### View Service Status

Type `7` to check service status:

```
🚀 Executing: View services status
==================================

📊 Current Service Status:

✅ web
   Status: running
   Health: healthy
   Uptime: 2 minutes
   Ports: 0.0.0.0:8080->80/tcp

✅ database
   Status: running
   Health: healthy
   Uptime: 2 minutes
   Ports: 5432/tcp

All services are running healthy! 🎉
```

#### View Logs

Type `6` to view logs:

```
🚀 Executing: View logs of all services
=======================================

💡 Press Ctrl+C to stop viewing logs

web_1       | Server started on port 80
database_1  | PostgreSQL init process complete; ready for start up.
database_1  | database system is ready to accept connections
web_1       | GET / 200 - - 15 ms
```

## CLI Mode (Alternative)

You can also use Docker Pilot in CLI mode without the interactive menu:

```bash
# Start all services
docker-pilot up

# Check status
docker-pilot status

# View logs
docker-pilot logs --follow

# Stop all services
docker-pilot down

# Open shell in web service
docker-pilot shell web

# Scale services
docker-pilot scale web=3 database=1
```

## Common First Steps

Here are the most common things you'll want to do:

### 1. Quick Setup

If this is your first time in a project:

1. Choose option `1` (Quick setup)
2. Docker Pilot will detect your services automatically
3. It will create a configuration file for faster subsequent runs

### 2. Development Workflow

For daily development:

```bash
# Start everything
docker-pilot up

# View logs while developing
docker-pilot logs --follow

# Open shell for debugging
docker-pilot shell web

# Restart after code changes
docker-pilot restart web

# Stop everything when done
docker-pilot down
```

### 3. Monitor Services

To keep an eye on your services:

1. Choose option `10` (Monitor in real time)
2. See live updates of service status
3. Press Ctrl+C to stop monitoring

## Configuration

Docker Pilot creates a `docker-pilot.config.json` file in your project:

```json
{
  "projectName": "myapp",
  "dockerCompose": "docker compose",
  "language": "en",
  "services": {
    "web": {
      "port": 8080,
      "healthCheck": true
    },
    "database": {
      "port": 5432,
      "healthCheck": true
    }
  }
}
```

This configuration is automatically generated and can be customized.

## What's Next?

Now that you've got the basics down:

- 📖 Learn about [Configuration](configuration.md) options
- 🎯 Explore [CLI Usage](../user-guide/cli-usage.md) in detail
- 🎮 Master the [Interactive Menu](../user-guide/interactive-menu.md)
- 🌍 Set up [Multi-language Support](../user-guide/i18n.md)
- 🔧 Try [Advanced Features](../advanced/plugins.md)

## Need Help?

- 📋 Check the [FAQ](../faq.md)
- 💬 Join our [Discussions](https://github.com/jonhvmp/docker-pilot/discussions)
- 🐛 Report issues on [GitHub](https://github.com/jonhvmp/docker-pilot/issues)

---

!!! success "Congratulations!"
    You're now ready to use Docker Pilot! The interactive menu makes it easy to manage your Docker services, and the CLI provides powerful automation capabilities.
