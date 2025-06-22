# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-01

### ✨ Adicionado

#### 🏗️ Arquitetura Principal
- **DockerPilot**: Classe principal para gerenciamento de containers Docker
- **ConfigManager**: Gerenciamento robusto de configurações com validação
- **ServiceManager**: Controle completo do ciclo de vida dos serviços
- **CommandRunner**: Execução segura de comandos Docker

#### 🎯 Funcionalidades Core
- **Gerenciamento de Serviços**: Start, stop, restart, build, rebuild
- **Monitoramento**: Status em tempo real, logs, métricas de desempenho
- **Configuração Flexível**: JSON/YAML com auto-detecção de serviços
- **Sistema de Backup**: Backup automático para bancos de dados
- **Health Checks**: Verificação de saúde dos serviços

#### 🔌 Sistema de Plugins
- **PluginManager**: Carregamento e gerenciamento de plugins
- **BasePlugin**: Classe base para criação de plugins customizados
- **Hook System**: Sistema de hooks para extensibilidade

#### 🖥️ Interface CLI
- **CLI Completa**: Interface de linha de comando intuitiva
- **Comandos Avançados**: up, down, status, logs, build, scale
- **Opções Globais**: Configuração flexível via argumentos
- **Help System**: Sistema de ajuda contextual

#### 🛠️ Utilitários
- **DockerUtils**: Operações Docker de baixo nível
- **FileUtils**: Manipulação de arquivos com suporte a YAML/JSON
- **Logger**: Sistema de logging configurável
- **ValidationUtils**: Validação robusta de configurações

#### 📊 Monitoramento Avançado
- **Status em Tempo Real**: Monitoramento contínuo de serviços
- **Métricas de Performance**: CPU, memória, rede, disco
- **Health Monitoring**: Verificação automática de saúde
- **Alertas Configuráveis**: Sistema de notificações

#### 💾 Sistema de Backup
- **Backup Automático**: Agendamento de backups
- **Múltiplos Bancos**: PostgreSQL, MySQL, Redis, MongoDB
- **Compressão**: Otimização de espaço de armazenamento
- **Retenção**: Política de limpeza automática

#### 🎨 Developer Experience
- **TypeScript**: Tipagem completa para IDE support
- **Auto-completion**: IntelliSense para todas as APIs
- **Error Handling**: Tratamento robusto de erros
- **Debugging**: Logs detalhados para troubleshooting

#### 🚀 Performance
- **Operações Assíncronas**: Execução não-bloqueante
- **Cache Inteligente**: Otimização de consultas repetidas
- **Parallel Execution**: Operações paralelas quando possível
- **Resource Management**: Gestão eficiente de recursos

#### 📦 Ecosystem
- **NPM Package**: Publicação no registro NPM
- **CLI Global**: Instalação global para uso em qualquer projeto
- **Library Usage**: Uso programático em aplicações
- **Docker Integration**: Integração nativa com Docker/Compose

### 🔧 Detalhes Técnicos

#### Dependências Principais
- **TypeScript**: Linguagem principal
- **Node.js**: Runtime (>= 18.0.0)
- **Docker**: Container runtime (>= 20.0.0)
- **Docker Compose**: Orquestração (>= 2.0.1)

#### Dependências de Desenvolvimento
- **Zod**: Validação de schemas
- **fs-extra**: Operações de sistema de arquivos
- **glob**: Pattern matching de arquivos
- **yaml**: Parsing de arquivos YAML
- **chalk**: Colorização de terminal
- **commander**: CLI framework
- **inquirer**: Prompts interativos
- **ora**: Loading spinners
- **semver**: Versionamento semântico

#### Estrutura do Projeto
```
src/
├── core/           # Classes principais
├── commands/       # Comandos CLI
├── plugins/        # Sistema de plugins
├── utils/          # Utilitários
├── types/          # Definições TypeScript
├── cli.ts          # Interface CLI
└── index.ts        # Entry point
```

### 📋 Configuração Padrão

