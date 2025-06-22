# Testing Guide

This document describes the testing strategies, tools, and practices used in Docker Pilot.

## Overview

Docker Pilot uses a comprehensive testing approach that includes unit, integration, and end-to-end tests. Our philosophy is "tests as living documentation" - each test should be clear, expressive, and serve as documentation for expected behavior.

## Testing Strategy

### Test Pyramid

```text
      /\
     /  \  E2E Tests (Few)
    /____\
   /      \  Integration Tests (Some)
  /________\
 /          \  Unit Tests (Many)
/____________\
```

- **70% Unit Tests**: Fast and isolated tests
- **20% Integration Tests**: Tests for integrated components
- **10% E2E Tests**: Complete scenario tests

### Testing Principles

1. **F.I.R.S.T**
   - **Fast**: Tests should be fast
   - **Independent**: Tests should not depend on each other
   - **Repeatable**: Consistent results in any environment
   - **Self-Validating**: Clear result (pass or fail)
   - **Timely**: Written alongside production code

2. **AAA Pattern**
   - **Arrange**: Set up data and mocks
   - **Act**: Execute the operation being tested
   - **Assert**: Verify the result

3. **Test Naming**
   - Clearly describe the scenario being tested
   - Use business language when appropriate
   - Format: `should_DoSomething_When_Condition`

## Testing Tools

### Jest

Main testing framework.

```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globalTeardown: '<rootDir>/tests/teardown.ts'
};
```

### Supertest

For API testing (future).

### Docker Test Environment

