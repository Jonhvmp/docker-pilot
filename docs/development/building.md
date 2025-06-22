# Guia de Build e Deployment

Este documento descreve o processo de build, empacotamento e deployment do Docker Pilot.

## Visão Geral

O Docker Pilot utiliza um sistema de build moderno baseado em TypeScript, com suporte para múltiplas plataformas e diferentes formatos de distribuição. O processo de build é automatizado e integrado com CI/CD.

## Estrutura de Build

### Arquivos de Configuração

```
project/
├── tsconfig.json          # Configuração TypeScript
├── tsconfig.build.json    # Config específica para build
├── webpack.config.js      # Configuração Webpack (opcional)
├── rollup.config.js       # Configuração Rollup (alternativa)
├── package.json           # Scripts e dependências
├── .npmignore            # Arquivos ignorados no npm
└── scripts/              # Scripts de build
    ├── build.js
    ├── package.js
    └── deploy.js
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

```json
// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": false,
    "removeComments": true
  },
  "exclude": [
    "node_modules",
    "tests",
    "**/*.test.ts",
    "**/*.spec.ts",
    "examples",
    "docs"
  ]
}
```

## Scripts de Build

### Package.json Scripts

```json
{
  "scripts": {
    "prebuild": "npm run clean",
    "build": "tsc -p tsconfig.build.json",
    "build:watch": "tsc -p tsconfig.build.json --watch",
    "build:prod": "npm run build && npm run bundle",
    "bundle": "webpack --mode production",
    "clean": "rimraf dist coverage",
    "package": "node scripts/package.js",
    "package:all": "node scripts/package-all.js",
    "prepack": "npm run build",
    "postpack": "npm run clean"
  }
}
```

### Custom Build Script

```javascript
// scripts/build.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class BuildManager {
  constructor() {
    this.rootDir = path.resolve(process.cwd());
    this.distDir = path.join(this.rootDir, 'dist');
    this.srcDir = path.join(this.rootDir, 'src');
  }

  async build() {
    console.log('🚀 Starting Docker Pilot build...');

    try {
      await this.clean();
      await this.compileTstyupeScript();
      await this.copyAssets();
      await this.generatePackageJson();
      await this.bundleExecutable();

      console.log('✅ Build completed successfully!');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  async clean() {
    console.log('🧹 Cleaning dist directory...');
    if (fs.existsSync(this.distDir)) {
      fs.rmSync(this.distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.distDir, { recursive: true });
  }

  async compileTypeScript() {
    console.log('📝 Compiling TypeScript...');
    execSync('npx tsc -p tsconfig.build.json', { stdio: 'inherit' });
  }

  async copyAssets() {
    console.log('📂 Copying assets...');

    // Copiar templates, schemas, etc.
    const assetsDir = path.join(this.srcDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      const destAssetsDir = path.join(this.distDir, 'assets');
      fs.cpSync(assetsDir, destAssetsDir, { recursive: true });
    }

    // Copiar arquivos de configuração
    const configFiles = ['README.md', 'LICENSE', 'CHANGELOG.md'];
    configFiles.forEach(file => {
      const src = path.join(this.rootDir, file);
      const dest = path.join(this.distDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    });
  }

  async generatePackageJson() {
    console.log('📦 Generating package.json for distribution...');

    const originalPackage = JSON.parse(
      fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8')
    );

    const distPackage = {
      name: originalPackage.name,
      version: originalPackage.version,
      description: originalPackage.description,
      keywords: originalPackage.keywords,
      author: originalPackage.author,
      license: originalPackage.license,
      homepage: originalPackage.homepage,
      repository: originalPackage.repository,
      bugs: originalPackage.bugs,
      main: 'index.js',
      bin: originalPackage.bin,
      dependencies: originalPackage.dependencies,
      engines: originalPackage.engines,
      os: originalPackage.os,
      cpu: originalPackage.cpu
    };

    fs.writeFileSync(
      path.join(this.distDir, 'package.json'),
      JSON.stringify(distPackage, null, 2)
    );
  }

  async bundleExecutable() {
    console.log('📦 Creating executable bundle...');

    // Usar pkg ou similar para criar executáveis
    const platforms = ['linux', 'macos', 'win'];

    for (const platform of platforms) {
      try {
        execSync(`npx pkg . --target node18-${platform}-x64 --output ./dist/docker-pilot-${platform}`, {
          stdio: 'inherit',
          cwd: this.distDir
        });
      } catch (error) {
        console.warn(`⚠️  Failed to create ${platform} executable:`, error.message);
      }
    }
  }
}

// Executar build se chamado diretamente
if (require.main === module) {
  new BuildManager().build();
}

module.exports = BuildManager;
```

## Bundling e Packaging

### Webpack Configuration

```javascript
// webpack.config.js
import path  from "path";
import webpack  from "webpack";

module.exports = {
  target: 'node',
  mode: process.env.NODE_ENV || 'development',
  entry: './src/index.ts',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'docker-pilot.js',
    clean: true
  },

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },

  plugins: [
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      '__VERSION__': JSON.stringify(require('./package.json').version)
    })
  ],

  externals: {
    // Manter algumas dependências como externas
    'docker-cli-js': 'commonjs docker-cli-js',
    'inquirer': 'commonjs inquirer'
  },

  optimization: {
    minimize: process.env.NODE_ENV === 'production'
  },

  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : false
};
```

### Rollup Configuration (Alternativa)

```javascript
// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/docker-pilot.js',
    format: 'cjs',
    banner: '#!/usr/bin/env node'
  },

  plugins: [
    typescript({
      tsconfig: './tsconfig.build.json'
    }),
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs(),
    json(),
    isProduction && terser()
  ].filter(Boolean),

  external: [
    'fs',
    'path',
    'os',
    'child_process',
    'docker-cli-js',
    'inquirer'
  ]
};
```

## Multi-Platform Packaging

### PKG Configuration

```json
// package.json
{
  "bin": {
    "docker-pilot": "./dist/index.js"
  },
  "pkg": {
    "scripts": "dist/**/*.js",
    "assets": [
      "dist/assets/**/*",
      "dist/templates/**/*"
    ],
    "targets": [
      "node18-linux-x64",
      "node18-macos-x64",
      "node18-win-x64"
    ],
    "outputPath": "binaries"
  }
}
```

### Packaging Script

```javascript
// scripts/package-all.js
import { execSync }  from "child_process";
import fs  from "fs";
import path  from "path";
import { createHash }  from "crypto";

