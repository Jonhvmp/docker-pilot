# Contributing Guide

Thank you for considering contributing to Docker Pilot! This guide provides all the information needed to contribute effectively to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How to Contribute](#how-to-contribute)
3. [Environment Setup](#environment-setup)
4. [Project Structure](#project-structure)
5. [Code Standards](#code-standards)
6. [Testing](#testing)
7. [Documentation](#documentation)
8. [Review Process](#review-process)
9. [Releases](#releases)

## Code of Conduct

This project and all participants are governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to follow this code.

### Expected Behavior

- Use welcoming and inclusive language
- Respect different viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Use of sexualized language or imagery
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing private information without permission
- Any conduct considered inappropriate in a professional environment

## How to Contribute

There are several ways to contribute to Docker Pilot:

### 1. Report Bugs

If you found a bug, help us by creating an issue:

1. Check if the bug has already been reported
2. Use the bug report template
3. Include detailed environment information
4. Provide steps to reproduce the problem
5. Add logs and screenshots when relevant

**Bug Report Template:**

```markdown
**Bug Description**
Clear and concise description of the problem.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Execute '....'
4. See the error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows, macOS, Linux]
- Docker Version: [e.g. 24.0.7]
- Docker Pilot Version: [e.g. 1.0.0]
- Node.js Version: [e.g. 18.17.0]

**Additional Information**
Any additional context about the problem.
```

### 2. Suggest Improvements

To suggest a new feature:

1. Check if the feature has already been suggested
2. Use the feature request template
3. Clearly describe the problem it solves
4. Provide usage examples
5. Consider alternatives

**Feature Request Template:**

```markdown
**Feature Description**
Clear and concise description of the desired feature.

**Problem Solved**
What problem does this feature solve?

**Proposed Solution**
How would you like it to work?

**Alternatives Considered**
What other solutions have you considered?

**Additional Context**
Any additional relevant information.
```

### 3. Contribute Code

To contribute code:

1. Fork the repository
2. Create a branch for your feature
3. Make your changes
4. Add tests
5. Run the tests
6. Commit your changes
7. Create a pull request

## Environment Setup

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Docker** 24.x or higher
- **Git** 2.x or higher

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/docker-pilot.git
cd docker-pilot
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure development environment:**

```bash
# Create local configuration file
cp .env.example .env.local

# Install development tools
npm run dev:setup
```

4. **Build the project:**

```bash
npm run build
```

5. **Run tests:**

```bash
npm test
```

### Docker Configuration

Docker Pilot requires Docker to be running:

```bash
# Check if Docker is running
docker version

# Start Docker (if needed)
# Windows/macOS: Start Docker Desktop
# Linux: sudo systemctl start docker
```

### IDE Configuration

#### Visual Studio Code

Install recommended extensions:

- **TypeScript Hero** - Import organization
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Test execution
- **Docker** - Docker support

Recommended configuration (`.vscode/settings.json`):

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "jest.autoRun": "watch",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

## Project Structure

```
docker-pilot/
├── src/                    # Source code
│   ├── core/              # Core functionality
│   │   ├── DockerPilot.ts
│   │   ├── CommandRunner.ts
│   │   ├── ConfigManager.ts
│   │   └── ServiceManager.ts
│   ├── commands/          # Command implementations
│   │   ├── container/
│   │   ├── image/
│   │   ├── volume/
│   │   └── network/
│   ├── utils/             # Utilities
│   │   ├── DockerUtils.ts
│   │   ├── FileUtils.ts
│   │   ├── Logger.ts
│   │   └── ValidationUtils.ts
│   ├── types/             # Type definitions
│   │   └── index.ts
│   ├── plugins/           # Plugin system
│   │   ├── PluginManager.ts
│   │   └── types.ts
│   └── index.ts           # Entry point
├── tests/                 # Tests
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── docs/                  # Documentation
├── scripts/               # Build/deploy scripts
├── .github/               # GitHub workflows
└── config/                # Configurations
```

### Important Files

- **`package.json`** - Project configuration and dependencies
- **`tsconfig.json`** - TypeScript configuration
- **`jest.config.js`** - Test configuration
- **`.eslintrc.js`** - ESLint configuration
- **`.prettierrc`** - Prettier configuration
- **`docker-compose.yml`** - Development environment

## Code Standards

### Code Style

We follow TypeScript and ESLint conventions:

```typescript
// ✅ Good
class ContainerManager {
  private readonly containers: Map<string, Container> = new Map();

  async startContainer(name: string): Promise<void> {
    const container = this.containers.get(name);
    if (!container) {
      throw new Error(`Container ${name} not found`);
    }

    await container.start();
  }
}

// ❌ Bad
class containerManager {
  private containers: any;

  startContainer(name) {
    return this.containers.get(name).start();
  }
}
```

### Naming Conventions

- **Classes**: PascalCase (`ContainerManager`)
- **Methods/Functions**: camelCase (`startContainer`)
- **Variables**: camelCase (`containerName`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- **Interfaces**: PascalCase with I prefix (`IContainerConfig`)
- **Types**: PascalCase (`ContainerStatus`)
- **Enums**: PascalCase (`LogLevel`)

### File Structure

```typescript
// file: src/utils/ContainerUtils.ts

import { Container, ContainerStatus } from '../types';
import { DockerClient } from '../core/DockerClient';
import { Logger } from './Logger';

/**
 * Utilities for managing Docker containers
 */
export class ContainerUtils {
  private static readonly logger = new Logger('ContainerUtils');

  /**
   * Checks if a container is running
   * @param container Container to check
   * @returns true if running
   */
  static isRunning(container: Container): boolean {
    return container.status === ContainerStatus.Running;
  }

  /**
   * Gets containers by status
   * @param client Docker client
   * @param status Desired status
   * @returns List of containers
   */
  static async getByStatus(
    client: DockerClient,
    status: ContainerStatus
  ): Promise<Container[]> {
    try {
      const containers = await client.listContainers();
      return containers.filter(c => c.status === status);
    } catch (error) {
      this.logger.error('Error getting containers by status', error);
      throw error;
    }
  }
}
```

### Error Handling

```typescript
// ✅ Good - Specific handling
async function stopContainer(name: string): Promise<void> {
  try {
    const container = await findContainer(name);
    if (!container) {
      throw new ContainerNotFoundError(`Container ${name} not found`);
    }

    await container.stop();
    logger.info(`Container ${name} stopped successfully`);
  } catch (error) {
    if (error instanceof ContainerNotFoundError) {
      logger.warn(`Container ${name} not found`);
    } else {
      logger.error(`Error stopping container ${name}`, error);
    }
    throw error;
  }
}

// ❌ Bad - Generic handling
async function stopContainer(name: string): Promise<void> {
  try {
    const container = await findContainer(name);
    await container.stop();
  } catch (error) {
    console.log('Error:', error);
  }
}
```

### Code Documentation

```typescript
/**
 * Manages Docker container operations
 *
 * @example
 * ```typescript
 * const manager = new ContainerManager();
 * await manager.start('nginx');
 * ```
 */
export class ContainerManager {
  /**
   * Starts a container
   *
   * @param name Container name
   * @param options Start options
   * @throws {ContainerNotFoundError} When container doesn't exist
   * @throws {ContainerAlreadyRunningError} When container is already running
   * @returns Promise that resolves when container starts
   */
  async start(name: string, options?: StartOptions): Promise<void> {
    // implementation
  }
}
```

## Testing

### Test Structure

```
tests/
├── unit/                  # Unit tests
│   ├── core/
│   ├── utils/
│   └── commands/
├── integration/           # Integration tests
│   ├── docker/
│   └── api/
├── e2e/                   # End-to-end tests
│   ├── cli/
│   └── scenarios/
├── fixtures/              # Test data
│   ├── containers/
│   ├── images/
│   └── configs/
└── helpers/               # Test utilities
    ├── setup.ts
    ├── teardown.ts
    └── mocks.ts
```

### Test Patterns

#### Unit Tests

```typescript
// file: tests/unit/utils/ContainerUtils.test.ts

import { ContainerUtils } from '../../../src/utils/ContainerUtils';
import { Container, ContainerStatus } from '../../../src/types';
import { createMockContainer } from '../../helpers/mocks';

describe('ContainerUtils', () => {
  describe('isRunning', () => {
    it('should return true for running container', () => {
      // Arrange
      const container = createMockContainer({
        status: ContainerStatus.Running
      });

      // Act
      const result = ContainerUtils.isRunning(container);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for stopped container', () => {
      // Arrange
      const container = createMockContainer({
        status: ContainerStatus.Exited
      });

      // Act
      const result = ContainerUtils.isRunning(container);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getByStatus', () => {
    it('should filter containers by status', async () => {
      // Arrange
      const mockClient = {
        listContainers: jest.fn().mockResolvedValue([
          createMockContainer({ status: ContainerStatus.Running }),
          createMockContainer({ status: ContainerStatus.Exited }),
          createMockContainer({ status: ContainerStatus.Running })
        ])
      };

      // Act
      const result = await ContainerUtils.getByStatus(
        mockClient as any,
        ContainerStatus.Running
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(c => c.status === ContainerStatus.Running)).toBe(true);
    });
  });
});
```

#### Integration Tests

```typescript
// file: tests/integration/docker/ContainerManager.test.ts

import { ContainerManager } from '../../../src/core/ContainerManager';
import { DockerClient } from '../../../src/core/DockerClient';
import { setupTestEnvironment, teardownTestEnvironment } from '../../helpers/setup';

describe('ContainerManager Integration', () => {
  let containerManager: ContainerManager;
  let dockerClient: DockerClient;

  beforeAll(async () => {
    await setupTestEnvironment();
    dockerClient = new DockerClient();
    containerManager = new ContainerManager(dockerClient);
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    // Clean test containers
    await dockerClient.pruneContainers();
  });

  it('should create and start container', async () => {
    // Arrange
    const containerName = 'test-nginx';
    const image = 'nginx:alpine';

    // Act
    await containerManager.create(containerName, image);
    await containerManager.start(containerName);

    // Assert
    const container = await dockerClient.getContainer(containerName);
    expect(container.status).toBe('running');
  });
});
```

#### E2E Tests

```typescript
// file: tests/e2e/cli/container-commands.test.ts

import { execSync } from 'child_process';
import { setupTestEnvironment } from '../../helpers/setup';

describe('Container Commands E2E', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  it('should list containers via CLI', () => {
    // Act
    const output = execSync('docker-pilot list containers', {
      encoding: 'utf8'
    });

    // Assert
    expect(output).toContain('CONTAINER ID');
    expect(output).toContain('IMAGE');
    expect(output).toContain('STATUS');
  });

  it('should start container via CLI', () => {
    // Arrange
    execSync('docker run -d --name test-nginx nginx:alpine');

    // Act
    const output = execSync('docker-pilot start test-nginx', {
      encoding: 'utf8'
    });

    // Assert
    expect(output).toContain('Container test-nginx started');
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Tests with coverage
npm run test:coverage

# Tests in watch mode
npm run test:watch

# Specific tests
npm test -- --testNamePattern="ContainerUtils"
npm test -- --testPathPattern="container"
```

### Mocks and Fixtures

```typescript
// file: tests/helpers/mocks.ts

import { Container, ContainerStatus } from '../../src/types';

export function createMockContainer(overrides: Partial<Container> = {}): Container {
  return {
    id: 'mock-container-id',
    name: 'mock-container',
    image: 'nginx:latest',
    status: ContainerStatus.Running,
    created: new Date(),
    ports: [],
    volumes: [],
    networks: [],
    ...overrides
  };
}

export function createMockDockerClient() {
  return {
    listContainers: jest.fn(),
    getContainer: jest.fn(),
    createContainer: jest.fn(),
    startContainer: jest.fn(),
    stopContainer: jest.fn(),
    removeContainer: jest.fn()
  };
}
```

## Documentation

### Code Documentation

- Use JSDoc to document public classes, methods, and functions
- Include usage examples when appropriate
- Document parameters, returns, and exceptions
- Use `@deprecated` for obsolete features

### API Documentation

- Keep API documentation up to date
- Use practical examples
- Document all endpoints and parameters
- Include response codes and examples

### README and Guides

- Keep README.md updated
- Include installation and usage guides
- Add common troubleshooting
- Document important changes

## Review Process

### Pull Request Checklist

Before creating a PR, check:

- [ ] Code follows established standards
- [ ] Tests were added/updated
- [ ] Documentation was updated
- [ ] Builds pass without errors
- [ ] No merge conflicts
- [ ] Commit messages are descriptive

### Pull Request Template

```markdown
## Description

Brief description of the changes made.

## Type of Change

- [ ] Bug fix (change that fixes an issue)
- [ ] New feature (change that adds functionality)
- [ ] Breaking change (change that breaks compatibility)
- [ ] Documentation (documentation changes only)

## How It Was Tested

Describe the tests performed to verify the changes.

## Checklist

- [ ] My code follows the project standards
- [ ] I performed a self-review of the code
- [ ] I commented complex code
- [ ] I updated documentation
- [ ] Tests pass locally
- [ ] I added tests that prove the fix/feature works

## Screenshots (if applicable)

Add screenshots for UI changes.
```

### Processo de Review

1. **Automated Checks**: CI/CD executa testes e linting
2. **Code Review**: Pelo menos um maintainer deve aprovar
3. **Manual Testing**: Testes manuais se necessário
4. **Merge**: Squash and merge para manter histórico limpo

## Releases

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Changes that break compatibility
- **MINOR**: New compatible features
- **PATCH**: Compatible bug fixes

### Release Process

1. **Preparation**:
   - Update CHANGELOG.md
   - Bump version in package.json
   - Update documentation

2. **Testing**:
   - Run all tests
   - Integration tests
   - Manual testing

3. **Release**:
   - Create version tag
   - Publish to npm
   - Create GitHub release
   - Update documentation

4. **Post-Release**:
   - Verify deployment
   - Monitor issues
   - Communicate to community

### Changelog

We maintain a detailed changelog following [Keep a Changelog](https://keepachangelog.com/):

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- New container monitoring feature
- Support for Docker Compose v2
- Command for automatic resource cleanup

### Changed
- Improved container listing performance
- Updated interactive menu interface

### Fixed
- Fixed bug in container name validation
- Resolved port conflict issue

### Deprecated
- Command `docker-pilot old-command` will be removed in v2.0

### Removed
- Removed support for Docker Engine < 20.10

### Security
- Fixed vulnerability in input validation
```

## Development Tools

### NPM Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "format": "prettier --write src tests",
    "format:check": "prettier --check src tests",
    "dev": "ts-node src/index.ts",
    "dev:debug": "ts-node --inspect src/index.ts",
    "clean": "rm -rf dist coverage",
    "precommit": "npm run lint && npm run test",
    "prepush": "npm run build && npm run test:coverage"
  }
}
```

### Git Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run precommit

# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run prepush
```

### CI/CD Configuration

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${ { matrix.node-version } }
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run tests
      run: npm run test:coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## Additional Resources

### Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ESLint Rules](https://eslint.org/docs/rules/)

### Community

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For general discussions
- **Discord**: For real-time chat
- **Stack Overflow**: For technical questions (tag: docker-pilot)

### Mentorship

New contributors are welcome! If you're new to the project:

1. Start with issues marked as "good first issue"
2. Read all documentation
3. Ask questions in discussions
4. Participate in community meetings
5. Ask for help when needed

## Recognition

All contributors are recognized in the CONTRIBUTORS.md file and the project credits page. Contributions include:

- Code
- Documentation
- Tests
- Reviews
- Bug reports
- Feature suggestions
- Translation
- Design
- Community support

Thank you for contributing to Docker Pilot! 🚀
