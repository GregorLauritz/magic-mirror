# Magic Mirror Dev Container

This directory contains the VS Code Dev Container configuration for the Magic Mirror project.

## What's Included

### Base Environment
- **Node.js 24** - Latest LTS version required by the project
- **Yarn** - Package manager (installed via corepack)
- **Docker-in-Docker** - Full Docker support for running docker-compose files
- **Git** - Version control with zsh and oh-my-zsh

### VS Code Extensions

#### Core Development
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Enhanced TypeScript support

#### Frontend Development
- **ES7+ React Snippets** - React code snippets
- **Import Cost** - Display import sizes inline

#### Docker & DevOps
- **Docker** - Docker file support and container management
- **Remote Containers** - Dev container support
- **Ansible** - Ansible playbook support

#### Database
- **MongoDB for VS Code** - MongoDB management and queries

#### Utilities
- **GitLens** - Advanced Git capabilities
- **Git Graph** - Visual git history
- **Vitest Explorer** - Test running and debugging
- **Error Lens** - Inline error highlighting
- **Path Intellisense** - Autocomplete file paths
- **Auto Rename Tag** - Rename HTML/JSX tags automatically
- **Better Comments** - Enhanced comment highlighting
- **TODO Tree** - Track TODO comments
- **REST Client** - Test API endpoints

## Getting Started

### Prerequisites
- [VS Code](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Opening in Dev Container

1. Open the Magic Mirror repository in VS Code
2. Press `F1` and select **"Remote-Containers: Reopen in Container"**
3. Wait for the container to build and dependencies to install
4. Once ready, you'll have a fully configured development environment

### What Happens on Container Creation

The `post-create.sh` script automatically:
1. Enables Yarn via corepack
2. Installs frontend dependencies (`frontend/node_modules`)
3. Installs backend dependencies (`backend/node_modules`)
4. Displays helpful quick start commands

## Port Forwarding

The following ports are automatically forwarded:

| Port  | Service                | Description              |
|-------|------------------------|--------------------------|
| 3000  | Frontend               | Vite dev server          |
| 3001  | Backend API            | Express server           |
| 9229  | Node Debugger          | Backend debugging        |
| 27017 | MongoDB                | Database (when running)  |
| 443   | OAuth2 Proxy           | HTTPS gateway            |

## Development Workflow

### Running the Application

**Option 1: Using Docker Compose (Recommended)**
```bash
cd docker-compose
docker compose -f docker-compose.dev.yml up
```

**Option 2: Running Services Individually**
```bash
# Terminal 1 - Frontend
cd frontend
yarn dev

# Terminal 2 - Backend
cd backend
yarn dev
```

### Running Tests

**Frontend:**
```bash
cd frontend
yarn test              # Run tests once
yarn test:ui           # Open Vitest UI
yarn test:coverage     # Generate coverage report
```

**Backend:**
```bash
cd backend
yarn test              # Run tests once
yarn test:watch        # Watch mode
yarn test:ui           # Open Vitest UI
yarn test:coverage     # Generate coverage report
```

### Code Quality

**Linting:**
```bash
# Frontend
cd frontend
yarn lint              # Check for issues
yarn lint:fix          # Auto-fix issues

# Backend
cd backend
yarn lint              # Check for issues
yarn lint:fix          # Auto-fix issues
```

**Formatting:**
```bash
# Frontend
cd frontend
yarn format            # Format code
yarn format:check      # Check formatting

# Backend
cd backend
yarn format            # Format code
yarn format:check      # Check formatting
```

### Debugging

The dev container includes a pre-configured launch configuration for debugging the backend:

1. Start the backend in dev mode: `cd backend && yarn dev`
2. Go to VS Code's Run and Debug panel (`Ctrl+Shift+D`)
3. Select **"Attach to backend"** and press `F5`
4. Set breakpoints in TypeScript files

## Docker-in-Docker

The dev container supports running Docker commands and docker-compose:

```bash
# Docker commands work as expected
docker ps
docker images
docker compose version

# Run the application with Docker Compose
cd docker-compose
docker compose -f docker-compose.dev.yml up
```

**Note:** MongoDB is NOT started automatically by the dev container. You should start it using docker-compose when needed.

## Customization

### Adding Extensions

Edit `.devcontainer/devcontainer.json` and add extension IDs to the `extensions` array:

```json
"extensions": [
  "your.extension-id"
]
```

### Modifying Post-Create Steps

Edit `.devcontainer/post-create.sh` to add custom setup steps.

### Environment Variables

Create environment files in `docker-compose/` directory:
- `backend.env` - Backend configuration
- `frontend.env` - Frontend configuration
- `proxy.env` - OAuth2-Proxy configuration

## Troubleshooting

### Dependencies Not Installed
```bash
# Manually run post-create script
bash .devcontainer/post-create.sh
```

### Docker Socket Permission Issues
```bash
# Fix docker socket permissions
sudo chmod 666 /var/run/docker.sock
```

### Container Rebuild
If you need to completely rebuild the container:
1. Press `F1`
2. Select **"Remote-Containers: Rebuild Container"**

## Additional Resources

- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/remote/containers)
- [Magic Mirror Project Documentation](../CLAUDE.md)
- [Docker Compose Files](../docker-compose/)
