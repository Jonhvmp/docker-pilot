# Frequently Asked Questions (FAQ)

Common questions and answers about Docker Pilot.

## Installation & Setup

### Q: How do I install Docker Pilot?

**A:** Install Docker Pilot globally using npm:

```bash
npm install -g docker-pilot
```

For other installation methods, see the [Installation Guide](getting-started/installation.md).

### Q: Do I need Docker installed?

**A:** Yes, Docker Pilot requires Docker and Docker Compose to be installed and running. Docker Pilot is a management tool that works with your existing Docker setup.

### Q: What versions of Docker are supported?

**A:** Docker Pilot supports:
- Docker Engine 20.10+
- Docker Compose v2.0+ (recommended) or v1.25+
- Docker Desktop for Windows/Mac

### Q: Can I use Docker Pilot with existing projects?

**A:** Absolutely! Docker Pilot works with any existing `docker-compose.yml` file. Just navigate to your project directory and run `docker-pilot`.

## Basic Usage

### Q: How do I start the interactive menu?

**A:** Simply run `docker-pilot` in your project directory:

```bash
cd your-project
docker-pilot
```

### Q: Can I use Docker Pilot without the interactive menu?

**A:** Yes! Docker Pilot supports both interactive and CLI modes:

```bash
# CLI commands
docker-pilot up          # Start services
docker-pilot down        # Stop services
docker-pilot status      # Check status
docker-pilot logs        # View logs
```

### Q: How do I change the language?

**A:** You can change the language in several ways:

1. **Interactive menu**: Advanced settings → Change language
2. **CLI**: `docker-pilot config --set language=pt-br`
3. **Environment**: `export DOCKER_PILOT_LANG=pt-br`

### Q: What happens on first run?

**A:** On first run, Docker Pilot:
1. Prompts you to select a language
2. Detects your Docker Compose services
3. Creates a `docker-pilot.config.json` configuration file
4. Shows the main interactive menu

## Configuration

### Q: Where is the configuration file stored?

**A:** Docker Pilot creates a `docker-pilot.config.json` file in your project directory. This file contains project-specific settings and service configurations.

### Q: Can I have different configurations for different environments?

**A:** Yes! You can create multiple configuration files:

```bash
docker-pilot.config.json          # Default
docker-pilot.config.dev.json      # Development
docker-pilot.config.prod.json     # Production

# Use specific config
docker-pilot --config docker-pilot.config.dev.json up
```

### Q: How do I reset my configuration?

**A:** Use the reset command:

```bash
docker-pilot config --reset
```

This will restore the default configuration and re-detect your services.

### Q: Can I customize service startup order?

**A:** Yes! Edit your configuration file and set priorities:

```json
{
  "services": {
    "database": { "priority": 1 },
    "api": { "priority": 2 },
    "web": { "priority": 3 }
  }
}
```

Lower numbers start first.

## Troubleshooting

### Q: Docker Pilot says "Docker not running"

**A:** This means Docker daemon is not running. To fix:

**Windows/Mac:** Start Docker Desktop
**Linux:**
```bash
sudo systemctl start docker
# or
sudo service docker start
```

### Q: I get "Permission denied" errors

**A:** This is usually a Docker permissions issue:

**Linux:** Add your user to the docker group:
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

**Windows/Mac:** Make sure Docker Desktop is running with proper permissions.

### Q: Services aren't starting in the right order

**A:** Docker Pilot respects `depends_on` in your docker-compose.yml, but you can also set custom priorities in the configuration file.

### Q: I see mixed languages in the interface

**A:** This might happen if:
1. Language setting is not saved properly
2. You're using an older version
3. Some translations are missing

Try: `docker-pilot config --set language=your-language`

### Q: Commands are slow to execute

**A:** This could be due to:
1. Large Docker images downloading
2. Docker daemon performance issues
3. System resource constraints

Check Docker status with `docker info` and system resources.

## Features & Functionality

### Q: Can I run commands on specific services only?

**A:** Yes! Most commands accept service names:

```bash
docker-pilot up web api          # Start only web and api
docker-pilot restart database    # Restart only database
docker-pilot logs web           # View logs for web only
```

### Q: How do I scale services?

**A:** Use the scale command:

```bash
docker-pilot scale web=3 api=2   # Scale web to 3, api to 2 instances
```

### Q: Can I access container shells?

**A:** Yes! Use the shell command:

```bash
docker-pilot shell web           # Open shell in web service
docker-pilot shell --user root web  # Open shell as root
```

### Q: How do I view real-time logs?

**A:** Use the logs command with --follow:

```bash
docker-pilot logs --follow       # All services
docker-pilot logs web --follow   # Specific service
```

### Q: Can I clean up Docker resources?

**A:** Yes! Docker Pilot includes cleanup commands:

```bash
docker-pilot clean               # Basic cleanup
docker-pilot clean --all         # Remove everything unused
```

## Advanced Usage

### Q: Can I create custom commands?