```json
{
  "projectName": "Docker Project",
  "dockerCompose": "docker compose",
  "services": {
    "app": {
      "port": 3000,
      "description": "Main application",
      "healthCheck": true,
      "backupEnabled": false
    }
  },
  "cli": {
    "welcomeMessage": `Bem-vindo ao {projectName} Docker Pilot! 🐳`,
    "confirmDestructiveActions": true
  },
  "backup": {
    "enabled": true,
    "directory": "./backups",
    "retention": 7
  },
  "monitoring": {
    "enabled": true,
    "refreshInterval": 5
  }
}
```

### 🎯 Casos de Uso Suportados

- **Projetos Pequenos**: Aplicações simples com poucos serviços
- **Projetos Médios**: APIs com banco de dados e cache
- **Projetos Grandes**: Microserviços complexos
- **Enterprise**: Sistemas de grande escala com múltiplos ambientes

### 🔄 Comandos CLI Disponíveis

```bash
docker-pilot up [service]              # Iniciar serviços
docker-pilot down [service]             # Parar serviços
docker-pilot restart [service]          # Reiniciar serviços
docker-pilot status [service]           # Ver status
docker-pilot build [service]            # Construir imagens
docker-pilot rebuild [service]          # Reconstruir
docker-pilot logs [service]             # Ver logs
docker-pilot shell [service]            # Abrir shell
docker-pilot scale [service] <count>    # Escalar serviço
docker-pilot backup [service]           # Fazer backup
docker-pilot restore <file>             # Restaurar backup
docker-pilot clean                      # Limpar recursos
docker-pilot config                     # Ver configuração
docker-pilot scan                       # Detectar serviços
```

### 🌟 Highlights da Release

1. **Arquitetura Escalável**: Suporta desde projetos pequenos até enterprise
2. **TypeScript Nativo**: Tipagem completa e IntelliSense
3. **CLI Intuitivo**: Interface amigável inspirada nas melhores práticas
4. **Sistema de Plugins**: Extensibilidade total através de plugins
5. **Monitoramento Avançado**: Métricas em tempo real e health checks
6. **Backup Inteligente**: Sistema automático de backup e restore
7. **Zero Configuration**: Funciona out-of-the-box com detecção automática
8. **Cross-Platform**: Suporte para Windows, macOS e Linux

### 🎨 Filosofia de Design

- **Developer First**: Foco na experiência do desenvolvedor
- **Convention over Configuration**: Funciona sem configuração, configurável quando necessário
- **Scalability**: Cresce com o projeto
- **Reliability**: Robusto e tolerante a falhas
- **Simplicity**: Interface simples para operações complexas

### 📈 Roadmap Futuro

- **v1.1.0**: Kubernetes support
- **v1.2.0**: Web dashboard
- **v1.3.0**: CI/CD integrations
- **v1.4.0**: Multi-environment management
- **v1.5.0**: Cloud provider integrations

### 🙏 Agradecimentos

Agradecemos à comunidade Docker e às ferramentas que tornaram este projeto possível:
- Docker & Docker Compose teams
- Node.js community
- TypeScript team
- Open source contributors

---

## 📝 Notas da Release

Esta é a primeira release major do Docker Pilot. A biblioteca foi projetada para ser:

- **Estável**: API consistente e bem documentada
- **Performante**: Otimizada para operações rápidas
- **Extensível**: Sistema de plugins robusto
- **Manutenível**: Código limpo e bem estruturado

### 🎯 Target Audience

- **Desenvolvedores Node.js**: Que trabalham com Docker no dia a dia
- **DevOps Engineers**: Que precisam de automação Docker
- **Teams**: Que querem padronizar workflows Docker
- **Empresas**: Que buscam ferramentas enterprise-ready

### 🚀 Getting Started

```bash
# Instalação
npm install -g docker-pilot

# Uso básico
cd meu-projeto
docker-pilot scan    # Detectar serviços
docker-pilot up      # Iniciar todos os serviços
docker-pilot status  # Ver status
```

### 📚 Documentação

- **README**: Documentação principal
- **API Docs**: Referência completa da API
- **Examples**: Exemplos práticos de uso
- **CLI Help**: Ajuda contextual integrada

