# Installation

This guide will help you install Docker Pilot on your system.

## Prerequisites

Before installing Docker Pilot, make sure you have:

- **Node.js** (version 16 or higher)
- **npm**, **yarn**, or **pnpm** package manager
- **Docker** and **Docker Compose** installed and running

### Verify Prerequisites

Check if you have the required tools:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Docker version
docker --version

# Check Docker Compose version
docker compose version
```

## Installation Methods

### Method 1: Global Installation (Recommended)

Install Docker Pilot globally to use it from anywhere:

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

### Method 2: Local Installation

Install Docker Pilot locally in your project:

=== "npm"
    ```bash
    npm install docker-pilot
    ```

=== "yarn"
    ```bash
    yarn add docker-pilot
    ```

=== "pnpm"
    ```bash
    pnpm add docker-pilot
    ```

Then run using:
```bash
npx docker-pilot
```

### Method 3: Run without Installation

Use Docker Pilot without installing:

=== "npm"
    ```bash
    npx docker-pilot
    ```

=== "yarn"
    ```bash
    yarn dlx docker-pilot
    ```

=== "pnpm"
    ```bash
    pnpm dlx docker-pilot
    ```

## Verify Installation

After installation, verify that Docker Pilot is working:

```bash
# Check version
docker-pilot --version

# Show help
docker-pilot --help

# Run in current directory
docker-pilot
```

## Platform-Specific Notes

### Windows

- Make sure to run PowerShell or Command Prompt as Administrator if you encounter permission issues
- If using WSL2, install Docker Pilot inside your WSL2 environment

### macOS

- If using Homebrew, you might need to install Node.js first:
  ```bash
  brew install node
  ```

### Linux

- On Ubuntu/Debian, you might need to install Node.js:
  ```bash
  sudo apt update
  sudo apt install nodejs npm
  ```

- On CentOS/RHEL/Fedora:
  ```bash
  sudo dnf install nodejs npm
  ```

## Troubleshooting

### Common Issues

**Permission denied errors on Linux/macOS:**
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Docker not found:**
- Make sure Docker is installed and running
- Verify Docker daemon is accessible: `docker info`

**Command not found after installation:**
- Restart your terminal
- Check if the npm global bin directory is in your PATH
- Try using the full path: `~/.npm-global/bin/docker-pilot`

### Getting Help

If you encounter issues:

1. Check the [FAQ](../faq.md)
2. Search [existing issues](https://github.com/jonhvmp/docker-pilot/issues)
3. Create a [new issue](https://github.com/jonhvmp/docker-pilot/issues/new)

## What's Next?

After installation, continue with:

- [Quick Start Guide](quick-start.md) - Get up and running in minutes
- [Configuration](configuration.md) - Learn about configuration options
- [First Steps](first-steps.md) - Detailed walkthrough for beginners

---

!!! tip "Pro Tip"
    Install Docker Pilot globally and add it to your daily Docker workflow. The interactive menu makes it easy to manage complex multi-container applications!