Docker environment for integration tests.

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-registry:
    image: registry:2
    ports:
      - "5000:5000"

  test-db:
    image: postgres:13
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5432:5432"
```

## Test Types

### 1. Unit Tests

Test isolated units of code (classes, functions).

```typescript
// tests/unit/utils/ValidationUtils.test.ts
describe('ValidationUtils', () => {
  describe('isValidContainerName', () => {
    it('should return true for valid container name', () => {
      // Arrange
      const validName = 'my-app-container';

      // Act
      const result = ValidationUtils.isValidContainerName(validName);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for name with invalid characters', () => {
      // Arrange
      const invalidName = 'my_app@container!';

      // Act
      const result = ValidationUtils.isValidContainerName(invalidName);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for empty name', () => {
      // Arrange
      const emptyName = '';

      // Act
      const result = ValidationUtils.isValidContainerName(emptyName);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isValidImageTag', () => {
    test.each([
      ['latest', true],
      ['v1.0.0', true],
      ['1.2.3-alpine', true],
      ['', false],
      ['INVALID@TAG', false]
    ])('should validate "%s" as %s', (tag, expected) => {
      expect(ValidationUtils.isValidImageTag(tag)).toBe(expected);
    });
  });
});
```

### 2. Integration Tests

Test interaction between components.

```typescript
// tests/integration/docker/ContainerManager.test.ts
describe('ContainerManager Integration', () => {
  let containerManager: ContainerManager;
  let dockerClient: DockerClient;
  let testContainers: string[] = [];

  beforeAll(async () => {
    dockerClient = new DockerClient();
    containerManager = new ContainerManager(dockerClient);

    // Check if Docker is available
    const isRunning = await DockerUtils.isDockerRunning();
    if (!isRunning) {
      throw new Error('Docker is not running - skip integration tests');
    }
  });

  afterAll(async () => {
    // Cleanup: remove test containers
    for (const containerId of testContainers) {
      try {
        await dockerClient.removeContainer(containerId, { force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  beforeEach(async () => {
    // Ensure we have a test image
    await dockerClient.pullImage('alpine:latest');
  });

  describe('createContainer', () => {
    it('should create container successfully', async () => {
      // Arrange
      const containerName = `test-container-${Date.now()}`;
      const options = {
        image: 'alpine:latest',
        name: containerName,
        command: ['sleep', '60']
      };

      // Act
      const container = await containerManager.createContainer(options);
      testContainers.push(container.id);

      // Assert
      expect(container).toBeDefined();
      expect(container.name).toBe(containerName);
      expect(container.image).toBe('alpine:latest');
    });

    it('should throw error for duplicate container name', async () => {
      // Arrange
      const containerName = `duplicate-container-${Date.now()}`;
      const options = {
        image: 'alpine:latest',
        name: containerName,
        command: ['sleep', '60']
      };

      // Create first container
      const container1 = await containerManager.createContainer(options);
      testContainers.push(container1.id);

      // Act & Assert
      await expect(
        containerManager.createContainer(options)
      ).rejects.toThrow('Container with this name already exists');
    });
  });

  describe('startContainer', () => {
    it('should start container successfully', async () => {
      // Arrange
      const containerName = `start-test-${Date.now()}`;
      const options = {
        image: 'alpine:latest',
        name: containerName,
        command: ['sleep', '60']
      };

      const container = await containerManager.createContainer(options);
      testContainers.push(container.id);

      // Act
      await containerManager.startContainer(container.id);

      // Assert
      const updatedContainer = await dockerClient.inspectContainer(container.id);
      expect(updatedContainer.state.running).toBe(true);
    });
  });

  describe('stopContainer', () => {
    it('should stop running container', async () => {
      // Arrange
      const containerName = `stop-test-${Date.now()}`;
      const options = {
        image: 'alpine:latest',
        name: containerName,
        command: ['sleep', '60']
      };

      const container = await containerManager.createContainer(options);
      testContainers.push(container.id);
      await containerManager.startContainer(container.id);

      // Act
      await containerManager.stopContainer(container.id);

      // Assert
      const updatedContainer = await dockerClient.inspectContainer(container.id);
      expect(updatedContainer.state.running).toBe(false);
    });
  });
});
```

### 3. End-to-End Tests

Test complete user scenarios.

```typescript
// tests/e2e/cli/container-lifecycle.test.ts
describe('Container Lifecycle E2E', () => {
  const testContainerName = `e2e-test-${Date.now()}`;

  afterAll(async () => {
    // Cleanup
    try {
      execSync(`docker rm -f ${testContainerName}`, { stdio: 'ignore' });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should complete full container lifecycle via CLI', async () => {
    // Create container
    const createOutput = execSync(
      `docker-pilot create ${testContainerName} --image nginx:alpine`,
      { encoding: 'utf8' }
    );
    expect(createOutput).toContain(`Container ${testContainerName} created`);

    // Start container
    const startOutput = execSync(
      `docker-pilot start ${testContainerName}`,
      { encoding: 'utf8' }
    );
    expect(startOutput).toContain(`Container ${testContainerName} started`);

    // List containers (should show running)
    const listOutput = execSync('docker-pilot list containers', {
      encoding: 'utf8'
    });
    expect(listOutput).toContain(testContainerName);
    expect(listOutput).toContain('running');

    // Stop container
    const stopOutput = execSync(
      `docker-pilot stop ${testContainerName}`,
      { encoding: 'utf8' }
    );
    expect(stopOutput).toContain(`Container ${testContainerName} stopped`);

    // Remove container
    const removeOutput = execSync(
      `docker-pilot remove ${testContainerName}`,
      { encoding: 'utf8' }
    );
    expect(removeOutput).toContain(`Container ${testContainerName} removed`);
  });

  it('should handle interactive menu navigation', async () => {
    // This would require more complex testing with input simulation
    // For now, we'll test the basic menu display
    const menuOutput = execSync('docker-pilot menu --help', {
      encoding: 'utf8'
    });
    expect(menuOutput).toContain('Interactive menu');
  });
});
```

## Test Environment Setup

### Test Configuration

```typescript
// tests/setup.ts
import { DockerClient } from '../src/core/DockerClient';
import { Logger } from '../src/utils/Logger';

// Global test configuration
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DOCKER_PILOT_LOG_LEVEL = 'error';

  // Verify Docker is available
  const dockerClient = new DockerClient();
  const isRunning = await dockerClient.ping().catch(() => false);

  if (!isRunning) {
    throw new Error('Docker is not available for testing');
  }

  // Pull required test images
  await dockerClient.pullImage('alpine:latest');
  await dockerClient.pullImage('nginx:alpine');
});

// Global test teardown
afterAll(async () => {
  // Cleanup any remaining test containers
  const dockerClient = new DockerClient();
  const containers = await dockerClient.listContainers({ all: true });

  const testContainers = containers.filter(c =>
    c.names.some(name => name.includes('test-') || name.includes('e2e-'))
  );

  for (const container of testContainers) {
    try {
      await dockerClient.removeContainer(container.id, { force: true });
    } catch (error) {
      // Ignore errors
    }
  }
});
```

### Test Helpers

```typescript
// tests/helpers/TestHelpers.ts
export class TestHelpers {
  /**
   * Creates a unique test container name
   */
  static generateContainerName(prefix: string = 'test'): string {
    return `${prefix}-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Waits for a condition to be true
   */
  static async waitFor(
    condition: () => Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.sleep(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Sleep for specified milliseconds
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Creates a test Docker network
   */
  static async createTestNetwork(dockerClient: DockerClient): Promise<string> {
    const networkName = this.generateContainerName('test-network');
    await dockerClient.createNetwork(networkName);
    return networkName;
  }

  /**
   * Cleans up test resources
   */
  static async cleanup(dockerClient: DockerClient, resources: {
    containers?: string[];
    networks?: string[];
    volumes?: string[];
  }): Promise<void> {
    // Remove containers
    if (resources.containers) {
      for (const containerId of resources.containers) {
        try {
          await dockerClient.removeContainer(containerId, { force: true });
        } catch (error) {
          // Ignore errors
        }
      }
    }

    // Remove networks
    if (resources.networks) {
      for (const networkId of resources.networks) {
        try {
          await dockerClient.removeNetwork(networkId);
        } catch (error) {
          // Ignore errors
        }
      }
    }

    // Remove volumes
    if (resources.volumes) {
      for (const volumeId of resources.volumes) {
        try {
          await dockerClient.removeVolume(volumeId);
        } catch (error) {
          // Ignore errors
        }
      }
    }
  }
}
```

## Mocking Strategies

### Docker Client Mocking

```typescript
// tests/mocks/DockerClientMock.ts
export class DockerClientMock {
  private containers: Map<string, any> = new Map();
  private images: Map<string, any> = new Map();

  // Mock container methods
  async listContainers(options?: any): Promise<any[]> {
    return Array.from(this.containers.values());
  }

  async createContainer(options: any): Promise<any> {
    const container = {
      id: `mock-${Date.now()}`,
      name: options.name,
      image: options.image,
      state: { running: false },
      created: new Date().toISOString()
    };

    this.containers.set(container.id, container);
    return container;
  }

  async startContainer(id: string): Promise<void> {
    const container = this.containers.get(id);
    if (!container) {
      throw new Error('Container not found');
    }
    container.state.running = true;
  }

  async stopContainer(id: string): Promise<void> {
    const container = this.containers.get(id);
    if (!container) {
      throw new Error('Container not found');
    }
    container.state.running = false;
  }

  async removeContainer(id: string, options?: any): Promise<void> {
    this.containers.delete(id);
  }

  async inspectContainer(id: string): Promise<any> {
    const container = this.containers.get(id);
    if (!container) {
      throw new Error('Container not found');
    }
    return container;
  }

  // Mock image methods
  async listImages(): Promise<any[]> {
    return Array.from(this.images.values());
  }

  async pullImage(name: string): Promise<void> {
    const image = {
      id: `mock-image-${Date.now()}`,
      repoTags: [name],
      created: new Date().toISOString()
    };
    this.images.set(name, image);
  }

  // Utility methods for testing
  reset(): void {
    this.containers.clear();
    this.images.clear();
  }

  addMockContainer(container: any): void {
    this.containers.set(container.id, container);
  }

  addMockImage(image: any): void {
    this.images.set(image.repoTags[0], image);
  }
}
```

## Performance Testing

### Load Testing

```typescript
// tests/performance/container-operations.test.ts
describe('Container Operations Performance', () => {
  let dockerClient: DockerClient;
  let containerManager: ContainerManager;

  beforeAll(async () => {
    dockerClient = new DockerClient();
    containerManager = new ContainerManager(dockerClient);
  });

  it('should handle multiple container creations efficiently', async () => {
    const containerCount = 10;
    const startTime = Date.now();
    const containers: string[] = [];

    try {
      // Create multiple containers concurrently
      const createPromises = Array.from({ length: containerCount }, (_, i) =>
        containerManager.createContainer({
          image: 'alpine:latest',
          name: `perf-test-${i}-${Date.now()}`,
          command: ['sleep', '5']
        })
      );

      const createdContainers = await Promise.all(createPromises);
      containers.push(...createdContainers.map(c => c.id));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust based on your requirements)
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(createdContainers).toHaveLength(containerCount);

      console.log(`Created ${containerCount} containers in ${duration}ms`);
    } finally {
      // Cleanup
      await Promise.all(
        containers.map(id =>
          dockerClient.removeContainer(id, { force: true }).catch(() => {})
        )
      );
    }
  });

  it('should handle container listing efficiently', async () => {
    const startTime = Date.now();

    // List containers multiple times
    const listPromises = Array.from({ length: 5 }, () =>
      containerManager.listContainers()
    );

    const results = await Promise.all(listPromises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(2000); // 2 seconds
    expect(results).toHaveLength(5);

    console.log(`Listed containers 5 times in ${duration}ms`);
  });
});
```

## Test Coverage

### Coverage Configuration

```javascript
// jest.config.js (coverage section)
module.exports = {
  // ... other config
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/__tests__/**',
    '!src/**/test/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/core/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ]
};
```

### Coverage Analysis

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html

# Check coverage thresholds
npm run test:coverage:check
```

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

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

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Generate coverage report
      run: npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

  docker-tests:
    runs-on: ubuntu-latest

    services:
      docker:
        image: docker:dind
        options: --privileged

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18.x
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Wait for Docker
      run: |
        timeout 60 sh -c 'until docker info; do sleep 1; done'

    - name: Run Docker integration tests
      run: npm run test:docker
```

## Testing Best Practices

### 1. Test Organization

```
tests/
├── unit/                    # Unit tests mirror src structure
│   ├── core/
│   │   ├── DockerPilot.test.ts
│   │   └── CommandRunner.test.ts
│   ├── utils/
│   │   ├── Logger.test.ts
│   │   └── ValidationUtils.test.ts
│   └── commands/
│       ├── container/
│       └── image/
├── integration/             # Integration tests by feature
│   ├── docker/
│   │   ├── container-management.test.ts
│   │   └── image-management.test.ts
│   └── cli/
│       └── command-parsing.test.ts
├── e2e/                     # End-to-end scenarios
│   ├── scenarios/
│   │   ├── basic-workflow.test.ts
│   │   └── error-handling.test.ts
│   └── cli/
│       └── interactive-menu.test.ts
├── fixtures/                # Test data
│   ├── containers.json
│   ├── images.json
│   └── docker-compose/
│       └── test-stack.yml
└── helpers/                 # Test utilities
    ├── TestHelpers.ts
    ├── DockerMock.ts
    └── setup.ts
```

### 2. Test Data Management

```typescript
// tests/fixtures/TestData.ts
export const TestData = {
  containers: {
    running: {
      id: 'test-container-1',
      name: 'test-app',
      image: 'nginx:latest',
      status: 'running',
      ports: [{ private: 80, public: 8080 }]
    },
    stopped: {
      id: 'test-container-2',
      name: 'test-db',
      image: 'postgres:13',
      status: 'exited',
      ports: []
    }
  },
  images: {
    nginx: {
      id: 'nginx-image-id',
      repoTags: ['nginx:latest', 'nginx:1.21'],
      size: 133000000
    },
    alpine: {
      id: 'alpine-image-id',
      repoTags: ['alpine:latest', 'alpine:3.14'],
      size: 5600000
    }
  },
  configs: {
    default: {
      logLevel: 'info',
      dockerHost: 'unix:///var/run/docker.sock',
      timeout: 30000
    },
    debug: {
      logLevel: 'debug',
      dockerHost: 'unix:///var/run/docker.sock',
      timeout: 60000
    }
  }
};

// Usage in tests
import { TestData } from '../fixtures/TestData';

describe('ContainerManager', () => {
  it('should handle running container', () => {
    const container = TestData.containers.running;
    // ... test logic
  });
});
```

### 3. Async Testing Patterns

```typescript
// Good async testing patterns
describe('Async Operations', () => {
  it('should handle promise resolution', async () => {
    // Use async/await
    const result = await someAsyncOperation();
    expect(result).toBeDefined();
  });

  it('should handle promise rejection', async () => {
    // Test error handling
    await expect(failingAsyncOperation()).rejects.toThrow('Expected error');
  });

  it('should handle timeout', async () => {
    // Test with timeout
    const promise = longRunningOperation();
    await expect(promise).resolves.toBeDefined();
  }, 10000); // 10 second timeout

  it('should handle concurrent operations', async () => {
    // Test parallel operations
    const promises = [
      operation1(),
      operation2(),
      operation3()
    ];

    const results = await Promise.all(promises);
    expect(results).toHaveLength(3);
  });
});
```

### 4. Error Testing

```typescript
describe('Error Handling', () => {
  it('should handle Docker daemon not running', async () => {
    // Mock Docker unavailable
    const mockClient = new DockerClientMock();
    jest.spyOn(mockClient, 'listContainers')
      .mockRejectedValue(new Error('Docker daemon not running'));

    const containerManager = new ContainerManager(mockClient as any);

    await expect(containerManager.listContainers())
      .rejects.toThrow('Docker daemon not running');
  });

  it('should handle network timeouts', async () => {
    const mockClient = new DockerClientMock();
    jest.spyOn(mockClient, 'pullImage')
      .mockRejectedValue(new Error('Request timeout'));

    const containerManager = new ContainerManager(mockClient as any);

    await expect(containerManager.pullImage('nginx:latest'))
      .rejects.toThrow('Request timeout');
  });

  it('should handle invalid input gracefully', () => {
    expect(() => ValidationUtils.isValidContainerName(''))
      .not.toThrow();

    expect(ValidationUtils.isValidContainerName('')).toBe(false);
  });
});
```

### 5. Test Maintenance

```typescript
// Keep tests DRY with shared setup
describe('ContainerManager', () => {
  let containerManager: ContainerManager;
  let mockClient: DockerClientMock;

  beforeEach(() => {
    mockClient = new DockerClientMock();
    containerManager = new ContainerManager(mockClient);
  });

  // Helper method for common test setup
  const createTestContainer = async (name: string = 'test-container') => {
    const options = {
      image: 'nginx:latest',
      name,
      command: ['nginx', '-g', 'daemon off;']
    };
    return await containerManager.createContainer(options);
  };

  describe('createContainer', () => {
    it('should create container with default options', async () => {
      const container = await createTestContainer();
      expect(container.name).toBe('test-container');
    });

    it('should create container with custom name', async () => {
      const container = await createTestContainer('custom-name');
      expect(container.name).toBe('custom-name');
    });
  });
});
```

## Debugging Tests

### VS Code Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache",
        "--testPathPattern=${fileBasenameNoExtension}"
      ],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Current Test File",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache",
        "${file}"
      ],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Test Debugging Tips

```typescript
// Add debug information to tests
describe('Debug Example', () => {
  it('should debug container creation', async () => {
    console.log('Starting container creation test');

    const container = await containerManager.createContainer({
      image: 'nginx:latest',
      name: 'debug-container'
    });

    console.log('Created container:', JSON.stringify(container, null, 2));

    expect(container).toBeDefined();
  });

  // Use Jest's debug mode
  it.only('should run only this test', () => {
    // This test will run in isolation
  });

  // Skip tests during debugging
  it.skip('should skip this test', () => {
    // This test will be skipped
  });
});
```

## Test Documentation

### Test Plans

Each major feature should have a test plan documenting:

1. **Test Scope**: What is being tested
2. **Test Cases**: Specific scenarios
3. **Expected Results**: What should happen
4. **Prerequisites**: Setup requirements
5. **Test Data**: Required test data

### Example Test Plan

```markdown
# Container Management Test Plan

## Scope
Testing container creation, starting, stopping, and removal operations.

## Test Cases

### TC01: Create Container
- **Description**: Create a new container with valid parameters
- **Prerequisites**: Docker daemon running, valid image available
- **Test Data**: Image: nginx:latest, Name: test-container
- **Expected Result**: Container created successfully with correct properties

### TC02: Start Container
- **Description**: Start an existing stopped container
- **Prerequisites**: Container exists and is stopped
- **Test Data**: Container ID from TC01
- **Expected Result**: Container status changes to "running"

### TC03: Stop Container
- **Description**: Stop a running container
- **Prerequisites**: Container exists and is running
- **Test Data**: Container ID from TC01
- **Expected Result**: Container status changes to "stopped"

### TC04: Remove Container
- **Description**: Remove a stopped container
- **Prerequisites**: Container exists and is stopped
- **Test Data**: Container ID from TC01
- **Expected Result**: Container is removed from system
```

This comprehensive testing guide ensures Docker Pilot maintains high quality and reliability through systematic testing practices.
