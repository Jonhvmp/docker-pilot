# First Steps

A detailed walkthrough for beginners getting started with Docker Pilot.

## Welcome to Docker Pilot! 👋

This guide will walk you through everything you need to know to get started with Docker Pilot, from basic concepts to your first successful container management experience.

## Understanding Docker Pilot

### What Docker Pilot Does

Docker Pilot is a friendly interface that sits on top of Docker Compose, making it easier to:

- **Manage Services**: Start, stop, and restart your containers
- **Monitor Health**: Check if your services are running properly
- **View Logs**: See what's happening inside your containers
- **Debug Issues**: Access container shells for troubleshooting
- **Scale Applications**: Run multiple instances of services
- **Clean Resources**: Remove unused containers and images

### Key Concepts

**Project**: A directory containing a `docker-compose.yml` file and related code

**Service**: A container defined in your Docker Compose file (e.g., web server, database)

**Configuration**: Settings that tell Docker Pilot how to manage your project

## Step-by-Step Tutorial

### Step 1: Prepare Your Project

Let's start with a simple web application example:

#### Create Project Directory

```bash
mkdir my-first-docker-app
cd my-first-docker-app
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html
    depends_on:
      - api

  api:
    image: node:16-alpine
    ports:
      - "3000:3000"
    working_dir: /app
    volumes:
      - ./api:/app
    command: node server.js
    environment:
      - NODE_ENV=development

  database:
    image: postgres:13-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Create Sample Files

Create a simple HTML file:

```bash
mkdir html
echo '<h1>Hello from Docker Pilot!</h1>' > html/index.html
```

Create a simple API:

```bash
mkdir api
cat > api/server.js << 'EOF'
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Hello from API!', timestamp: new Date() }));
});

server.listen(3000, () => {
  console.log('API server running on port 3000');
});
EOF
```

Your project structure should look like this:

````
my-first-docker-app/
├── docker-compose.yml
├── html/
│   └── index.html
└── api/
    └── server.js
````

### Step 2: First Run

Now let's start Docker Pilot:

```bash
docker-pilot
```

#### Language Selection

On first run, you'll see:

````
🌍 Welcome to Docker Pilot!
Please choose your language / Por favor, escolha seu idioma:

1. English
2. Português (Brasil)

Select option / Selecione a opção (1-2):
````

Type `1` for English or `2` for Portuguese.

#### Auto-Detection

Docker Pilot will automatically detect your services:

````
🔍 Detecting project services...
✅ Found docker-compose.yml
✅ Detected 3 services: web, api, database
✅ Configuration created: docker-pilot.config.json
````

### Step 3: Explore the Main Menu

You'll see the main menu:

````
============================================================
🐳 Welcome to my-first-docker-app Docker Pilot v2.0! 🐳
============================================================

📁 Directory: /path/to/my-first-docker-app
🔧 Services: web, api, database

====================================
🚀 Basic Commands
====================================
1. Quick setup (detect services)
2. Start all services
3. Stop all services
4. Restart all services
5. Rebuild and start all services
6. View logs of all services
7. View services status

====================================
🛠️ Advanced Commands
====================================
8. Open shell in service
9. Check services health
10. Monitor in real time
11. Update all images

====================================
⚙️ Maintenance
====================================
12. Clean unused resources
13. Deep clean
14. Show configuration
15. Advanced settings

0. Exit

Choose your option:
````

### Step 4: Start Your Services

Let's start all services:

1. Type `2` (Start all services)
2. Press Enter

You'll see:

````
🚀 Executing: Start all services
================================

🔄 Starting services in priority order...
✅ database started (healthy)
✅ api started (healthy)
✅ web started (healthy)

📊 Service Status:
┌─────────────┬─────────┬────────────┬───────────────┐
│ Service     │ Status  │ Health     │ Ports         │
├─────────────┼─────────┼────────────┼───────────────┤
│ web         │ running │ healthy    │ 0.0.0.0:8080  │
│ api         │ running │ healthy    │ 0.0.0.0:3000  │
│ database    │ running │ healthy    │ 5432/tcp      │
└─────────────┴─────────┴────────────┴───────────────┘

🎉 All services started successfully!

Press Enter to continue...
````

### Step 5: Test Your Application

Open your web browser and visit:

- **Web Application**: http://localhost:8080
- **API Endpoint**: http://localhost:3000

You should see your "Hello from Docker Pilot!" message and JSON response.

### Step 6: Monitor Your Services

Back in Docker Pilot, try option `7` (View services status):

````
🚀 Executing: View services status
==================================

📊 Current Service Status:

✅ web (nginx:alpine)
   Status: running (2 minutes)
   Health: healthy
   CPU: 0.1% | Memory: 12.3 MB
   Ports: 0.0.0.0:8080->80/tcp

✅ api (node:16-alpine)
   Status: running (2 minutes)
   Health: healthy
   CPU: 0.3% | Memory: 45.2 MB
   Ports: 0.0.0.0:3000->3000/tcp

✅ database (postgres:13-alpine)
   Status: running (2 minutes)
   Health: healthy
   CPU: 0.2% | Memory: 67.8 MB
   Ports: 5432/tcp

🎯 All services are healthy!
````

### Step 7: View Logs

Try option `6` (View logs of all services):

````
🚀 Executing: View logs of all services
=======================================

💡 Press Ctrl+C to stop viewing logs

api_1       | API server running on port 3000
database_1  | PostgreSQL init process complete
database_1  | database system is ready to accept connections
web_1       | 192.168.1.100 - - [22/Jun/2025:10:30:45 +0000] "GET / HTTP/1.1" 200 32
````

Press `Ctrl+C` to stop viewing logs.

### Step 8: Open a Shell

Let's explore inside a container. Try option `8` (Open shell in service):

````
🚀 Executing: Open shell in service
===================================

Available services:
1. web
2. api
3. database

Choose the service (or Enter for the first):
````

Type `2` for the API service:

````
🐚 Opening shell in api...
💡 Type "exit" to leave the shell

/app # ls
server.js

/app # ps aux
PID   USER     TIME  COMMAND
1     root      0:00 node server.js

/app # exit
````

### Step 9: Scale a Service

Let's scale the API service. In the menu, you can use advanced commands or CLI:

```bash
# In another terminal
docker-pilot scale api=3
```

This starts 3 instances of the API service.

### Step 10: Stop Services

When you're done, stop all services:

1. Choose option `3` (Stop all services)

````
🚀 Executing: Stop all services
===============================

🔄 Stopping services...
✅ web stopped
✅ api stopped
✅ database stopped

🎯 All services stopped successfully!
````

## Understanding the Configuration

Docker Pilot created a configuration file `docker-pilot.config.json`:

```json
{
  "projectName": "my-first-docker-app",
  "dockerCompose": "docker compose",
  "language": "en",
  "configVersion": "2.0",
  "services": {
    "web": {
      "port": 8080,
      "healthCheck": true,
      "priority": 3
    },
    "api": {
      "port": 3000,
      "healthCheck": true,
      "priority": 2
    },
    "database": {
      "port": 5432,
      "healthCheck": true,
      "priority": 1
    }
  }
}
```

This tells Docker Pilot:

- **Project name**: Display name for your project
- **Language**: Interface language preference
- **Service priorities**: Database starts first, then API, then web
- **Health checks**: Monitor service health automatically
- **Ports**: Main ports for each service

## CLI Usage

You can also use Docker Pilot from the command line:

```bash
# Start all services
docker-pilot up

