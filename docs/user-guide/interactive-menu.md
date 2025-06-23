# Interactive Menu

Docker Pilot offers an intuitive interactive menu that allows you to easily navigate through system functionalities without the need to memorize commands. The menu now includes enhanced docker-compose file management with recursive discovery capabilities.

## Overview

The interactive menu is the primary interface of Docker Pilot, presenting all available options in an organized and user-friendly manner. It automatically detects docker-compose files throughout your project directory structure and provides comprehensive management tools.

## Accessing the Menu

To access the interactive menu, run Docker Pilot without arguments:

```bash
docker-pilot
```

Or use the specific command:

```bash
docker-pilot menu
```

## Menu Structure

### Main Menu

The main menu presents the following options organized by categories:

```
┌─────────────────────────────────────────────────────────┐
│              Docker Pilot v2.0.4 🐳                    │
├─────────────────────────────────────────────────────────┤
│ 🚀 Basic Commands                                       │
│  1. Quick setup (detect services)                      │
│  2. Start all services                                  │
│  3. Stop all services                                   │
│  4. Restart all services                                │
│  5. Rebuild and start all services                      │
│  6. View logs of all services                           │
│  7. View services status                                │
│                                                         │
│ 🛠️ Advanced Commands                                    │
│  8. Open shell in service                               │
│  9. Check services health                               │
│ 10. Monitor in real time                                │
│ 11. Update all images                                   │
│                                                         │
│ 📄 Compose Files Management                             │
│ 12. List docker-compose files                          │
│ 13. Find docker-compose files                          │
│ 14. Analyze docker-compose file                        │
│ 15. Validate docker-compose file                       │
│ 16. List services from compose                         │
│                                                         │
│ ⚙️ Maintenance                                          │
│ 17. Clean unused resources                              │
│ 18. Deep clean                                          │
│ 19. Show configuration                                  │
│ 20. Advanced settings                                   │
│                                                         │
│ 🔧 [Service-specific commands...]                       │
│                                                         │
│  0. Exit                                                │
└─────────────────────────────────────────────────────────┘
```

### 1. Basic Commands

Essential Docker operations for quick project management:

- **Quick setup**: Automatically detect and configure services from docker-compose files
- **Start all services**: Launch all configured services
- **Stop all services**: Stop all running services
- **Restart all services**: Restart all services
- **Rebuild and start**: Rebuild images and start services
- **View logs**: Display logs from all services
- **Service status**: Show detailed status of all services

### 2. Advanced Commands

Advanced operations for development and troubleshooting:

- **Open shell**: Interactive shell access to any service container
- **Health check**: Comprehensive health status of all services
- **Real-time monitor**: Live monitoring with automatic refresh
- **Update images**: Pull latest images and rebuild

### 3. Compose Files Management

**New Enhanced Feature**: Comprehensive docker-compose file management with recursive discovery:

- **List docker-compose files**: Recursively discover and list all docker-compose files in the project
  - Shows file size, modification date, and service count
  - Identifies main files vs. environment-specific variants
  - Displays relative paths and directory structure
  - Supports variants like `docker-compose.dev.yml`, `docker-compose.prod.yml`

- **Find docker-compose files**: Search for compose files in specific directories
  - Configurable search depth (default: 6 levels)
  - Includes environment variants and overrides
  - Excludes empty or malformed files

- **Analyze docker-compose file**: Detailed analysis of compose file structure
  - Service configuration details (images, ports, volumes)
  - Network and volume definitions
  - Environment variables and dependencies
  - Health check configurations
  - Build contexts and Dockerfile references

- **Validate docker-compose file**: Syntax and structure validation
  - YAML syntax validation
  - Docker Compose schema compliance
  - Service dependency validation
  - Port conflict detection
  - Missing image/build validation

- **List services from compose**: Extract and display all services defined in compose files
  - Service names and descriptions
  - Port mappings and exposed services
  - Dependency relationships

### 4. Maintenance

System maintenance and configuration:

- **Clean unused resources**: Remove dangling images, stopped containers
- **Deep clean**: Comprehensive cleanup including volumes and networks
- **Show configuration**: Display current Docker Pilot configuration
- **Advanced settings**: Access language settings, log levels, and development options

## Automatic Project Detection

### Recursive Docker Compose Discovery

When Docker Pilot starts, it automatically performs a recursive search for docker-compose files throughout your project directory structure:

