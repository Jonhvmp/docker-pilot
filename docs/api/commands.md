# Commands API

Docker Pilot offers a comprehensive set of commands for managing your Docker services and containers efficiently.

## Main Commands

### docker-pilot start

Start one or more services.

```bash
docker-pilot start <service-name>
docker-pilot start <service1> <service2> <service3>
docker-pilot start --all
```

**Options:**
- `--detach, -d`: Run in detached mode
- `--build`: Rebuild images before starting
- `--force-recreate`: Force recreation of containers
- `--no-deps`: Don't start linked services
- `--timeout <seconds>`: Shutdown timeout (default: 10s)

**Examples:**
```bash
# Start specific service
docker-pilot start database

# Start multiple services
docker-pilot start api frontend database

# Start all services
docker-pilot start --all

# Start with rebuild
docker-pilot start api --build
```

### docker-pilot stop

Stop one or more services.

```bash
docker-pilot stop <service-name>
docker-pilot stop <service1> <service2>
docker-pilot stop --all
```

**Options:**
- `--timeout <seconds>`: Shutdown timeout (default: 10s)
- `--force`: Forçar parada (kill ao invés de stop)

**Exemplos:**
```bash
# Parar serviço específico
docker-pilot stop database

# Parar todos os serviços
docker-pilot stop --all

# Parar com timeout personalizado
docker-pilot stop api --timeout 30
```

### docker-pilot restart

Reinicia um ou mais serviços.

```bash
docker-pilot restart <service-name>
docker-pilot restart --all
```

**Opções:**
- `--timeout <seconds>`: Timeout para parada (padrão: 10s)
- `--build`: Reconstruir imagens antes de reiniciar
- `--force-recreate`: Forçar recriação dos contêineres

**Exemplos:**
```bash
# Reiniciar serviço específico
docker-pilot restart api

# Reiniciar com rebuild
docker-pilot restart api --build
```

### docker-pilot status

Mostra o status dos serviços.

```bash
docker-pilot status
docker-pilot status <service-name>
```

**Opções:**
- `--format <table|json|yaml>`: Formato de saída
- `--watch, -w`: Modo watch (atualização contínua)
- `--refresh <seconds>`: Intervalo de atualização no modo watch

**Exemplos:**
```bash
# Status de todos os serviços
docker-pilot status

# Status em formato JSON
docker-pilot status --format json

# Modo watch com atualização a cada 2 segundos
docker-pilot status --watch --refresh 2
```

### docker-pilot logs

Visualiza logs dos serviços.

```bash
docker-pilot logs <service-name>
docker-pilot logs --all
```

**Opções:**
- `--follow, -f`: Seguir logs em tempo real
- `--tail <number>`: Mostrar apenas as últimas N linhas
- `--since <timestamp>`: Mostrar logs desde timestamp
- `--until <timestamp>`: Mostrar logs até timestamp
- `--timestamps`: Incluir timestamps
- `--no-color`: Desabilitar cores

**Exemplos:**
```bash
# Logs de um serviço
docker-pilot logs api

# Logs em tempo real
docker-pilot logs api --follow

# Últimas 100 linhas
docker-pilot logs api --tail 100

# Logs desde ontem
docker-pilot logs api --since "24h"
```

## Comandos de Configuração

### docker-pilot config

Gerencia configurações do projeto.

```bash
docker-pilot config <subcommand>
```

**Subcomandos:**

#### docker-pilot config init

Inicializa configuração em um novo projeto.

```bash
docker-pilot config init
docker-pilot config init --template <template-name>
```

**Templates disponíveis:**
- `web`: Aplicação web (frontend + backend + database)
- `api`: API REST
- `microservices`: Arquitetura de microsserviços
- `basic`: Configuração básica

#### docker-pilot config validate

Valida arquivos de configuração.

```bash
docker-pilot config validate
docker-pilot config validate <config-file>
```

#### docker-pilot config show

Mostra configuração atual.

```bash
docker-pilot config show
docker-pilot config show --format <yaml|json>
```

#### docker-pilot config set

Define valores de configuração.

```bash
docker-pilot config set <key> <value>
```

**Exemplos:**
```bash
docker-pilot config set project.name "My Project"
docker-pilot config set services.api.port 3000
```

#### docker-pilot config get

Obtém valores de configuração.

```bash
docker-pilot config get <key>
```

## Comandos de Build

### docker-pilot build

Constrói imagens dos serviços.

```bash
docker-pilot build
docker-pilot build <service-name>
```

**Opções:**
- `--no-cache`: Não usar cache de build
- `--pull`: Sempre puxar imagens base mais recentes
- `--parallel`: Build em paralelo
- `--progress <auto|plain|tty>`: Tipo de saída do progresso

**Exemplos:**
```bash
# Build de todos os serviços
docker-pilot build

# Build sem cache
docker-pilot build --no-cache

# Build paralelo
docker-pilot build --parallel
```

### docker-pilot push

Envia imagens para registry.

```bash
docker-pilot push
docker-pilot push <service-name>
```

**Opções:**
- `--registry <url>`: Registry de destino
- `--tag <tag>`: Tag a ser aplicada

## Comandos de Rede

### docker-pilot network

Gerencia redes Docker.

```bash
docker-pilot network <subcommand>
```

**Subcomandos:**

#### docker-pilot network list

Lista redes do projeto.

```bash
docker-pilot network list
```

#### docker-pilot network create

Cria nova rede.

```bash
docker-pilot network create <network-name>
```

#### docker-pilot network remove

Remove rede.

```bash
docker-pilot network remove <network-name>
```

## Comandos de Volume

### docker-pilot volume

Gerencia volumes Docker.