# Check status
docker-pilot status

# View logs
docker-pilot logs

# Stop all services
docker-pilot down

# Open shell in API service
docker-pilot shell api

# Scale services
docker-pilot scale api=3 web=2

# Get help
docker-pilot --help
```

## Common Tasks

Here are common tasks you'll do with Docker Pilot:

### Daily Development Workflow

```bash
# Morning: Start everything
docker-pilot up

# During development: Check logs
docker-pilot logs --follow

# Debug an issue: Open shell
docker-pilot shell web

# Test changes: Restart service
docker-pilot restart api

# Evening: Stop everything
docker-pilot down
```

### Troubleshooting

````bash
# Check service health
docker-pilot status

# View recent logs
docker-pilot logs --tail 100

# Access container for debugging
docker-pilot shell database

# Rebuild containers
docker-pilot build --no-cache
docker-pilot up
````

### Maintenance

```bash
# Clean unused resources
docker-pilot clean

# Update all images
docker-pilot pull
docker-pilot up

# Deep clean (removes everything)
docker-pilot clean --all
```

## What You've Learned

Congratulations! You now know how to:

- ✅ Set up a Docker project with Docker Pilot
- ✅ Use the interactive menu to manage services
- ✅ Start, stop, and monitor containers
- ✅ View logs and access container shells
- ✅ Scale services and troubleshoot issues
- ✅ Use both interactive and CLI modes

## Next Steps

Now that you're comfortable with the basics:

- 🎮 Master the [Interactive Menu](../user-guide/interactive-menu.md)
- 💻 Learn advanced [CLI Usage](../user-guide/cli-usage.md)
- 🔧 Explore [Configuration Options](configuration.md)
- 🌍 Set up [Multi-language Support](../user-guide/i18n.md)
- 🔌 Try the [Plugin System](../advanced/plugins.md)

## Need Help?

- 📖 Check the [User Guide](../user-guide/cli-usage.md)
- ❓ Read the [FAQ](../faq.md)
- 💬 Join [Discussions](https://github.com/jonhvmp/docker-pilot/discussions)
- 🐛 Report [Issues](https://github.com/jonhvmp/docker-pilot/issues)

---

!!! success "You're Ready!"
    You now have everything you need to effectively use Docker Pilot in your projects. The combination of the interactive menu and CLI commands gives you powerful, flexible container management!