Para mais informações, visite: [GitHub Repository](https://github.com/Jonhvmp/docker-pilot)

---

## [1.1.0] - 2025-06-22

### ✨ Adicionado
- **Menu Interativo**: Sistema completo de menu interativo no terminal
  - Navegação por categorias organizadas (Básicos, Avançados, Manutenção, por Serviço)
  - Detecção automática de serviços configurados
  - Verificação automática do status do Docker
  - Fluxo de continuação após comandos
  - Interface amigável similar aos CLIs clássicos
- **Novos comandos CLI**:
  - `docker-pilot` (sem argumentos) - Inicia menu interativo
  - `docker-pilot --interactive` ou `-i` - Inicia menu interativo
- **Melhorias na arquitetura**:
  - `InteractiveMenu` class para gerenciar o menu interativo
  - Métodos `getCommandRunner()` e `getServiceManager()` no DockerPilot
  - Método `executeCommand()` para execução programática de comandos
- **Integração completa** com todos os comandos existentes
- **Tratamento robusto de erros** no modo interativo

### 🔧 Alterado
- CLI agora inicia modo interativo por padrão quando executado sem argumentos
- Help atualizado para incluir opções do menu interativo
- Melhor tratamento de tipos TypeScript para evitar erros de compilação

### 📚 Documentação
- Documentação completa do menu interativo no README
- Exemplos de uso do modo interativo
- Screenshots e fluxos de uso

### 🛠️ Técnico
- Nova dependência: `inquirer` para funcionalidades interativas futuras
- Estrutura modular preparada para expansões futuras
- Compatibilidade total com modo CLI tradicional

### 🎯 Impacto
- **Experiência do usuário**: Interface muito mais amigável e intuitiva
- **Produtividade**: Navegação rápida entre comandos sem precisar lembrar sintaxe
- **Descoberta**: Usuários podem explorar funcionalidades através do menu
- **Compatibilidade**: 100% compatível com uso programático e CLI tradicional

---

## [2.0.1] - 2025-06-22

### 🌍 Nova Funcionalidade: Suporte Multi-idioma
- **Integração completa do sistema de i18n**
  - Suporte total para português brasileiro (pt-br) e inglês (en)
  - Detecção automática do idioma do sistema
  - Todas as mensagens, logs, menus e feedbacks traduzidos
  - Menu de configurações avançadas com opção de mudança de idioma

### 🔧 CLI Melhorado
- **Interface totalmente traduzida**
  - Help e documentação em pt-br/en
  - Mensagens de erro e sucesso traduzidas
  - Comandos e opções localizados

### 📋 Menu Interativo
- **Experiência completamente localizada**
  - Todos os menus e submenus traduzidos
  - Configurações avançadas com troca de idioma em tempo real
  - Status e feedback dos comandos em português/inglês

### 🎯 Core System
- **DockerPilot aprimorado**
  - Método `updateLanguage()` para mudança programática
  - Eventos de mudança de idioma
  - Configuração persistente do idioma escolhido

### 🛠️ ServiceManager
- **Integração completa com i18n**
  - Todas as operações de serviços traduzidas
  - Logs de status e erro localizados
  - Feedback de comandos em pt-br/en

### 📊 Sistema de Configuração
- **Suporte a idioma na configuração**
  - Campo `language` no docker-pilot.config.json
  - Detecção e configuração automática na primeira execução
  - Sincronização entre todos os componentes

### 🚀 Experiência do Usuário
- **Fluxo totalmente localizado**
  - Primeira execução com prompt de escolha de idioma
  - Troca dinâmica de idioma sem reinicialização
  - Consistência total da interface

### ✨ Melhorias Técnicas
- **Arquitetura robusta de i18n**
  - Sistema de fallback para inglês
  - Suporte a interpolação de variáveis
  - Validação e tipagem TypeScript
  - Performance otimizada

### 📚 Documentação
- **README atualizado**
  - Seção dedicada ao suporte multi-idioma
  - Exemplos de uso em ambos os idiomas
  - Guia de configuração localizada

### 🔄 Breaking Changes
- **Configuração**
  - Adicionado campo obrigatório `language` no config
  - Mudança na estrutura de alguns métodos internos

### 🐛 Correções
- **Integração CLI**
  - Correção de mensagens hardcoded
  - Sincronização de idioma entre componentes
  - Validação de tipagem TypeScript

---