```bash
docker-pilot volume <subcommand>
```

**Subcomandos:**

#### docker-pilot volume list

Lista volumes do projeto.

```bash
docker-pilot volume list
```

#### docker-pilot volume create

Cria novo volume.

```bash
docker-pilot volume create <volume-name>
```

#### docker-pilot volume remove

Remove volume.

```bash
docker-pilot volume remove <volume-name>
```

#### docker-pilot volume backup

Faz backup de volume.

```bash
docker-pilot volume backup <volume-name> <backup-path>
```

#### docker-pilot volume restore

Restaura volume de backup.

```bash
docker-pilot volume restore <volume-name> <backup-path>
```

## Comandos de Plugin

### docker-pilot plugin

Gerencia plugins do Docker Pilot.

```bash
docker-pilot plugin <subcommand>
```

**Subcomandos:**

#### docker-pilot plugin list

Lista plugins instalados.

```bash
docker-pilot plugin list
```

#### docker-pilot plugin install

Instala novo plugin.

```bash
docker-pilot plugin install <plugin-name>
docker-pilot plugin install <git-url>
docker-pilot plugin install <local-path>
```

#### docker-pilot plugin remove

Remove plugin.

```bash
docker-pilot plugin remove <plugin-name>
```

#### docker-pilot plugin enable

Habilita plugin.

```bash
docker-pilot plugin enable <plugin-name>
```

#### docker-pilot plugin disable

Desabilita plugin.

```bash
docker-pilot plugin disable <plugin-name>
```

## Comandos de Monitoramento

### docker-pilot monitor

Inicia monitoramento de serviços.

```bash
docker-pilot monitor
docker-pilot monitor <service-name>
```

**Opções:**
- `--metrics`: Mostrar métricas detalhadas
- `--alerts`: Mostrar apenas alertas
- `--export <file>`: Exportar dados para arquivo

### docker-pilot health

Verifica saúde dos serviços.

```bash
docker-pilot health
docker-pilot health <service-name>
```

**Opções:**
- `--format <table|json|yaml>`: Formato de saída
- `--timeout <seconds>`: Timeout para verificação

## Comandos de Backup

### docker-pilot backup

Faz backup do projeto.

```bash
docker-pilot backup <backup-path>
```

**Opções:**
- `--include-volumes`: Incluir volumes
- `--include-images`: Incluir imagens
- `--compress`: Comprimir backup

### docker-pilot restore

Restaura projeto de backup.

```bash
docker-pilot restore <backup-path>
```

**Opções:**
- `--force`: Forçar restauração
- `--exclude-volumes`: Excluir volumes

## Comandos de Utilitários

### docker-pilot exec

Executa comando em contêiner.

```bash
docker-pilot exec <service-name> <command>
```

**Opções:**
- `--interactive, -i`: Modo interativo
- `--tty, -t`: Alocar TTY
- `--user <user>`: Usuário para execução

**Exemplos:**
```bash
# Shell interativo
docker-pilot exec api bash

# Comando específico
docker-pilot exec database psql -U postgres
```

### docker-pilot shell

Abre shell em contêiner.

```bash
docker-pilot shell <service-name>
```

**Opções:**
- `--shell <shell>`: Tipo de shell (bash, sh, zsh)
- `--user <user>`: Usuário

### docker-pilot clean

Limpa recursos não utilizados.

```bash
docker-pilot clean
```

**Opções:**
- `--all`: Limpar tudo (imagens, volumes, redes)
- `--images`: Limpar apenas imagens
- `--volumes`: Limpar apenas volumes
- `--networks`: Limpar apenas redes
- `--force`: Não pedir confirmação

### docker-pilot update

Atualiza Docker Pilot.

```bash
docker-pilot update
```

**Opções:**
- `--check`: Apenas verificar atualizações
- `--beta`: Instalar versão beta

### docker-pilot version

Mostra informações de versão.

```bash
docker-pilot version
```

**Opções:**
- `--short`: Mostrar apenas número da versão
- `--build`: Incluir informações de build

## Comandos Globais

Opções disponíveis para todos os comandos:

- `--help, -h`: Mostrar ajuda
- `--version, -v`: Mostrar versão
- `--config <file>`: Arquivo de configuração personalizado
- `--project-dir <dir>`: Diretório do projeto
- `--env-file <file>`: Arquivo de variáveis de ambiente
- `--verbose`: Modo verboso
- `--quiet, -q`: Modo silencioso
- `--no-color`: Desabilitar cores
- `--log-level <level>`: Nível de log (debug, info, warn, error)

## Autocompletar

Configure autocompletar para seu shell:

### Bash

```bash
# Adicionar ao ~/.bashrc
eval "$(docker-pilot completion bash)"
```

### Zsh

```bash
# Adicionar ao ~/.zshrc
eval "$(docker-pilot completion zsh)"
```

### PowerShell

```powershell
# Adicionar ao perfil do PowerShell
docker-pilot completion powershell | Out-String | Invoke-Expression
```

### Fish

```fish
# Adicionar ao ~/.config/fish/config.fish
docker-pilot completion fish | source
```

## Aliases Úteis

Configure aliases para comandos frequentes:

```bash
# ~/.bashrc ou ~/.zshrc
alias dp="docker-pilot"
alias dps="docker-pilot status"
alias dpl="docker-pilot logs"
alias dpstart="docker-pilot start"
alias dpstop="docker-pilot stop"
alias dprestart="docker-pilot restart"
```

## Veja Também

- [Menu Interativo](interactive-menu.md)
- [CLI Usage](cli-usage.md)
- [Configuração](../getting-started/configuration.md)
- [Exemplos](../examples/basic.md)