```
🔍 Searching for docker-compose files recursively...
📁 Search depth: 6 levels

Found 3 docker-compose files:

1. docker-compose.yml 🎯📁
   📏 2.1 KB | 📅 22/06/2025
   🛠️ 4 services: web, api, database, redis

2. backend/docker-compose.dev.yml (development) 📂(2)
   📏 1.8 KB | 📅 21/06/2025
   🛠️ 2 services: api-dev, database-dev

3. frontend/docker-compose.override.yml 📂(2)
   📏 0.9 KB | 📅 20/06/2025
   🛠️ 1 services: web-dev
```

### Smart File Prioritization

Docker Pilot uses intelligent prioritization to select the most appropriate compose file:

1. **Main files** (`docker-compose.yml`, `compose.yml`) get highest priority 🎯
2. **Root directory** files are preferred over subdirectory files 📁
3. **Larger files** with more services are prioritized
4. **Recently modified** files get preference
5. **Environment variants** are clearly identified

### Multi-File Project Support

For projects with multiple compose files, Docker Pilot allows you to:

- **Select specific file**: Choose which compose file to use for operations
- **View file details**: See comprehensive information about each file
- **Switch between files**: Change active compose file during session
- **Validate all files**: Check syntax and structure of all discovered files

### Smart File Selection

When multiple compose files are found, the menu provides an interactive selection:

```
📄 Multiple docker-compose files found. Please select:

1. ./docker-compose.yml (4 services: web, api, db, redis) 🎯📁
2. ./backend/docker-compose.dev.yml (development) 📂(2)
3. ./frontend/compose.override.yml 📂(2)

Enter your choice (1-3, or Enter for default):
```

### Real-time Information Display

Each menu option shows contextual information:

- **Service count** and names
- **File size** and modification date
- **Environment type** (dev, prod, test, etc.)
- **Directory depth** indicator
- **Main file** indicator 🎯

## Navigation

### Navigation Keys

- **↑/↓**: Navigate between options
- **Enter**: Select option
- **Esc**: Return to previous menu
- **q**: Exit program
- **h**: Mostrar ajuda contextual

### Atalhos

- **Ctrl+C**: Sair imediatamente
- **Ctrl+R**: Recarregar menu
- **Ctrl+L**: Limpar tela
- **F1**: Ajuda
- **F5**: Atualizar dados

## Personalização

### Temas

O menu suporta diferentes temas visuais:

```yaml
# config/ui.yml
theme:
  name: "default"  # default, dark, light, minimal
  colors:
    primary: "#0066cc"
    secondary: "#6c757d"
    success: "#28a745"
    warning: "#ffc107"
    error: "#dc3545"
```

### Layout

Configure o layout do menu:

```yaml
# config/ui.yml
layout:
  width: 80          # Largura em caracteres
  height: 25         # Altura em linhas
  border: true       # Mostrar bordas
  icons: true        # Mostrar ícones
  colors: true       # Usar cores
```

## Modo Avançado

### Filtros Rápidos

Use filtros para encontrar opções rapidamente:

- Digite `/` seguido do termo de busca
- Use `*` como coringa
- Pressione `Tab` para autocompletar

### Histórico de Comandos

O menu mantém histórico das últimas ações:

- **Ctrl+H**: Mostrar histórico
- **↑/↓**: Navegar no histórico
- **Enter**: Executar comando do histórico

### Macros

Configure macros para ações repetitivas:

```yaml
# config/macros.yml
macros:
  start_dev:
    name: "Iniciar Ambiente de Desenvolvimento"
    commands:
      - "start database"
      - "start api"
      - "start frontend"

  deploy_prod:
    name: "Deploy para Produção"
    commands:
      - "build production"
      - "push images"
      - "deploy stack"
```

## Acessibilidade

### Suporte a Leitores de Tela

O menu é compatível com leitores de tela:

- Descrições detalhadas de cada opção
- Navegação por teclas
- Anúncios de mudanças de estado

### Alto Contraste

Ative o modo alto contraste:

```bash
docker-pilot --high-contrast
```

### Configuração de Fonte

Ajuste o tamanho da fonte no terminal:

```yaml
# config/accessibility.yml
accessibility:
  high_contrast: false
  large_font: false
  screen_reader: false
  keyboard_only: false
```

## Resolução de Problemas

### Menu Não Carrega

Se o menu não carregar corretamente:

1. Verifique a configuração:
   ```bash
   docker-pilot config validate
   ```

2. Limpe o cache:
   ```bash
   docker-pilot cache clear
   ```

