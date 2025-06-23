/**
 * Internationalization (i18n) utilitie    // Docker & System
    'docker.not_running': 'Docker is not running. Please start Docker and try again.',
    'docker.initializing': 'Initializing Docker Pilot...',
    'docker.initialized': 'Docker Pilot initialized successfully',
    'docker.failed': 'Failed to initialize Docker Pilot',
    'docker.options_available': '🔧 Available options:',
    'docker.start_desktop': '1. Start Docker Desktop',
    'docker.start_linux': '2. Run: sudo systemctl start docker (Linux)',
    'docker.start_macos': '3. Run: brew services start docker (macOS with Homebrew)',
    'docker.restart_tip': '💡 After Docker is running, run the command again.',
    'docker.retry_or_exit': '🔄 Press Enter to try again or type "exit" to finish: ',
    'docker.pilot_finished': 'Docker Pilot finished.',
    'docker.working_now': 'Docker is working now!',Pilot
 * Supports multiple languages while keeping Docker comman    // Menu
    'menu.welcome': 'Bem-vindo ao {projectName} Docker Pilot v{version}! 🐳',
    'menu.goodbye': 'Obrigado por usar o {projectName} Docker Pilot!',
    'menu.choose': 'Digite sua escolha:',
    'menu.invalid_choice': 'Opção inválida. Tente novamente.',    'menu.press_enter': 'Pressione Enter para continuar...',
    'menu.exit': 'Sair',
    'menu.back': 'Voltar',
    'menu.directory': 'Diretório: {path}',
    'menu.services': 'Serviços: {services}',
    'menu.no_services': 'Nenhum detectado',
    'menu.continue_question': '🔄 Deseja executar outro comando? (s/N): ',
    'menu.executing': '🚀 Executando: {command}',
    'menu.docker_not_running': 'Docker não está em execução!',
    'menu.docker_options': '🔧 Opções disponíveis:',
    'menu.start_docker_desktop': '1. Inicie o Docker Desktop',
    'menu.start_docker_linux': '2. Execute: sudo systemctl start docker (Linux)',
    'menu.start_docker_macos': '3. Execute: brew services start docker (macOS com Homebrew)',
    'menu.docker_tip': '💡 Depois que o Docker estiver rodando, execute o comando novamente.',
    'menu.retry_or_exit': '🔄 Pressione Enter para tentar novamente ou digite "sair" para finalizar: ',
    'menu.pilot_finished': '👋 Docker Pilot finalizado.',
    'menu.docker_working': 'Docker está funcionando agora!',
    'menu.no_compose_found': '⚠️  Nenhum arquivo docker-compose encontrado no diretório atual.',
    'menu.tip_correct_directory': '💡 Dica: Certifique-se de estar no diretório correto do seu projeto.',
    'menu.continue_anyway': 'Deseja continuar mesmo assim? (s/N): ',
    'menu.finishing': '👋 Finalizando Docker Pilot.',
    'menu.multiple_compose': '🔍 Múltiplos arquivos docker-compose encontrados:',
    'menu.using_first_default': '💡 Usando o primeiro arquivo por padrão.',
    'menu.compose_found': '✅ Arquivo docker-compose encontrado: {file}',nglish
 */

export type SupportedLanguage = 'en' | 'pt-br';

export interface MessageTranslations {
  [key: string]: string;
}

export interface Messages {
  en: MessageTranslations;
  'pt-br': MessageTranslations;
}