**A:** Yes! Docker Pilot supports plugins and custom commands. See the [Plugin Development Guide](advanced/plugins.md).

### Q: How do I integrate Docker Pilot with CI/CD?

**A:** Docker Pilot works great in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Start services
  run: docker-pilot up --detach

- name: Run tests
  run: docker-pilot exec web npm test

- name: Cleanup
  run: docker-pilot down --volumes
```

### Q: Can I use Docker Pilot with Docker Swarm?

**A:** Docker Pilot is designed for Docker Compose. For Docker Swarm, you'll need to use `docker stack` commands directly.

### Q: How do I backup my data?

**A:** You can backup volumes and databases:

```bash
# Backup database
docker-pilot exec database pg_dump mydb > backup.sql

# Backup volumes
docker run --rm -v myapp_data:/data -v $(pwd):/backup alpine tar czf /backup/data.tar.gz /data
```

### Q: Can I monitor resource usage?

**A:** Yes! Use the status command:

```bash
docker-pilot status --detailed    # Shows CPU, memory usage
docker-pilot status --stats       # Resource statistics
```

## Comparison with Other Tools

### Q: How is Docker Pilot different from Docker Compose?

**A:** Docker Pilot enhances Docker Compose with:
- Interactive menu interface
- Multi-language support
- Smart service management
- Health monitoring
- Plugin system
- Better error messages

### Q: Should I replace Docker Compose with Docker Pilot?

**A:** No! Docker Pilot works **with** Docker Compose, not instead of it. It uses your existing `docker-compose.yml` files and adds a better interface.

### Q: Can I still use regular Docker Compose commands?

**A:** Absolutely! You can mix Docker Pilot and regular Docker Compose commands:

```bash
docker-pilot up              # Start with Docker Pilot
docker compose logs web      # View logs with compose
docker-pilot down            # Stop with Docker Pilot
```

## Multi-language Support

### Q: What languages are supported?

**A:** Currently supported:
- English (en) - Default
- Portuguese (Brasil) (pt-br) - Complete translation

More languages are planned based on community demand.

### Q: How do I contribute translations?

**A:** See the [Contributing Guide](development/contributing.md) for translation guidelines and requirements.

### Q: Will Docker commands be translated?

**A:** No, Docker commands and output remain in English for consistency. Only the Docker Pilot interface is translated.

## Performance & Limits

### Q: How many services can Docker Pilot handle?

**A:** Docker Pilot can handle as many services as Docker Compose supports. The interface adapts to show large numbers of services efficiently.

### Q: Does Docker Pilot add overhead?

**A:** Minimal overhead. Docker Pilot is a thin wrapper around Docker Compose commands and doesn't impact container performance.

### Q: Can I use Docker Pilot on low-resource systems?

**A:** Yes! Docker Pilot itself is lightweight. The resource usage depends on your Docker containers, not Docker Pilot.

## Getting Help

### Q: Where can I get more help?

**A:** Several resources are available:

- 📖 [Documentation](index.md) - Complete guides and references
- 💬 [GitHub Discussions](https://github.com/jonhvmp/docker-pilot/discussions) - Community Q&A
- 🐛 [Issues](https://github.com/jonhvmp/docker-pilot/issues) - Bug reports and feature requests
- 📧 [Email Support](mailto:support@docker-pilot.dev) - Direct support

### Q: How do I report a bug?

**A:** Create an issue on GitHub with:
1. Docker Pilot version (`docker-pilot --version`)
2. Operating system and Docker version
3. Steps to reproduce the issue
4. Expected vs actual behavior
5. Any error messages or logs

### Q: How do I request a feature?

**A:** Create a feature request on GitHub with:
1. Clear description of the feature
2. Use case and benefits
3. Example of how it would work
4. Any relevant screenshots or mockups

### Q: Is there community support?

**A:** Yes! Join our community:
- GitHub Discussions for questions and sharing
- Discord server for real-time chat (coming soon)
- Regular community calls (announced in discussions)

## Licensing & Commercial Use

### Q: Is Docker Pilot free to use?

**A:** Yes! Docker Pilot is open source under the ISC License, free for both personal and commercial use.

### Q: Can I use Docker Pilot in production?

**A:** Absolutely! Docker Pilot is designed for all environments, from development to production.

### Q: Can I modify Docker Pilot for my needs?

**A:** Yes! Under the ISC License, you can modify, distribute, and even sell modified versions. See [Contributing](development/contributing.md) for guidelines.

---

## Still Have Questions?

If you don't find your answer here:

1. **Search the [documentation](index.md)** - Many topics are covered in detail
2. **Check [GitHub Issues](https://github.com/jonhvmp/docker-pilot/issues)** - Your question might already be answered
3. **Join [GitHub Discussions](https://github.com/jonhvmp/docker-pilot/discussions)** - Ask the community
4. **Create a new issue** - For bugs, feature requests, or documentation improvements

!!! tip "Help Improve This FAQ"
    If you have a question that's not covered here, please let us know! We're always improving this FAQ based on user feedback.