class PackageManager {
  constructor() {
    this.version = require('../package.json').version;
    this.platforms = [
      { target: 'node18-linux-x64', name: 'linux-x64' },
      { target: 'node18-macos-x64', name: 'macos-x64' },
      { target: 'node18-win-x64', name: 'win-x64' }
    ];
    this.distDir = path.resolve(__dirname, '../dist');
    this.binariesDir = path.resolve(__dirname, '../binaries');
  }

  async packageAll() {
    console.log('📦 Starting multi-platform packaging...');

    await this.createBinariesDir();
    await this.buildExecutables();
    await this.createArchives();
    await this.generateChecksums();
    await this.createReleaseNotes();

    console.log('✅ Packaging completed!');
  }

  async createBinariesDir() {
    if (fs.existsSync(this.binariesDir)) {
      fs.rmSync(this.binariesDir, { recursive: true });
    }
    fs.mkdirSync(this.binariesDir, { recursive: true });
  }

  async buildExecutables() {
    console.log('🔨 Building executables for all platforms...');

    for (const platform of this.platforms) {
      console.log(`Building for ${platform.name}...`);

      try {
        const outputName = `docker-pilot-${platform.name}${platform.name.includes('win') ? '.exe' : ''}`;
        const outputPath = path.join(this.binariesDir, outputName);

        execSync(
          `npx pkg ${this.distDir} --target ${platform.target} --output ${outputPath}`,
          { stdio: 'inherit' }
        );

        console.log(`✅ Built ${outputName}`);
      } catch (error) {
        console.error(`❌ Failed to build for ${platform.name}:`, error.message);
      }
    }
  }

  async createArchives() {
    console.log('📁 Creating archives...');

    import archiver  from "archiver";

    for (const platform of this.platforms) {
      const executableName = `docker-pilot-${platform.name}${platform.name.includes('win') ? '.exe' : ''}`;
      const archiveName = `docker-pilot-v${this.version}-${platform.name}.tar.gz`;

      if (!fs.existsSync(path.join(this.binariesDir, executableName))) {
        continue;
      }

      const output = fs.createWriteStream(path.join(this.binariesDir, archiveName));
      const archive = archiver('tar', { gzip: true });

      archive.pipe(output);
      archive.file(path.join(this.binariesDir, executableName), { name: 'docker-pilot' });
      archive.file(path.join(__dirname, '../README.md'), { name: 'README.md' });
      archive.file(path.join(__dirname, '../LICENSE'), { name: 'LICENSE' });

      await archive.finalize();
      console.log(`✅ Created ${archiveName}`);
    }
  }