export const messages: Messages = {
  en: {    // Docker & System
    'docker.not_running': 'Docker is not running. Please start Docker and try again.',
    'docker.initializing': 'Initializing Docker Pilot...',
    'docker.initialized': 'Docker Pilot initialized successfully',
    'docker.failed': 'Failed to initialize Docker Pilot',
    'docker.options_available': '🔧 Available options:',
    'docker.start_desktop': '1. Start Docker Desktop',
    'docker.start_linux': '2. Run: sudo systemctl start docker (Linux)',
    'docker.start_macos': '3. Run: brew services start docker (macOS with Homebrew)',
    'docker.restart_tip': '💡 After Docker is running, execute the command again.',
    'docker.retry_or_exit': '🔄 Press Enter to try again or type "exit" to quit: ',
    'docker.pilot_finished': 'Docker Pilot finished.',
    'docker.working_now': 'Docker is working now!',
      // Services
    'service.started': 'Service {name} started successfully',
    'service.stopped': 'Service {name} stopped successfully',
    'service.restarted': 'Service {name} restarted successfully',
    'service.not_found': 'Service {name} not found',
    'service.building': 'Building service {name}...',
    'service.built': 'Service {name} built successfully',
    'service.starting': 'Starting service {name}...',
    'service.stopping': 'Stopping service {name}...',
    'service.restarting': 'Restarting service {name}...',
      // Menu
    'menu.welcome': 'Welcome to {projectName} Docker Pilot v{version}! 🐳',
    'menu.goodbye': 'Thank you for using {projectName} Docker Pilot!',
    'menu.choose': 'Choose your option:',
    'menu.invalid_choice': 'Invalid choice. Please try again.',    'menu.press_enter': 'Press Enter to continue...',
    'menu.exit': 'Exit',
    'menu.back': 'Back',
    'menu.directory': 'Directory: {path}',
    'menu.services': 'Services: {services}',
    'menu.no_services': 'None detected',
    'menu.continue_question': '🔄 Do you want to execute another command? (y/N): ',
    'menu.executing': '🚀 Executing: {command}',
    'menu.docker_not_running': 'Docker is not running!',
    'menu.docker_options': '🔧 Available options:',
    'menu.start_docker_desktop': '1. Start Docker Desktop',
    'menu.start_docker_linux': '2. Execute: sudo systemctl start docker (Linux)',
    'menu.start_docker_macos': '3. Execute: brew services start docker (macOS with Homebrew)',
    'menu.docker_tip': '💡 After Docker is running, execute the command again.',
    'menu.retry_or_exit': '🔄 Press Enter to try again or type "exit" to finish: ',
    'menu.pilot_finished': '👋 Docker Pilot finished.',
    'menu.docker_working': 'Docker is working now!',
    'menu.no_compose_found': '⚠️  No docker-compose file found in current directory.',
    'menu.tip_correct_directory': '💡 Tip: Make sure you are in the correct project directory.',
    'menu.continue_anyway': 'Do you want to continue anyway? (y/N): ',
    'menu.finishing': '👋 Finishing Docker Pilot.',
    'menu.multiple_compose': '🔍 Multiple docker-compose files found:',
    'menu.using_first_default': '💡 Using the first file by default.',
    'menu.compose_found': '✅ Docker-compose file found: {file}',
      // Commands
    'command.basic': 'Basic Commands',
    'command.advanced': 'Advanced Commands',
    'command.maintenance': 'Maintenance',
    'command.setup': 'Quick setup (detect services)',
    'command.start_all': 'Start all services',
    'command.stop_all': 'Stop all services',
    'command.restart_all': 'Restart all services',
    'command.rebuild_all': 'Rebuild and start all services',
    'command.logs_all': 'View logs of all services',
    'command.status': 'View services status',
    'command.shell': 'Open shell in service',
    'command.health': 'Check services health',
    'command.monitor': 'Monitor in real time',
    'command.update': 'Update all images',
    'command.clean': 'Clean unused resources',
    'command.deep_clean': 'Deep clean',
    'command.show_config': 'Show configuration',
    'command.advanced_settings': 'Advanced settings',
    'command.start_service': 'Start {service}',
    'command.restart_service': 'Restart {service}',
    'command.logs_service': 'View {service} logs',    // Compose Management Commands
    'command.compose_management': 'Compose Files Management',
    'command.compose_list': 'List docker-compose files',
    'command.compose_find': 'Find docker-compose files',
    'command.compose_analyze': 'Analyze docker-compose file',
    'command.compose_validate': 'Validate docker-compose file',
    'command.compose_services': 'List services from compose',
    'command.compose_set_primary': 'Set primary compose file',
    'command.compose_change_primary': 'Change primary compose file',
    'command.compose_show_primary': 'Show current primary file',
    'command.compose_search_dir_prompt': 'Enter directory to search (or Enter for current): ',    // General command messages
    'command.detecting_services': '🔍 Detecting project services...',
    'command.detection_complete': '✅ Detection complete! Restarting menu...',
    'command.current_services': 'Current services: {services}',
    'command.replace_services_question': 'Replace current services with those from compose file? (y/N): ',
    'command.updating_images': 'Updating images...',
    'command.update_complete': 'Update completed!',
    'command.deep_clean_warning': '⚠️ This will remove unused images, volumes and networks. Continue? (y/N): ',
    'command.operation_cancelled': 'Operation cancelled.',
    'command.deep_clean_complete': 'Deep clean completed!',
    'command.no_services_configured': 'No services configured',
    'command.available_services': 'Available services:',
    'command.choose_service': 'Choose the service (or Enter for the first): ',
    'command.no_valid_service': 'No valid service selected',
    'command.opening_shell': '🐚 Opening shell in {service}...',
    'command.shell_tip': '💡 Type "exit" to leave the shell',
    'command.service_manager_unavailable': 'Service Manager not available',
    'command.health_status': '🏥 Services status:',
    'command.health_check_complete': 'Health check completed!',
    'command.monitoring_start': '📊 Starting real-time monitoring...',
    'command.monitoring_tip': '💡 Press Ctrl+C to stop monitoring',
    'command.docker_monitor': '🐳 Docker Monitor - {time}',
    'command.monitoring_stopped': '📊 Monitoring stopped.',
    'command.stop_logs_tip': '💡 Press Ctrl+C to stop viewing logs',
    'command.showing_logs': '📜 Showing {service} logs...',
    'command.press_ctrl_c': '💡 Press Ctrl+C to stop',

    // Status
    'status.running': 'Running',
    'status.stopped': 'Stopped',
    'status.starting': 'Starting',
    'status.stopping': 'Stopping',
    'status.healthy': 'Healthy',
    'status.unhealthy': 'Unhealthy',
      // Errors
    'error.generic': 'An error occurred: {message}',
    'error.service_not_found': 'Service not found: {name}',
    'error.command_failed': 'Command failed: {command}',
    'error.config_invalid': 'Invalid configuration',
    'error.config_not_found': 'Configuration not found!',
    'error.command_execution': 'Error executing command',
    'error.service_manager_unavailable': 'Service Manager not available',
    'error.invalid_choice': 'Invalid choice. Please try again.',

    // Operations & Commands
    'operation.starting_services': 'Starting services...',
    'operation.stopping_services': 'Stopping services...',
    'operation.restarting_services': 'Restarting services...',
    'operation.building_services': 'Building services...',
    'operation.pulling_images': 'Pulling images...',
    'operation.cleaning_resources': 'Cleaning resources...',
    'operation.success': 'Operation completed successfully',
    'operation.failed': 'Operation failed',
    'operation.cancelled': 'Operation cancelled',

    // Services
    'service.all_started': 'All services started successfully',
    'service.all_stopped': 'All services stopped successfully',
    'service.all_restarted': 'All services restarted successfully',
    'service.started_success': '{name} started successfully',
    'service.stopped_success': '{name} stopped successfully',
    'service.restarted_success': '{name} restarted successfully',
    'service.built_success': '{name} built successfully',
    'service.failed_start': 'Failed to start {name}',
    'service.failed_stop': 'Failed to stop {name}',
    'service.failed_restart': 'Failed to restart {name}',
    'service.failed_build': 'Failed to build {name}',
    'service.scaled_success': '{name} scaled to {replicas} replicas',
    'service.failed_scale': 'Failed to scale {name}',
    'service.no_services': 'No services found',
    'service.health_check': 'Service health check',
    'service.is_healthy': '{name} is healthy',    'service.status_info': 'Service Status:',
      // Setup
    'setup.detecting': 'Detecting Docker project...',
    'setup.configuring': 'Auto-configuring project...',
    'setup.found_compose': 'Found: {file}',
    'setup.service_detected': 'Service detected: {name}',
    'setup.success': 'Project configured successfully!',
    'setup.creating_initial': 'Creating initial configuration...',
    'setup.new_project': 'Setting up new Docker Pilot project...',
    'setup.initial_created': 'Initial configuration created!',
    'setup.project_name': 'Project: {name}',
    'setup.edit_config': 'You can edit docker-pilot.config.json to customize',
    'setup.language_configured': 'Language configured successfully!',
    'setup.ready_to_start': 'Ready to start using Docker Pilot!',
      // Settings
    'settings.title': '⚙️ Docker Pilot - Advanced Settings',
    'settings.divider': '═══════════════════════════════════════════',
    'settings.config_not_found': '❌ Configuration not found!',
    'settings.change_language': '1. Change interface language',
    'settings.configure_log_level': '2. Configure log level',
    'settings.toggle_interactive': '3. Enable/disable interactive mode',
    'settings.custom_messages': '4. Configure custom messages',
    'settings.dev_settings': '5. Development settings',
    'settings.back_to_main': '0. Back to main menu',
    'settings.invalid_option': '❌ Invalid option!',
    'settings.language_title': '🌍 Language Configuration',    'settings.graceful_shutdown': '👋 Gracefully shutting down...',

    // Language selection
    'language.title': '🌍 Language Selection',
    'language.choose': 'Please choose your language / Por favor, escolha seu idioma:',    'language.option_en': '1. English',
    'language.option_pt': '2. Português (Brasil)',
    'language.prompt': 'Select option / Selecione a opção (1-2): ',
    'language.invalid': 'Invalid option. Please try again. / Opção inválida. Tente novamente.',
    'language.configured_success': 'Language configured successfully!',
    'language.change_title': '🌍 Change Language',
    'language.current': 'Current language: {language}',
    'language.select_new': 'Select new language:',
    'language.changed_success': 'Language changed successfully to {language}!',

    // Plugins
    'plugin.loading': 'Loading plugin: {name}',
    'plugin.loaded': 'Plugin loaded: {name}',
    'plugin.unloading': 'Unloading plugin: {name}',
    'plugin.unloaded': 'Plugin unloaded: {name}',
    'plugin.initializing': 'Initializing plugin: {name}',
    'plugin.cleanup': 'Cleaning up plugin: {name}',
    'plugin.not_found': 'Plugin not found: {name}',
    'plugin.invalid': 'Plugin {name} is not valid',
    'plugin.not_enabled': 'Plugin {name} is not enabled',
    'plugin.failed_load': 'Failed to load plugin: {name}',
    'plugin.failed_unload': 'Failed to unload plugin: {name}',
    'plugin.config_updated': 'Config updated for plugin: {name}',
    'plugin.hook_registered': 'Registered hook: {hook} for plugin: {name}',
    'plugin.hook_failed': 'Hook execution failed: {hook}',
    'plugin.manager_initialized': 'Plugin Manager initialized',
    'plugin.cleanup_completed': 'Plugin cleanup completed',
    'plugin.dir_not_found': 'Plugin directory not found: {dir}',

    // Validation
    'validation.config_invalid': 'Invalid configuration',
    'validation.project_name_invalid': 'Project name should contain only lowercase letters, numbers, hyphens, and underscores',
    'validation.project_name_long': 'Project name cannot exceed 63 characters',
    'validation.service_name_invalid': 'Invalid service name format',
    'validation.port_invalid': 'Invalid port number: {port}',
    'validation.port_conflict': 'Port {port} is commonly used by {service}',
    'validation.path_not_found': 'Path not found: {path}',
    'validation.env_var_invalid': 'Invalid environment variable name: {name}',
    'validation.env_var_sensitive': 'Environment variable {name} may contain sensitive data',
    'validation.volume_invalid': 'Invalid volume format: {volume}',
    'validation.cpu_limit_invalid': 'Invalid CPU limit format',
    'validation.memory_limit_invalid': 'Invalid memory limit format',
    'validation.docker_compose_invalid': 'Non-standard Docker Compose command: {command}',
    'validation.plugin_path_invalid': 'Plugin path does not exist: {path}',
    'validation.backup_retention_invalid': 'Backup retention must be at least 1 day',
    'validation.cron_invalid': 'Invalid cron expression: {cron}',
    'validation.refresh_interval_invalid': 'Refresh interval must be at least 1 second',
    'validation.url_invalid': 'Invalid URL format: {url}',
    'validation.port_mapping_invalid': 'Invalid port mapping format: {mapping}',
    'validation.services_missing': 'Docker Compose file must contain a services section',
    'validation.image_or_build_missing': 'Service should specify either "image" or "build"',
    'validation.depends_on_invalid': 'Invalid depends_on reference: {service}',
    'validation.health_check_missing': 'Critical service {service} should have health check',    'validation.port_conflict_services': 'Port {port} is used by multiple services: {services}',

    // Error messages
    'error.save_config': 'Error saving configuration',
    'error.load_config': 'Error loading configuration',

    // Common messages
    'common.no_changes': 'No changes were made',
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',

    // CLI
    'cli.help.title': '🐳 {projectName} Docker Pilot CLI v{version}',
    'cli.help.usage': 'USAGE:',
    'cli.help.usage_main': '  docker-pilot [command] [options]',
    'cli.help.usage_interactive': '  docker-pilot                        # Start interactive menu (default)',
    'cli.help.usage_interactive_flag': '  docker-pilot --interactive          # Start interactive menu',
    'cli.help.commands': 'COMMANDS:',
    'cli.help.cmd_up': '  up, start      Start all services or a specific service',
    'cli.help.cmd_down': '  down, stop     Stop all services or a specific service',
    'cli.help.cmd_status': '  status, ps     Show status of services',
    'cli.help.cmd_build': '  build          Build or rebuild services',
    'cli.help.cmd_logs': '  logs, log      Show service logs',
    'cli.help.cmd_exec': '  exec           Execute command in container',
    'cli.help.cmd_shell': '  shell, sh      Open interactive shell in container',
    'cli.help.cmd_scale': '  scale          Scale services to specified replicas',
    'cli.help.cmd_restart': '  restart        Restart services',
    'cli.help.cmd_pull': '  pull           Pull service images from registry',
    'cli.help.cmd_clean': '  clean, cleanup Clean Docker resources',
    'cli.help.cmd_config': '  config         View and manage configuration',
    'cli.help.options': 'GLOBAL OPTIONS:',
    'cli.help.opt_help': '  --help, -h           Show help',
    'cli.help.opt_version': '  --version, -v        Show version',
    'cli.help.opt_interactive': '  --interactive, -i    Start interactive menu',
    'cli.help.opt_config': '  --config <path>      Path to configuration file',
    'cli.help.opt_cwd': '  --cwd <path>         Working directory',
    'cli.help.opt_log_level': '  --log-level <level>  Log level (debug, info, warn, error)',
    'cli.help.opt_silent': '  --silent             Silent mode',
    'cli.help.examples': 'EXAMPLES:',
    'cli.help.example_interactive': '  docker-pilot                        # Start interactive menu',
    'cli.help.example_interactive_flag': '  docker-pilot --interactive          # Start interactive menu',
    'cli.help.example_up': '  docker-pilot up                     # Start all services',
    'cli.help.example_up_service': '  docker-pilot up web                 # Start web service',
    'cli.help.example_down': '  docker-pilot down --volumes         # Stop and remove volumes',
    'cli.help.example_status': '  docker-pilot status --detailed      # Show detailed status',
    'cli.help.example_build': '  docker-pilot build --no-cache       # Build without cache',
    'cli.help.example_logs': '  docker-pilot logs web --follow      # Follow web service logs',
    'cli.help.example_exec': '  docker-pilot exec web bash          # Open bash in web container',
    'cli.help.example_shell': '  docker-pilot shell web              # Open shell in web container',
    'cli.help.example_scale': '  docker-pilot scale web=3 api=2      # Scale web to 3, api to 2 replicas',
    'cli.help.example_restart': '  docker-pilot restart web            # Restart web service',
    'cli.help.example_pull': '  docker-pilot pull --parallel        # Pull all images in parallel',
    'cli.help.example_clean': '  docker-pilot clean --all            # Clean all Docker resources',
    'cli.help.example_config': '  docker-pilot config show            # Show current configuration',
    'cli.help.more_info': 'For more information about a specific command, use:',
    'cli.help.more_info_cmd': '  docker-pilot <command> --help',
    'cli.version.title': '{projectName} Docker Pilot CLI v{version}',
    'cli.version.library': 'Docker Pilot Library v{version}',
    'cli.version.node': 'Node.js {version}',
    'cli.unknown_command': 'Unknown command: {command}',
    'cli.use_help': 'Use --help to see available commands',
    'cli.command_failed': 'Command failed: {error}',
    'cli.execution_failed': 'CLI execution failed',
    'cli.command_completed': 'Command completed in {time}ms',
    'cli.menu_start_error': 'Error starting interactive menu:',
    'cli.creating_auto_config': '🔧 Creating automatic configuration...',    'cli.config_created': '✅ Configuration created: {path}',
    'cli.initialization_debug': 'Initializing Docker Pilot CLI...',
    'cli.docker_init_failed': 'Docker initialization failed:',
    'cli.commands_registered': 'Registered {count} commands',
    'cli.init_success': 'Docker Pilot CLI initialized successfully',
    'cli.init_failed': 'Failed to initialize Docker Pilot CLI',
      // Commands
    'cmd.docker_not_available': 'Docker is not available',
    'cmd.docker_not_running': 'Docker is not available or not running',
    'cmd.operation_cancelled': 'Operation cancelled by user',
    'cmd.service_required': 'Service name is required',
    'cmd.command_required': 'Command is required',
    'cmd.invalid_format': 'Invalid format: {format}',
    'cmd.args_required': 'At least one {type} is required',
    'cmd.executing_in': 'Executing command in {service} container...',
    'cmd.command_executed': 'Command executed in {service} container',
    'cmd.failed_execute': 'Failed to execute command: {error}',
    'cmd.opening_shell': 'Opening shell in {service} container...',
    'cmd.shell_opened': 'Shell session opened in {service} container',
    'cmd.failed_open_shell': 'Failed to open shell: {error}',

    // Build Command
    'cmd.build.loading': 'Building {service}...',
    'cmd.build.loading_all': 'Building all services...',
    'cmd.build.success': '✅ Successfully built {service}',
    'cmd.build.success_all': '✅ Successfully built all services',
    'cmd.build.failed': '❌ Build failed: {error}',
    'cmd.build.service_text': 'service \'{service}\'',
    'cmd.build.all_services': 'all services',

    // Logs Command
    'cmd.logs.loading': 'Fetching logs for {service}...',
    'cmd.logs.loading_all': 'Fetching logs for all services...',
    'cmd.logs.following': '📜 Following logs for {service}...',
    'cmd.logs.following_all': '📜 Following logs for all services...',
    'cmd.logs.stop_tip': 'Press Ctrl+C to stop',
    'cmd.logs.failed': '❌ Failed to fetch logs: {error}',

    // Restart Command
    'cmd.restart.loading': 'Restarting {service}...',
    'cmd.restart.loading_all': 'Restarting all services...',
    'cmd.restart.success': '✅ Successfully restarted {service}',
    'cmd.restart.success_all': '✅ Successfully restarted all services',
    'cmd.restart.failed': '❌ Restart failed: {error}',

    // Clean Command
    'cmd.clean.loading': 'Cleaning Docker resources...',
    'cmd.clean.success': '✅ Successfully cleaned Docker resources',
    'cmd.clean.failed': '❌ Clean failed: {error}',
    'cmd.clean.confirm': 'This will remove unused Docker resources. Continue? (y/N): ',
    'cmd.clean.cancelled': 'Clean operation cancelled',
    'cmd.clean.removing_containers': 'Removing stopped containers...',
    'cmd.clean.removing_images': 'Removing unused images...',
    'cmd.clean.removing_volumes': 'Removing unused volumes...',
    'cmd.clean.removing_networks': 'Removing unused networks...',
    'cmd.clean.prune_all': 'Pruning all unused resources...',

    // Pull Command
    'cmd.pull.loading': 'Pulling image for {service}...',
    'cmd.pull.loading_all': 'Pulling images for all services...',
    'cmd.pull.success': '✅ Successfully pulled {service}',
    'cmd.pull.success_all': '✅ Successfully pulled all images',
    'cmd.pull.failed': '❌ Pull failed: {error}',
    'cmd.pull.parallel': 'Pulling images in parallel...',

    // Exec Command
    'cmd.exec.executing': 'Executing command in {service} container...',
    'cmd.exec.success': 'Command executed successfully in {service}',
    'cmd.exec.failed': '❌ Failed to execute command: {error}',
    'cmd.exec.container_not_running': 'Container {service} is not running',

    // Shell Command
    'cmd.shell.opening': '🐚 Opening shell in {service} container...',
    'cmd.shell.success': 'Shell opened in {service} container',
    'cmd.shell.failed': '❌ Failed to open shell: {error}',
    'cmd.shell.tip': '💡 Type "exit" to close the shell',
    'cmd.shell.container_not_running': 'Container {service} is not running',

    // Scale Command
    'cmd.scale.scaling': 'Scaling {service} to {replicas} replicas...',
    'cmd.scale.success': '✅ Successfully scaled {service} to {replicas} replicas',
    'cmd.scale.failed': '❌ Scale failed: {error}',
    'cmd.scale.invalid_replicas': 'Invalid number of replicas: {replicas}',
    'cmd.scale.format_help': 'Use format: service=replicas (e.g., web=3)',

    // Status Command
    'cmd.status.loading': 'Checking service status...',
    'cmd.status.title': '📊 Services Status',
    'cmd.status.no_services': 'No services found',
    'cmd.status.service_info': '{service}: {status}',
    'cmd.status.detailed_info': '{service}: {status} (ID: {id}, Image: {image})',
    'cmd.status.failed': '❌ Failed to get status: {error}',

    // Config Command
    'cmd.config.showing': 'Showing configuration...',
    'cmd.config.title': '⚙️ Docker Pilot Configuration',
    'cmd.config.project': 'Project: {name}',
    'cmd.config.language': 'Language: {language}',
    'cmd.config.log_level': 'Log Level: {level}',
    'cmd.config.interactive': 'Interactive Mode: {enabled}',
    'cmd.config.compose_file': 'Compose File: {file}',
    'cmd.config.services': 'Services: {services}',
    'cmd.config.failed': '❌ Failed to show configuration: {error}',
    'cmd.building': 'Building {target}...',
    'cmd.built_success': 'Successfully built {target}',
    'cmd.build_failed': 'Build failed: {error}',
    'cmd.starting': 'Starting {target}...',
    'cmd.started_success': '{target} started successfully!',
    'cmd.start_failed': 'Failed to start {target}',
    'cmd.stopping': 'Stopping {target}...',
    'cmd.stopped_success': '{target} stopped successfully!',
    'cmd.stop_failed': 'Failed to stop {target}',
    'cmd.restarting': 'Restarting {target}...',
    'cmd.restarted_success': 'Successfully restarted {target}',
    'cmd.restart_failed': 'Failed to restart services: {error}',
    'cmd.cleaning': 'Cleaning Docker resources...',
    'cmd.cleanup_success': 'Cleanup completed successfully',
    'cmd.cleanup_failed': 'Cleanup failed: {error}',
    'cmd.confirm_action': 'This will {action}. Continue?',
    'cmd.confirm_volumes': 'remove volumes and ',
    'cmd.confirm_stop': 'stop {target}',
    'cmd.pulling': 'Pulling images for {target}...',
    'cmd.pulled_success': 'Successfully pulled images for {target}',
    'cmd.pull_failed': 'Failed to pull images: {error}',
    'cmd.scaling': 'Scaling services...',
    'cmd.scaled_success': 'Successfully scaled {count} service{plural}',    'cmd.scale_failed': 'Failed to scale services: {error}',
    'cmd.fetching_logs': 'Fetching logs for {target}...',
    'cmd.logs_retrieved': 'Logs retrieved for {target}',
    'cmd.logs_failed': 'Failed to retrieve logs: {error}',
    'cmd.getting_status': 'Getting status for {target}...',
    'cmd.status_retrieved': 'Status retrieved for {target}',
    'cmd.status_failed': 'Failed to get status for {target}',
    'cmd.status_complete': 'Status check completed successfully',
    'cmd.all_services': 'all services',
    'cmd.service_name': 'service \'{name}\'',
      // Auto-detect
    'autodetect.no_compose_found': '⚠️  No docker-compose file found in current directory.',
    'autodetect.directory_tip': '💡 Tip: Make sure you are in the correct project directory.\n',
    'autodetect.continue_anyway': 'Do you want to continue anyway? (y/N): ',
    'autodetect.finishing_pilot': 'Finishing Docker Pilot.',
    'autodetect.multiple_compose_found': '🔍 Multiple docker-compose files found:',
    'autodetect.using_first_default': '💡 Using the first file by default.\n',    'autodetect.compose_found': '✅ Docker-compose file found: {file}\n',
    'autodetect.detection_error': 'Error in auto-detection:',

    // Docker Compose Detection
    'compose.no_files_found': 'No docker-compose files found in project directory or subdirectories',
    'compose.multiple_files_found': 'Found {count} docker-compose files in project',
    'compose.services': 'services',
    'compose.using_first_file': 'Using primary file: {file}',
    'compose.file_not_found': 'Docker Compose file not found: {file}',
    'compose.detecting_services': 'Detecting services from: {file}',
    'compose.no_services_in_file': 'No services found in Docker Compose file',    'compose.recursive_search': 'Searching recursively for docker-compose files...',
    'compose.found_in_subdirectory': 'Found docker-compose file in subdirectory: {path}',
    'compose.select_file': 'Multiple docker-compose files found. Please select one:',
    'compose.file_details': '{index}. {path} ({serviceCount} services: {services})',
    'compose.select_file_prompt': 'Select a file (1-{count}) or press Enter for default [{defaultFile}]: ',
    'compose.using_selected_file': 'Using selected file: {file}',
    'compose.search_depth': 'Searching with depth: {depth} levels',
    'compose.found_files_summary': '📋 Found {count} docker-compose files:',
    'compose.file_info': '   📁 Directory: {dir}',
    'compose.file_size': '   📏 Size: {size}',
    'compose.file_modified': '   📅 Modified: {modified}',
    'compose.prioritizing_files': 'Prioritizing files by: 1) Root directory, 2) Service count, 3) Alphabetical order',
    'compose.file_set': 'Primary compose file set to: {file}',
    'compose.file_saved': 'Compose file selection saved successfully',
    'compose.no_primary_file': 'No primary compose file configured',    'compose.current_primary': 'Current primary file: {file}',
    'compose.choose_new_primary': 'Choose new primary compose file:',
    'compose.primary_changed': 'Primary compose file changed to: {file}',
    'compose.persistence_menu': 'Compose File Persistence',
    'compose.keep_primary_or_change': 'Keep current primary file? (Y/n): ',
    'compose.services_synchronized': 'Services synchronized with primary compose file! ✅',
    'compose.services_not_reloaded': 'Services were not reloaded. Use "Detect services" in the main menu to synchronize manually.',

    // Compose Command
    'cmd.compose.title': '🐳 Docker Compose File Management',
    'cmd.compose.usage': 'Usage',
    'cmd.compose.subcommands': 'Subcommands',
    'cmd.compose.options': 'Options',
    'cmd.compose.examples': 'Examples',
    'cmd.compose.list_desc': 'List all docker-compose files in project',
    'cmd.compose.find_desc': 'Find docker-compose files recursively',
    'cmd.compose.analyze_desc': 'Analyze a docker-compose file structure',
    'cmd.compose.validate_desc': 'Validate a docker-compose file',
    'cmd.compose.services_desc': 'List services in a docker-compose file',
    'cmd.compose.help_desc': 'Show help for compose command',
    'cmd.compose.variants_desc': 'Include environment variants (dev, prod, etc.)',
    'cmd.compose.depth_desc': 'Set maximum search depth (default: 6)',

    // Compose Analysis
    'compose.file_analysis': 'File Analysis',
    'compose.file_valid': 'Valid Docker Compose file',
    'compose.file_invalid': 'Invalid Docker Compose file {file}: {error}',
    'compose.no_services_warning': 'Warning: No services section found',
    'compose.no_version_warning': 'Warning: No version specified',
    'compose.found': 'found',    // Error messages
    'error.unknown_subcommand': 'Unknown subcommand: {command}',
    'error.missing_argument': 'Missing required argument: {argument}',
    'error.failed_to_analyze': 'Failed to analyze {file}: {error}',
    // Language Selection
    'language.welcome': '🌍 Welcome to Docker Pilot!',
    'language.choose_initial': 'Please choose your preferred language:',    'language.option_english': '1. English',    'language.option_portuguese': '2. Português (Brasil)',
    'language.enter_choice': 'Enter your choice (1-2): ',
    'language.invalid_choice': 'Invalid choice. Please enter 1 or 2.',
    'language.back_menu': 'Returning to main menu...',

    // BaseCommand messages
    'base.usage': 'Usage',
    'base.description': 'Description',
    'base.examples': 'Examples',
    'base.docker_check': 'Checking Docker availability...',
    'base.docker_available': 'Docker is available',
    'base.docker_unavailable': 'Docker is not available or not running',
    'base.operation_starting': 'Starting operation...',
    'base.operation_completed': 'Operation completed',
    'base.operation_failed': 'Operation failed',
    'base.parsing_options': 'Parsing command options...',
    'base.validating_args': 'Validating arguments...',
    'base.confirmation_required': 'Confirmation required for this action',
    'base.destructive_warning': '⚠️  This is a potentially destructive action',
    'base.service_validation': 'Validating service name...',
    'base.available_services': 'Available services:',
    'base.no_services': 'No services configured',

    // Error messages for BaseCommand
    'error.invalid_args_count': 'Invalid number of arguments. Expected {expected}, received {received}',
    'error.docker_not_running': 'Docker is not running or not available',
    'error.operation_failed': 'Operation failed: {message}',
    'error.invalid_service': 'Invalid service name: {service}',
    'error.no_services_configured': 'No services are configured',
    'error.confirmation_failed': 'Action confirmation failed',

    // Command result messages
    'result.success': 'Command executed successfully',
    'result.error': 'Command execution failed',
    'result.execution_time': 'Execution time: {time}ms',

    // Compose interface messages
    'compose.available_files': 'Available docker-compose files:',
    'compose.select_file_to_analyze': 'Select file to analyze (1-10): ',
    'compose.select_file_to_validate': 'Select file to validate (1-10): '
  },

  'pt-br': {// Docker & System
    'docker.not_running': 'Docker não está rodando. Inicie o Docker e tente novamente.',
    'docker.initializing': 'Inicializando Docker Pilot...',
    'docker.initialized': 'Docker Pilot inicializado com sucesso',
    'docker.failed': 'Falha ao inicializar Docker Pilot',
    'docker.options_available': '🔧 Opções disponíveis:',
    'docker.start_desktop': '1. Inicie o Docker Desktop',
    'docker.start_linux': '2. Execute: sudo systemctl start docker (Linux)',
    'docker.start_macos': '3. Execute: brew services start docker (macOS com Homebrew)',
    'docker.restart_tip': '💡 Depois que o Docker estiver rodando, execute o comando novamente.',
    'docker.retry_or_exit': '🔄 Pressione Enter para tentar novamente ou digite "sair" para finalizar: ',
    'docker.pilot_finished': 'Docker Pilot finalizado.',
    'docker.working_now': 'Docker está funcionando agora!',
      // Services
    'service.started': 'Serviço {name} iniciado com sucesso',
    'service.stopped': 'Serviço {name} parado com sucesso',
    'service.restarted': 'Serviço {name} reiniciado com sucesso',
    'service.not_found': 'Serviço {name} não encontrado',
    'service.building': 'Construindo serviço {name}...',
    'service.built': 'Serviço {name} construído com sucesso',
    'service.starting': 'Iniciando serviço {name}...',
    'service.stopping': 'Parando serviço {name}...',
    'service.restarting': 'Reiniciando serviço {name}...',

    // Menu
    'menu.welcome': 'Bem-vindo ao {projectName} Docker Pilot v{version}! 🐳',
    'menu.goodbye': 'Obrigado por usar o {projectName} Docker Pilot!',
    'menu.choose': 'Digite sua escolha:',
    'menu.invalid_choice': 'Escolha inválida. Tente novamente.',
    'menu.press_enter': 'Pressione Enter para continuar...',
    'menu.exit': 'Sair',
      // Commands
    'command.basic': 'Comandos Básicos',
    'command.advanced': 'Comandos Avançados',
    'command.maintenance': 'Manutenção',
    'command.setup': 'Setup rápido (detectar serviços)',
    'command.start_all': 'Iniciar todos os serviços',
    'command.stop_all': 'Parar todos os serviços',
    'command.restart_all': 'Reiniciar todos os serviços',
    'command.rebuild_all': 'Reconstruir e iniciar todos os serviços',
    'command.logs_all': 'Ver logs de todos os serviços',
    'command.status': 'Ver status dos serviços',
    'command.shell': 'Abrir shell no serviço',
    'command.health': 'Verificar saúde dos serviços',
    'command.monitor': 'Monitorar em tempo real',
    'command.update': 'Atualizar todas as imagens',
    'command.clean': 'Limpar recursos não utilizados',
    'command.deep_clean': 'Limpeza profunda',    'command.show_config': 'Mostrar configuração',
    'command.advanced_settings': 'Configurações avançadas',
    'command.start_service': 'Iniciar {service}',
    'command.restart_service': 'Reiniciar {service}',
    'command.logs_service': 'Ver logs do {service}',    // Comandos de Gerenciamento de Compose
    'command.compose_management': 'Gerenciamento de Arquivos Compose',
    'command.compose_list': 'Listar arquivos docker-compose',
    'command.compose_find': 'Buscar arquivos docker-compose',
    'command.compose_analyze': 'Analisar arquivo docker-compose',
    'command.compose_validate': 'Validar arquivo docker-compose',
    'command.compose_services': 'Listar serviços do compose',
    'command.compose_set_primary': 'Definir arquivo compose principal',
    'command.compose_change_primary': 'Alterar arquivo compose principal',
    'command.compose_show_primary': 'Mostrar arquivo principal atual',
    'command.compose_search_dir_prompt': 'Digite o diretório para buscar (ou Enter para atual): ',    // Mensagens gerais de comandos
    'command.detecting_services': '🔍 Detectando serviços do projeto...',
    'command.detection_complete': '✅ Detecção concluída! Reiniciando menu...',
    'command.current_services': 'Serviços atuais: {services}',
    'command.replace_services_question': 'Substituir serviços atuais pelos do arquivo compose? (s/N): ',
    'command.updating_images': 'Atualizando imagens...',
    'command.update_complete': 'Atualização concluída!',
    'command.deep_clean_warning': '⚠️ Isso removerá imagens, volumes e redes não utilizados. Continuar? (s/N): ',
    'command.operation_cancelled': 'Operação cancelada.',
    'command.deep_clean_complete': 'Limpeza profunda concluída!',
    'command.no_services_configured': 'Nenhum serviço configurado',
    'command.available_services': 'Serviços disponíveis:',
    'command.choose_service': 'Escolha o serviço (ou Enter para o primeiro): ',
    'command.no_valid_service': 'Nenhum serviço válido selecionado',
    'command.opening_shell': '🐚 Abrindo shell no {service}...',
    'command.shell_tip': '💡 Digite "exit" para sair do shell',
    'command.service_manager_unavailable': 'Service Manager não disponível',
    'command.health_status': '🏥 Status dos serviços:',
    'command.health_check_complete': 'Verificação de saúde concluída!',
    'command.monitoring_start': '📊 Iniciando monitoramento em tempo real...',
    'command.monitoring_tip': '💡 Pressione Ctrl+C para parar o monitoramento',
    'command.docker_monitor': '🐳 Monitor Docker - {time}',
    'command.monitoring_stopped': '📊 Monitoramento interrompido.',
    'command.stop_logs_tip': '💡 Pressione Ctrl+C para parar de visualizar os logs',
    'command.showing_logs': '📜 Mostrando logs do {service}...',
    'command.press_ctrl_c': '💡 Pressione Ctrl+C para parar',

    // Status
    'status.running': 'Rodando',
    'status.stopped': 'Parado',
    'status.starting': 'Iniciando',
    'status.stopping': 'Parando',
    'status.healthy': 'Saudável',
    'status.unhealthy': 'Com problemas',
      // Errors
    'error.generic': 'Ocorreu um erro: {message}',
    'error.service_not_found': 'Serviço não encontrado: {name}',
    'error.command_failed': 'Comando falhou: {command}',
    'error.config_invalid': 'Configuração inválida',
    'error.config_not_found': 'Configuração não encontrada!',
    'error.command_execution': 'Erro ao executar comando',
    'error.service_manager_unavailable': 'Service Manager não disponível',
    'error.invalid_choice': 'Opção inválida. Tente novamente.',

    // Operations & Commands
    'operation.starting_services': 'Iniciando serviços...',
    'operation.stopping_services': 'Parando serviços...',
    'operation.restarting_services': 'Reiniciando serviços...',
    'operation.building_services': 'Construindo serviços...',
    'operation.pulling_images': 'Baixando imagens...',
    'operation.cleaning_resources': 'Limpando recursos...',
    'operation.success': 'Operação concluída com sucesso',
    'operation.failed': 'Operação falhou',
    'operation.cancelled': 'Operação cancelada',

    // Services
    'service.all_started': 'Todos os serviços iniciados com sucesso',
    'service.all_stopped': 'Todos os serviços parados com sucesso',
    'service.all_restarted': 'Todos os serviços reiniciados com sucesso',
    'service.started_success': '{name} iniciado com sucesso',
    'service.stopped_success': '{name} parado com sucesso',
    'service.restarted_success': '{name} reiniciado com sucesso',
    'service.built_success': '{name} construído com sucesso',
    'service.failed_start': 'Falha ao iniciar {name}',
    'service.failed_stop': 'Falha ao parar {name}',
    'service.failed_restart': 'Falha ao reiniciar {name}',
    'service.failed_build': 'Falha ao construir {name}',
    'service.scaled_success': '{name} escalado para {replicas} réplicas',
    'service.failed_scale': 'Falha ao escalar {name}',
    'service.no_services': 'Nenhum serviço encontrado',
    'service.health_check': 'Verificação de saúde dos serviços',
    'service.is_healthy': '{name} está saudável',
    'service.status_info': 'Status dos Serviços:',    // Setup
    'setup.detecting': 'Detectando projeto Docker...',
    'setup.configuring': 'Auto-configurando projeto...',
    'setup.found_compose': 'Encontrado: {file}',
    'setup.service_detected': 'Serviço detectado: {name}',
    'setup.success': 'Projeto configurado com sucesso!',
    'setup.creating_initial': 'Criando configuração inicial...',
    'setup.new_project': 'Configurando novo projeto Docker Pilot...',
    'setup.initial_created': 'Configuração inicial criada!',
    'setup.project_name': 'Projeto: {name}',
    'setup.edit_config': 'Você pode editar docker-pilot.config.json para personalizar',
    'setup.language_configured': 'Idioma configurado com sucesso!',
    'setup.ready_to_start': 'Pronto para usar o Docker Pilot!',
      // Settings
    'settings.title': '⚙️ Docker Pilot - Configurações Avançadas',
    'settings.divider': '═══════════════════════════════════════════',
    'settings.config_not_found': '❌ Configuração não encontrada!',
    'settings.change_language': '1. Alterar idioma da interface',
    'settings.configure_log_level': '2. Configurar nível de log',
    'settings.toggle_interactive': '3. Ativar/desativar modo interativo',
    'settings.custom_messages': '4. Configurar mensagens personalizadas',
    'settings.dev_settings': '5. Configurações de desenvolvimento',
    'settings.back_to_main': '0. Voltar ao menu principal',
    'settings.invalid_option': '❌ Opção inválida!',
    'settings.language_title': '🌍 Configuração de Idioma',    'settings.graceful_shutdown': '👋 Finalizando com segurança...',

    // Language selection
    'language.title': '🌍 Seleção de Idioma',
    'language.choose': 'Please choose your language / Por favor, escolha seu idioma:',
    'language.option_en': '1. English',
    'language.option_pt': '2. Português (Brasil)',
    'language.prompt': 'Select option / Selecione a opção (1-2): ',
    'language.invalid': 'Invalid option. Please try again. / Opção inválida. Tente novamente.',
    'language.configured_success': 'Idioma configurado com sucesso!',
    'language.current': 'Idioma atual: {language}',
    'language.change_title': '🌍 Alterar Idioma',
    'language.select_new': 'Selecione o novo idioma:',
    'language.changed_success': 'Idioma alterado com sucesso para {language}!',

    // Plugins
    'plugin.loading': 'Carregando plugin: {name}',
    'plugin.loaded': 'Plugin carregado: {name}',
    'plugin.unloading': 'Descarregando plugin: {name}',
    'plugin.unloaded': 'Plugin descarregado: {name}',
    'plugin.initializing': 'Inicializando plugin: {name}',
    'plugin.cleanup': 'Limpando plugin: {name}',
    'plugin.not_found': 'Plugin não encontrado: {name}',
    'plugin.invalid': 'Plugin {name} não é válido',
    'plugin.not_enabled': 'Plugin {name} não está habilitado',
    'plugin.failed_load': 'Falha ao carregar plugin: {name}',
    'plugin.failed_unload': 'Falha ao descarregar plugin: {name}',
    'plugin.config_updated': 'Configuração atualizada para plugin: {name}',
    'plugin.hook_registered': 'Hook registrado: {hook} para plugin: {name}',
    'plugin.hook_failed': 'Execução do hook falhou: {hook}',
    'plugin.manager_initialized': 'Gerenciador de Plugins inicializado',
    'plugin.cleanup_completed': 'Limpeza de plugins completa',
    'plugin.dir_not_found': 'Diretório de plugins não encontrado: {dir}',

    // Validation
    'validation.config_invalid': 'Configuração inválida',
    'validation.project_name_invalid': 'Nome do projeto deve conter apenas letras minúsculas, números, hífens e sublinhados',
    'validation.project_name_long': 'Nome do projeto não pode exceder 63 caracteres',
    'validation.service_name_invalid': 'Formato de nome de serviço inválido',
    'validation.port_invalid': 'Número de porta inválido: {port}',
    'validation.port_conflict': 'Porta {port} é comumente usada por {service}',
    'validation.path_not_found': 'Caminho não encontrado: {path}',
    'validation.env_var_invalid': 'Nome de variável de ambiente inválido: {name}',
    'validation.env_var_sensitive': 'Variável de ambiente {name} pode conter dados sensíveis',
    'validation.volume_invalid': 'Formato de volume inválido: {volume}',
    'validation.cpu_limit_invalid': 'Formato de limite de CPU inválido',
    'validation.memory_limit_invalid': 'Formato de limite de memória inválido',
    'validation.docker_compose_invalid': 'Comando Docker Compose não padrão: {command}',
    'validation.plugin_path_invalid': 'Caminho do plugin não existe: {path}',
    'validation.backup_retention_invalid': 'Retenção de backup deve ser pelo menos 1 dia',
    'validation.cron_invalid': 'Expressão cron inválida: {cron}',
    'validation.refresh_interval_invalid': 'Intervalo de atualização deve ser pelo menos 1 segundo',
    'validation.url_invalid': 'Formato de URL inválido: {url}',
    'validation.port_mapping_invalid': 'Formato de mapeamento de porta inválido: {mapping}',
    'validation.services_missing': 'Arquivo Docker Compose deve conter uma seção de serviços',
    'validation.image_or_build_missing': 'Serviço deve especificar "image" ou "build"',
    'validation.depends_on_invalid': 'Referência depends_on inválida: {service}',
    'validation.health_check_missing': 'Serviço crítico {service} deve ter verificação de saúde',    'validation.port_conflict_services': 'Porta {port} é usada por múltiplos serviços: {services}',

    // Error messages
    'error.save_config': 'Erro ao salvar configuração',
    'error.load_config': 'Erro ao carregar configuração',

    // Common messages
    'common.no_changes': 'Nenhuma alteração foi feita',
    'common.back': 'Voltar',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.yes': 'Sim',
    'common.no': 'Não',

    // CLI
    'cli.help.title': '🐳 {projectName} Docker Pilot CLI v{version}',
    'cli.help.usage': 'USO:',
    'cli.help.usage_main': '  docker-pilot [comando] [opções]',
    'cli.help.usage_interactive': '  docker-pilot                        # Iniciar menu interativo (padrão)',
    'cli.help.usage_interactive_flag': '  docker-pilot --interactive          # Iniciar menu interativo',
    'cli.help.commands': 'COMANDOS:',
    'cli.help.cmd_up': '  up, start      Iniciar todos os serviços ou um serviço específico',
    'cli.help.cmd_down': '  down, stop     Parar todos os serviços ou um serviço específico',
    'cli.help.cmd_status': '  status, ps     Mostrar status dos serviços',
    'cli.help.cmd_build': '  build          Construir ou reconstruir serviços',
    'cli.help.cmd_logs': '  logs, log      Mostrar logs dos serviços',
    'cli.help.cmd_exec': '  exec           Executar comando no container',
    'cli.help.cmd_shell': '  shell, sh      Abrir shell interativo no container',
    'cli.help.cmd_scale': '  scale          Escalar serviços para réplicas especificadas',
    'cli.help.cmd_restart': '  restart        Reiniciar serviços',
    'cli.help.cmd_pull': '  pull           Baixar imagens dos serviços do registry',
    'cli.help.cmd_clean': '  clean, cleanup Limpar recursos do Docker',
    'cli.help.cmd_config': '  config         Ver e gerenciar configuração',
    'cli.help.options': 'OPÇÕES GLOBAIS:',
    'cli.help.opt_help': '  --help, -h           Mostrar ajuda',
    'cli.help.opt_version': '  --version, -v        Mostrar versão',
    'cli.help.opt_interactive': '  --interactive, -i    Iniciar menu interativo',
    'cli.help.opt_config': '  --config <caminho>   Caminho para arquivo de configuração',
    'cli.help.opt_cwd': '  --cwd <caminho>      Diretório de trabalho',
    'cli.help.opt_log_level': '  --log-level <nível>  Nível de log (debug, info, warn, error)',
    'cli.help.opt_silent': '  --silent             Modo silencioso',
    'cli.help.examples': 'EXEMPLOS:',
    'cli.help.example_interactive': '  docker-pilot                        # Iniciar menu interativo',
    'cli.help.example_interactive_flag': '  docker-pilot --interactive          # Iniciar menu interativo',
    'cli.help.example_up': '  docker-pilot up                     # Iniciar todos os serviços',
    'cli.help.example_up_service': '  docker-pilot up web                 # Iniciar serviço web',
    'cli.help.example_down': '  docker-pilot down --volumes         # Parar e remover volumes',
    'cli.help.example_status': '  docker-pilot status --detailed      # Mostrar status detalhado',
    'cli.help.example_build': '  docker-pilot build --no-cache       # Construir sem cache',
    'cli.help.example_logs': '  docker-pilot logs web --follow      # Seguir logs do serviço web',
    'cli.help.example_exec': '  docker-pilot exec web bash          # Abrir bash no container web',
    'cli.help.example_shell': '  docker-pilot shell web              # Abrir shell no container web',
    'cli.help.example_scale': '  docker-pilot scale web=3 api=2      # Escalar web para 3, api para 2 réplicas',
    'cli.help.example_restart': '  docker-pilot restart web            # Reiniciar serviço web',
    'cli.help.example_pull': '  docker-pilot pull --parallel        # Baixar todas as imagens em paralelo',
    'cli.help.example_clean': '  docker-pilot clean --all            # Limpar todos os recursos do Docker',
    'cli.help.example_config': '  docker-pilot config show            # Mostrar configuração atual',
    'cli.help.more_info': 'Para mais informações sobre um comando específico, use:',
    'cli.help.more_info_cmd': '  docker-pilot <comando> --help',
    'cli.version.title': '{projectName} Docker Pilot CLI v{version}',
    'cli.version.library': 'Docker Pilot Library v{version}',
    'cli.version.node': 'Node.js {version}',
    'cli.unknown_command': 'Comando desconhecido: {command}',
    'cli.use_help': 'Use --help para ver comandos disponíveis',
    'cli.command_failed': 'Comando falhou: {error}',
    'cli.execution_failed': 'Execução do CLI falhou',
    'cli.command_completed': 'Comando concluído em {time}ms',
    'cli.menu_start_error': 'Erro ao iniciar menu interativo:',
    'cli.creating_auto_config': '🔧 Criando configuração automática...',    'cli.config_created': '✅ Configuração criada: {path}',
    'cli.initialization_debug': 'Inicializando Docker Pilot CLI...',
    'cli.docker_init_failed': 'Falha na inicialização do Docker:',
    'cli.commands_registered': '{count} comandos registrados',
    'cli.init_success': 'Docker Pilot CLI inicializado com sucesso',
    'cli.init_failed': 'Falha ao inicializar Docker Pilot CLI',

    // Commands
    'cmd.docker_not_available': 'Docker não está disponível',
    'cmd.docker_not_running': 'Docker não está disponível ou não está rodando',
    'cmd.operation_cancelled': 'Operação cancelada pelo usuário',
    'cmd.service_required': 'Nome do serviço é obrigatório',
    'cmd.command_required': 'Comando é obrigatório',
    'cmd.invalid_format': 'Formato inválido: {format}',
    'cmd.args_required': 'Pelo menos um {type} é obrigatório',
    'cmd.executing_in': 'Executando comando no container {service}...',
    'cmd.command_executed': 'Comando executado no container {service}',
    'cmd.failed_execute': 'Falha ao executar comando: {error}',
    'cmd.opening_shell': 'Abrindo shell no container {service}...',
    'cmd.shell_opened': 'Sessão de shell aberta no container {service}',
    'cmd.failed_open_shell': 'Falha ao abrir shell: {error}',
    'cmd.building': 'Construindo {target}...',
    'cmd.built_success': '{target} construído com sucesso',
    'cmd.build_failed': 'Falha na construção: {error}',
    'cmd.starting': 'Iniciando {target}...',
    'cmd.started_success': '{target} iniciado com sucesso!',
    'cmd.start_failed': 'Falha ao iniciar {target}',
    'cmd.stopping': 'Parando {target}...',
    'cmd.stopped_success': '{target} parado com sucesso!',
    'cmd.stop_failed': 'Falha ao parar {target}',
    'cmd.restarting': 'Reiniciando {target}...',
    'cmd.restarted_success': '{target} reiniciado com sucesso',
    'cmd.restart_failed': 'Falha ao reiniciar serviços: {error}',
    'cmd.cleaning': 'Limpando recursos do Docker...',
    'cmd.cleanup_success': 'Limpeza concluída com sucesso',
    'cmd.cleanup_failed': 'Falha na limpeza: {error}',
    'cmd.confirm_action': 'Isso irá {action}. Continuar?',
    'cmd.confirm_volumes': 'remover volumes e ',
    'cmd.confirm_stop': 'parar {target}',
    'cmd.pulling': 'Baixando imagens para {target}...',
    'cmd.pulled_success': 'Imagens baixadas com sucesso para {target}',
    'cmd.pull_failed': 'Falha ao baixar imagens: {error}',
    'cmd.scaling': 'Escalando serviços...',
    'cmd.scaled_success': '{count} serviço{plural} escalado com sucesso',
    'cmd.scale_failed': 'Falha ao escalar serviços: {error}',
    'cmd.fetching_logs': 'Buscando logs para {target}...',
    'cmd.logs_retrieved': 'Logs obtidos para {target}',    'cmd.logs_failed': 'Falha ao obter logs: {error}',    'cmd.getting_status': 'Obtendo status para {target}...',
    'cmd.status_retrieved': 'Status obtido para {target}',
    'cmd.status_failed': 'Falha ao obter status para {target}',
    'cmd.status_complete': 'Verificação de status concluída com sucesso',
    'cmd.all_services': 'todos os serviços',
    'cmd.service_name': 'serviço \'{name}\'',

    // Build Command
    'cmd.build.loading': 'Construindo {service}...',
    'cmd.build.loading_all': 'Construindo todos os serviços...',
    'cmd.build.success': '✅ {service} construído com sucesso',
    'cmd.build.success_all': '✅ Todos os serviços construídos com sucesso',
    'cmd.build.failed': '❌ Falha na construção: {error}',
    'cmd.build.service_text': 'serviço \'{service}\'',
    'cmd.build.all_services': 'todos os serviços',

    // Logs Command
    'cmd.logs.loading': 'Buscando logs para {service}...',
    'cmd.logs.loading_all': 'Buscando logs para todos os serviços...',
    'cmd.logs.following': '📜 Seguindo logs para {service}...',
    'cmd.logs.following_all': '📜 Seguindo logs para todos os serviços...',
    'cmd.logs.stop_tip': 'Pressione Ctrl+C para parar',
    'cmd.logs.failed': '❌ Falha ao buscar logs: {error}',

    // Restart Command
    'cmd.restart.loading': 'Reiniciando {service}...',
    'cmd.restart.loading_all': 'Reiniciando todos os serviços...',
    'cmd.restart.success': '✅ {service} reiniciado com sucesso',
    'cmd.restart.success_all': '✅ Todos os serviços reiniciados com sucesso',
    'cmd.restart.failed': '❌ Falha ao reiniciar: {error}',

    // Clean Command
    'cmd.clean.loading': 'Limpando recursos do Docker...',
    'cmd.clean.success': '✅ Recursos do Docker limpos com sucesso',
    'cmd.clean.failed': '❌ Falha na limpeza: {error}',
    'cmd.clean.confirm': 'Isso removerá recursos não utilizados do Docker. Continuar? (s/N): ',
    'cmd.clean.cancelled': 'Operação de limpeza cancelada',
    'cmd.clean.removing_containers': 'Removendo containers parados...',
    'cmd.clean.removing_images': 'Removendo imagens não utilizadas...',
    'cmd.clean.removing_volumes': 'Removendo volumes não utilizados...',
    'cmd.clean.removing_networks': 'Removendo redes não utilizadas...',
    'cmd.clean.prune_all': 'Limpando todos os recursos não utilizados...',

    // Pull Command
    'cmd.pull.loading': 'Baixando imagem para {service}...',
    'cmd.pull.loading_all': 'Baixando imagens para todos os serviços...',
    'cmd.pull.success': '✅ {service} baixado com sucesso',
    'cmd.pull.success_all': '✅ Todas as imagens baixadas com sucesso',
    'cmd.pull.failed': '❌ Falha no download: {error}',
    'cmd.pull.parallel': 'Baixando imagens em paralelo...',

    // Exec Command
    'cmd.exec.executing': 'Executando comando no container {service}...',
    'cmd.exec.success': 'Comando executado com sucesso em {service}',
    'cmd.exec.failed': '❌ Falha ao executar comando: {error}',
    'cmd.exec.container_not_running': 'Container {service} não está rodando',

    // Shell Command
    'cmd.shell.opening': '🐚 Abrindo shell no container {service}...',
    'cmd.shell.success': 'Shell aberto no container {service}',
    'cmd.shell.failed': '❌ Falha ao abrir shell: {error}',
    'cmd.shell.tip': '💡 Digite "exit" para fechar o shell',
    'cmd.shell.container_not_running': 'Container {service} não está rodando',

    // Scale Command
    'cmd.scale.scaling': 'Escalando {service} para {replicas} réplicas...',
    'cmd.scale.success': '✅ {service} escalado com sucesso para {replicas} réplicas',
    'cmd.scale.failed': '❌ Falha ao escalar: {error}',
    'cmd.scale.invalid_replicas': 'Número inválido de réplicas: {replicas}',
    'cmd.scale.format_help': 'Use o formato: serviço=réplicas (ex: web=3)',

    // Status Command
    'cmd.status.loading': 'Verificando status dos serviços...',
    'cmd.status.title': '📊 Status dos Serviços',
    'cmd.status.no_services': 'Nenhum serviço encontrado',
    'cmd.status.service_info': '{service}: {status}',
    'cmd.status.detailed_info': '{service}: {status} (ID: {id}, Imagem: {image})',
    'cmd.status.failed': '❌ Falha ao obter status: {error}',

    // Config Command
    'cmd.config.showing': 'Mostrando configuração...',
    'cmd.config.title': '⚙️ Configuração do Docker Pilot',
    'cmd.config.project': 'Projeto: {name}',
    'cmd.config.language': 'Idioma: {language}',
    'cmd.config.log_level': 'Nível de Log: {level}',
    'cmd.config.interactive': 'Modo Interativo: {enabled}',
    'cmd.config.compose_file': 'Arquivo Compose: {file}',
    'cmd.config.services': 'Serviços: {services}',
    'cmd.config.failed': '❌ Falha ao mostrar configuração: {error}',
      // Auto-detect
    'autodetect.no_compose_found': '⚠️  Nenhum arquivo docker-compose encontrado no diretório atual.',
    'autodetect.directory_tip': '💡 Dica: Certifique-se de estar no diretório correto do seu projeto.\n',
    'autodetect.continue_anyway': 'Deseja continuar mesmo assim? (s/N): ',
    'autodetect.finishing_pilot': 'Finalizando Docker Pilot.',
    'autodetect.multiple_compose_found': '🔍 Múltiplos arquivos docker-compose encontrados:',
    'autodetect.using_first_default': '💡 Usando o primeiro arquivo por padrão.\n',    'autodetect.compose_found': '✅ Arquivo docker-compose encontrado: {file}\n',
    'autodetect.detection_error': 'Erro na auto-detecção:',

    // Docker Compose Detection
    'compose.no_files_found': 'Nenhum arquivo docker-compose encontrado no diretório do projeto ou subdiretórios',
    'compose.multiple_files_found': 'Encontrados {count} arquivos docker-compose no projeto',
    'compose.services': 'serviços',
    'compose.using_first_file': 'Usando arquivo principal: {file}',
    'compose.file_not_found': 'Arquivo Docker Compose não encontrado: {file}',
    'compose.detecting_services': 'Detectando serviços de: {file}',
    'compose.no_services_in_file': 'Nenhum serviço encontrado no arquivo Docker Compose',    'compose.recursive_search': 'Buscando recursivamente por arquivos docker-compose...',
    'compose.found_in_subdirectory': 'Arquivo docker-compose encontrado no subdiretório: {path}',
    'compose.select_file': 'Múltiplos arquivos docker-compose encontrados. Selecione um:',
    'compose.file_details': '{index}. {path} ({serviceCount} serviços: {services})',
    'compose.select_file_prompt': 'Selecione um arquivo (1-{count}) ou pressione Enter para usar o padrão [{defaultFile}]: ',
    'compose.using_selected_file': 'Usando arquivo selecionado: {file}',
    'compose.search_depth': 'Buscando com profundidade: {depth} níveis',
    'compose.found_files_summary': '📋 Encontrados {count} arquivos docker-compose:',
    'compose.file_info': '   📁 Diretório: {dir}',
    'compose.file_size': '   📏 Tamanho: {size}',
    'compose.file_modified': '   📅 Modificado: {modified}',
    'compose.prioritizing_files': 'Priorizando arquivos por: 1) Diretório raiz, 2) Contagem de serviços, 3) Ordem alfabética',
    'compose.file_set': 'Arquivo compose principal definido como: {file}',
    'compose.file_saved': 'Seleção do arquivo compose salva com sucesso',
    'compose.no_primary_file': 'Nenhum arquivo compose principal configurado',    'compose.current_primary': 'Arquivo principal atual: {file}',
    'compose.choose_new_primary': 'Escolha novo arquivo compose principal:',
    'compose.primary_changed': 'Arquivo compose principal alterado para: {file}',
    'compose.persistence_menu': 'Persistência de Arquivo Compose',
    'compose.keep_primary_or_change': 'Manter arquivo principal atual? (S/n): ',
    'compose.services_synchronized': 'Serviços sincronizados com o arquivo compose principal! ✅',
    'compose.services_not_reloaded': 'Serviços não foram recarregados. Use "Detectar serviços" no menu principal para sincronizar manualmente.',

    // Compose Command
    'cmd.compose.title': '🐳 Gerenciamento de Arquivos Docker Compose',
    'cmd.compose.usage': 'Uso',
    'cmd.compose.subcommands': 'Subcomandos',
    'cmd.compose.options': 'Opções',
    'cmd.compose.examples': 'Exemplos',
    'cmd.compose.list_desc': 'Lista todos os arquivos docker-compose no projeto',
    'cmd.compose.find_desc': 'Encontra arquivos docker-compose recursivamente',
    'cmd.compose.analyze_desc': 'Analisa a estrutura de um arquivo docker-compose',
    'cmd.compose.validate_desc': 'Valida um arquivo docker-compose',
    'cmd.compose.services_desc': 'Lista serviços em um arquivo docker-compose',
    'cmd.compose.help_desc': 'Mostra ajuda para o comando compose',
    'cmd.compose.variants_desc': 'Incluir variantes de ambiente (dev, prod, etc.)',
    'cmd.compose.depth_desc': 'Define a profundidade máxima de busca (padrão: 6)',

    // Compose Analysis
    'compose.file_analysis': 'Análise do Arquivo',
    'compose.file_valid': 'Arquivo Docker Compose válido',
    'compose.file_invalid': 'Arquivo Docker Compose inválido {file}: {error}',
    'compose.no_services_warning': 'Aviso: Seção de serviços não encontrada',
    'compose.no_version_warning': 'Aviso: Versão não especificada',
    'compose.found': 'encontrado(s)',
      // Error messages
    'error.unknown_subcommand': 'Subcomando desconhecido: {command}',
    'error.missing_argument': 'Argumento obrigatório ausente: {argument}',
    'error.failed_to_analyze': 'Falha ao analisar {file}: {error}',

    // Language Selection    'language.welcome': '🌍 Bem-vindo ao Docker Pilot!',
    'language.choose_initial': 'Por favor, escolha seu idioma preferido:',    'language.option_english': '1. English',
    'language.option_portuguese': '2. Português (Brasil)',    'language.enter_choice': 'Digite sua escolha (1-2): ',
    'language.invalid_choice': 'Escolha inválida. Digite 1 ou 2.',
    'language.back_menu': 'Voltando ao menu principal...',

    // Mensagens do BaseCommand
    'base.usage': 'Uso',
    'base.description': 'Descrição',
    'base.examples': 'Exemplos',
    'base.docker_check': 'Verificando disponibilidade do Docker...',
    'base.docker_available': 'Docker está disponível',
    'base.docker_unavailable': 'Docker não está disponível ou não está executando',
    'base.operation_starting': 'Iniciando operação...',
    'base.operation_completed': 'Operação concluída',
    'base.operation_failed': 'Operação falhou',
    'base.parsing_options': 'Analisando opções do comando...',
    'base.validating_args': 'Validando argumentos...',
    'base.confirmation_required': 'Confirmação necessária para esta ação',
    'base.destructive_warning': '⚠️  Esta é uma ação potencialmente destrutiva',
    'base.service_validation': 'Validando nome do serviço...',
    'base.available_services': 'Serviços disponíveis:',
    'base.no_services': 'Nenhum serviço configurado',

    // Mensagens de erro para BaseCommand
    'error.invalid_args_count': 'Número inválido de argumentos. Esperado {expected}, recebido {received}',
    'error.docker_not_running': 'Docker não está executando ou não está disponível',
    'error.operation_failed': 'Operação falhou: {message}',
    'error.invalid_service': 'Nome de serviço inválido: {service}',
    'error.no_services_configured': 'Nenhum serviço está configurado',
    'error.confirmation_failed': 'Falha na confirmação da ação',

    // Mensagens de resultado de comando
    'result.success': 'Comando executado com sucesso',
    'result.error': 'Execução do comando falhou',
    'result.execution_time': 'Tempo de execução: {time}ms',

    // Mensagens da interface de compose
    'compose.available_files': 'Arquivos docker-compose disponíveis:',
    'compose.select_file_to_analyze': 'Selecione o arquivo para analisar (1-10): ',
    'compose.select_file_to_validate': 'Selecione o arquivo para validar (1-10): '
  }
};