3. Reinicie com configuração padrão:
   ```bash
   docker-pilot --reset-config
   ```

### Caracteres Especiais

Se os caracteres especiais não aparecem corretamente:

1. Configure a codificação do terminal:
   ```bash
   chcp 65001  # Windows
   export LANG=pt_BR.UTF-8  # Linux/Mac
   ```

2. Use o modo compatibilidade:
   ```bash
   docker-pilot --ascii-only
   ```

### Performance

Para melhorar a performance do menu:

```yaml
# config/performance.yml
performance:
  cache_menu: true
  lazy_load: true
  animation: false
  refresh_interval: 5000  # ms
```

## Integração com IDEs

### Visual Studio Code

Instale a extensão Docker Pilot para VS Code:

```bash
code --install-extension docker-pilot.vscode-extension
```

### IntelliJ IDEA

Configure o plugin Docker Pilot:

1. Vá em **File > Settings > Plugins**
2. Procure por "Docker Pilot"
3. Instale e configure

## Scripts e Automação

### Usando Comandos via CLI

Os novos recursos de gerenciamento de compose também estão disponíveis via linha de comando:

```bash
# Listar todos os arquivos docker-compose recursivamente
docker-pilot compose list --variants

# Buscar arquivos compose em diretório específico
docker-pilot compose find /path/to/project

# Analisar arquivo compose específico
docker-pilot compose analyze docker-compose.yml

# Validar todos os arquivos compose encontrados
docker-pilot compose validate docker-compose.dev.yml

# Listar serviços de um arquivo compose
docker-pilot compose services

# Buscar com profundidade personalizada
docker-pilot compose list --depth 8
```

### Automação de Menu

Execute opções do menu via script:

```bash
# Executar opção específica
docker-pilot menu --option="1.1"  # Listar serviços

# Executar sequência de opções
docker-pilot menu --sequence="1,2,3"

# Executar macro
docker-pilot menu --macro="start_dev"
```

### Integração com CI/CD

Use o menu em pipelines de CI/CD:

```yaml
# .github/workflows/deploy.yml
- name: Deploy services
  run: |    docker-pilot menu --option="deploy" --non-interactive
```

## Recursos Avançados do Docker Pilot 2.0

### Detecção Inteligente de Projetos

O Docker Pilot 2.0 introduz detecção inteligente que:

- **Busca recursiva**: Procura arquivos docker-compose em até 6 níveis de profundidade
- **Priorização inteligente**: Identifica automaticamente o arquivo principal do projeto
- **Suporte a variantes**: Reconhece arquivos de desenvolvimento, produção e teste
- **Análise detalhada**: Extrai informações sobre serviços, portas e dependências

### Sistema de i18n Completo

Interface totalmente traduzida com suporte a:

- **Português (Brasil)**: Tradução completa de todos os menus e mensagens
- **English**: Interface em inglês para usuários internacionais
- **Troca dinâmica**: Altere o idioma sem reiniciar o sistema
- **Mensagens contextuais**: Todas as mensagens incluem contexto relevante

### Performance Otimizada

Melhorias significativas de performance:

- **Cache inteligente**: Reutilização de resultados de busca
- **Busca assíncrona**: Operações não bloqueiam a interface
- **Carregamento lazy**: Informações carregadas sob demanda
- **Formatação otimizada**: Exibição rápida de informações de arquivos

### Gerenciamento Avançado de Arquivos

Sistema robusto de gerenciamento de compose files:

- **Análise estrutural**: Validação completa da estrutura YAML
- **Detecção de conflitos**: Identifica conflitos de portas e dependências
- **Informações detalhadas**: Tamanho, data de modificação, serviços
- **Validação em tempo real**: Verificação de sintaxe e estrutura

## Contribuindo

Para contribuir com melhorias no menu interativo:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Faça suas alterações
4. Teste a interface
5. Envie um pull request

### Testando Alterações

Execute os testes de interface:

```bash
npm run test:ui
npm run test:menu
npm run test:accessibility
```

## Veja Também

- [Comandos CLI](cli-usage.md) - Referência completa de comandos, incluindo `compose`
- [Configuração](../getting-started/configuration.md) - Como configurar detecção de arquivos
- [Gerenciamento de Arquivos Compose](../advanced/docker-integration.md) - Recursos avançados de compose
- [Internacionalização](i18n.md) - Configuração de idiomas e localização
- [Plugins](../advanced/plugins.md) - Extensões e personalizações
- [Arquitetura](../development/architecture.md) - Como funciona a detecção recursiva