  async generateChecksums() {
    console.log('🔐 Generating checksums...');

    const files = fs.readdirSync(this.binariesDir)
      .filter(file => file.endsWith('.tar.gz') || file.endsWith('.exe'));

    const checksums = [];

    for (const file of files) {
      const filePath = path.join(this.binariesDir, file);
      const content = fs.readFileSync(filePath);
      const hash = createHash('sha256').update(content).digest('hex');
      checksums.push(`${hash}  ${file}`);
    }

    fs.writeFileSync(
      path.join(this.binariesDir, 'checksums.txt'),
      checksums.join('\n')
    );
  }

  async createReleaseNotes() {
    console.log('📝 Creating release notes...');

    const releaseNotes = `# Docker Pilot v${this.version}

## Downloads

### Linux
- [docker-pilot-v${this.version}-linux-x64.tar.gz](./docker-pilot-v${this.version}-linux-x64.tar.gz)

### macOS
- [docker-pilot-v${this.version}-macos-x64.tar.gz](./docker-pilot-v${this.version}-macos-x64.tar.gz)

### Windows
- [docker-pilot-v${this.version}-win-x64.tar.gz](./docker-pilot-v${this.version}-win-x64.tar.gz)

## Installation

### Linux/macOS
\`\`\`bash
curl -L https://github.com/your-org/docker-pilot/releases/download/v${this.version}/docker-pilot-v${this.version}-linux-x64.tar.gz | tar -xz
sudo mv docker-pilot /usr/local/bin/
\`\`\`

### Windows
Download the Windows archive and extract to a directory in your PATH.

## Verification

Verify the integrity of downloaded files using the provided checksums:
\`\`\`bash
sha256sum -c checksums.txt
\`\`\`
`;

    fs.writeFileSync(
      path.join(this.binariesDir, 'RELEASE_NOTES.md'),
      releaseNotes
    );
  }
}

if (require.main === module) {
  new PackageManager().packageAll();
}
```

## Docker Image Build

### Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS runtime

# Install Docker CLI
RUN apk add --no-cache docker-cli

# Create non-root user
RUN addgroup -g 1001 -S docker-pilot && \
    adduser -S docker-pilot -u 1001 -G docker-pilot

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Set ownership
RUN chown -R docker-pilot:docker-pilot /app

USER docker-pilot

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

ENTRYPOINT ["node", "index.js"]
```

### Docker Build Script

```bash
#!/bin/bash
# scripts/docker-build.sh

set -e

VERSION=${1:-latest}
IMAGE_NAME="docker-pilot"
REGISTRY=${DOCKER_REGISTRY:-""}

echo "🐳 Building Docker image..."

# Build multi-arch image
docker buildx create --use --name docker-pilot-builder 2>/dev/null || true

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ${REGISTRY}${IMAGE_NAME}:${VERSION} \
  --tag ${REGISTRY}${IMAGE_NAME}:latest \
  --push \
  .

echo "✅ Docker image built and pushed: ${REGISTRY}${IMAGE_NAME}:${VERSION}"
```

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build and Package

on:
  push:
    branches: [ main, develop ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${ { matrix.node-version } }
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Build
      run: npm run build

    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist-${ { matrix.node-version } }
        path: dist/

  package:
    needs: build
    runs-on: ${ { matrix.os } }

    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [18]

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${ { matrix.node-version } }
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: dist-${ { matrix.node-version } }
        path: dist/

    - name: Package executables
      run: npm run package

    - name: Upload executables
      uses: actions/upload-artifact@v3
      with:
        name: executables-${ { runner.os } }
        path: binaries/

  docker:
    needs: build
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Docker Hub
      if: github.event_name != 'pull_request'
      uses: docker/login-action@v2
      with:
        username: ${ { secrets.DOCKER_USERNAME } }
        password: ${ { secrets.DOCKER_PASSWORD } }

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: dockerpilot/docker-pilot
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version } }
          type=semver,pattern={{major } }.{{minor } }

    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: ${ { github.event_name != 'pull_request' } }
        tags: ${ { steps.meta.outputs.tags } }
        labels: ${ { steps.meta.outputs.labels } }

  release:
    if: startsWith(github.ref, 'refs/tags/')
    needs: [build, package, docker]
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Download all artifacts
      uses: actions/download-artifact@v3

    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        files: |
          executables-*/*
        generate_release_notes: true
        draft: false
        prerelease: false
      env:
        GITHUB_TOKEN: ${ { secrets.GITHUB_TOKEN } }
```

## Local Development Build

### Development Scripts

```json
{
  "scripts": {
    "dev": "ts-node src/index.ts",
    "dev:watch": "nodemon --exec ts-node src/index.ts",
    "dev:debug": "ts-node --inspect src/index.ts",
    "dev:build": "tsc --watch",
    "dev:test": "jest --watch",
    "dev:clean": "rimraf dist coverage .nyc_output"
  }
}
```

### Nodemon Configuration

```json
// nodemon.json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.test.ts", "src/**/*.spec.ts"],
  "exec": "ts-node src/index.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