export class I18n {
  private currentLanguage: SupportedLanguage;

  constructor(language?: SupportedLanguage) {
    this.currentLanguage = language || this.detectLanguage();
  }
    /**
   * Auto-detect system language
   */
  private detectLanguage(): SupportedLanguage {
    const lang = process.env['LANG'] || process.env['LANGUAGE'] || 'en';

    if (lang.toLowerCase().includes('pt')) {
      return 'pt-br';
    }

    return 'en';
  }

  /**
   * Set current language
   */
  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  /**
   * Get current language
   */
  getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Translate message with optional parameters
   */
  t(key: string, params?: Record<string, string | number>): string {
    const translation = messages[this.currentLanguage]?.[key] || messages.en[key] || key;

    if (!params) {
      return translation;
    }

    return Object.keys(params).reduce((message, param) => {
      return message.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param]));
    }, translation);
  }
    /**
   * Check if translation exists
   */
  hasTranslation(key: string): boolean {
    return !!(messages[this.currentLanguage]?.[key] || messages.en[key]);
  }

  /**
   * Get language display name
   */
  getLanguageDisplayName(language?: SupportedLanguage): string {
    const lang = language || this.currentLanguage;
    switch (lang) {
      case 'pt-br':
        return 'Português (Brasil)';
      case 'en':
        return 'English';
      default:
        return 'English';
    }
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string }> {
    return [      { code: 'en', name: 'English' },
      { code: 'pt-br', name: 'Português (Brasil)' }
    ];
  }
}

// Export singleton instance
export const i18n = new I18n();

// Export convenience function
export function t(key: string, params?: Record<string, string | number>): string {
  return i18n.t(key, params);
}
