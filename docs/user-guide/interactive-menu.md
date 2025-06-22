# Interactive Menu

Docker Pilot offers an intuitive interactive menu that allows you to easily navigate through system functionalities without the need to memorize commands.

## Overview

The interactive menu is the primary interface of Docker Pilot, presenting all available options in an organized and user-friendly manner.

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

The main menu presents the following options:

```
┌─────────────────────────────────────┐
│         Docker Pilot v1.0.0         │
├─────────────────────────────────────┤
│ 1. Service Management               │
│ 2. Configuration                    │
│ 3. Monitoring                       │
│ 4. Plugins                          │
│ 5. Language Settings                │
│ 6. Help                             │
│ 7. Exit                             │
└─────────────────────────────────────┘
```

### 1. Service Management

Submenu for Docker service management:

- **List Services**: View all configured services
- **Start Service**: Start one or more services
- **Stop Service**: Stop running services
- **Restart Service**: Restart services
- **Service Status**: Check detailed status
- **Logs**: View service logs

### 2. Configuration

System configuration options:

- **Global Configuration**: General Docker Pilot settings
- **Service Configuration**: Configure individual services
- **Environment Configuration**: Environment variables
- **Network Configuration**: Docker network settings
- **Backup/Restore**: Backup and restore configurations

### 3. Monitoring

Monitoring tools:

- **Dashboard**: Real-time control panel
- **Metrics**: View performance metrics
- **Alerts**: Configure and view alerts
- **Reports**: Generate usage reports
- **Health Check**: Check service health

### 4. Plugins

Plugin management:

- **Install Plugin**: Install new plugins
- **List Plugins**: View installed plugins
- **Configure Plugin**: Configure existing plugins
- **Uninstall Plugin**: Remove plugins
- **Marketplace**: Browse plugin marketplace

### 5. Language Settings

Internationalization options:

- **Select Language**: Choose interface language
- **Configure Locale**: Set localization
- **Download Translations**: Download language packs
- **Contribute**: Contribute translations

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
  run: |
    docker-pilot menu --option="deploy" --non-interactive
```

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

- [Comandos CLI](cli-usage.md)
- [Configuração](../getting-started/configuration.md)
- [Plugins](../advanced/plugins.md)
- [Internacionalização](i18n.md)