## Build Optimization

### Bundle Analysis

```javascript
// scripts/analyze-bundle.js
import { execSync }  from "child_process";
import path  from "path";

// Gerar stats do webpack
execSync('npx webpack --json > webpack-stats.json', { stdio: 'inherit' });

// Analisar com webpack-bundle-analyzer
execSync('npx webpack-bundle-analyzer webpack-stats.json', { stdio: 'inherit' });
```

### Tree Shaking

```javascript
// webpack.config.js - configuração para tree shaking
module.exports = {
  // ...
  optimization: {
    usedExports: true,
    sideEffects: false,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production',
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug']
          }
        }
      })
    ]
  }
};
```

## Performance Monitoring

### Build Time Tracking

```javascript
// scripts/build-monitor.js
import { performance }  from "perf_hooks";

class BuildMonitor {
  constructor() {
    this.startTime = performance.now();
    this.phases = [];
  }

  startPhase(name) {
    this.currentPhase = {
      name,
      start: performance.now()
    };
  }

  endPhase() {
    if (this.currentPhase) {
      this.currentPhase.duration = performance.now() - this.currentPhase.start;
      this.phases.push(this.currentPhase);
      console.log(`⏱️  ${this.currentPhase.name}: ${this.currentPhase.duration.toFixed(2)}ms`);
      this.currentPhase = null;
    }
  }

  getTotalTime() {
    return performance.now() - this.startTime;
  }

  generateReport() {
    const total = this.getTotalTime();
    console.log('\n📊 Build Performance Report:');
    console.log(`Total build time: ${total.toFixed(2)}ms`);

    this.phases.forEach(phase => {
      const percentage = ((phase.duration / total) * 100).toFixed(1);
      console.log(`  ${phase.name}: ${phase.duration.toFixed(2)}ms (${percentage}%)`);
    });
  }
}

module.exports = BuildMonitor;
```

## Deployment Strategies

### NPM Publishing

```json
// .npmrc
registry=https://registry.npmjs.org/
access=public
```

```bash
#!/bin/bash
# scripts/publish.sh

set -e

# Verificar se está na branch main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Must be on main branch to publish"
  exit 1
fi

# Verificar se não há mudanças não commitadas
if [ ! -z "$(git status --porcelain)" ]; then
  echo "❌ Working directory must be clean"
  exit 1
fi

# Build e test
npm run build
npm test

# Publish
npm publish

echo "✅ Package published successfully!"
```

### GitHub Releases

```javascript
// scripts/create-release.js
import { Octokit }  from "@octokit/rest";
import fs  from "fs";

async function createRelease(version, changelog) {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  const release = await octokit.rest.repos.createRelease({
    owner: 'your-org',
    repo: 'docker-pilot',
    tag_name: `v${version}`,
    name: `Docker Pilot v${version}`,
    body: changelog,
    draft: false,
    prerelease: false
  });

  console.log(`✅ Release created: ${release.data.html_url}`);
  return release.data;
}
```

## Troubleshooting

### Build Issues Comuns

1. **TypeScript Compilation Errors**
```bash
# Limpar cache TypeScript
npx tsc --build --clean
rm -rf dist node_modules/.cache
```

2. **Dependency Issues**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

3. **Memory Issues**
```bash
# Aumentar heap size do Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

4. **Cross-platform Issues**
```bash
# Usar ferramentas cross-platform
npm install --save-dev cross-env rimraf
```

### Debug Build Process

```javascript
// Adicionar logging detalhado
console.log('Build environment:', {
  NODE_ENV: process.env.NODE_ENV,
  npm_lifecycle_event: process.env.npm_lifecycle_event,
  platform: process.platform,
  nodeVersion: process.version
});
```

Este guia de build fornece uma base sólida para compilar, empacotar e distribuir o Docker Pilot de forma eficiente e confiável em múltiplas plataformas.
