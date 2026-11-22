# Magic Mirror Dev Container

This directory contains the VS Code Dev Container configuration for the Magic Mirror project.

## What's Included

### Base Environment
- **Node.js 24** - Latest LTS version required by the project
- **Yarn** - Package manager (installed via corepack)
- **Docker-in-Docker** - Full Docker support (to build and run the production image)
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
3. Displays helpful quick start commands

## Port Forwarding

The following ports are automatically forwarded:

| Port  | Service                | Description              |
|-------|------------------------|--------------------------|
| 3000  | Frontend               | Vite dev server          |

## Development Workflow

Magic Mirror is a static frontend with no backend server - it calls external
APIs (Open-Meteo, geocode.maps.co, db.transport.rest, Google Calendar)
directly from the browser. See [LOCAL_DEV.md](../LOCAL_DEV.md) for details.

**Option 1: Run the Vite dev server directly**
```bash
cd frontend
yarn dev
```

**Option 2: The production image (nginx serving the static build)**
```bash
docker build -f frontend/docker/Dockerfile -t magic-mirror frontend
docker run --rm -p 8080:8080 magic-mirror   # http://localhost:8080
```

### Running Tests

```bash
cd frontend
yarn test              # Run tests once
yarn test:ui           # Open Vitest UI
yarn test:coverage     # Generate coverage report
```

### Code Quality

```bash
cd frontend
yarn lint              # Check for issues
yarn lint:fix          # Auto-fix issues
yarn format            # Format code
yarn format:check      # Check formatting
```

## Docker-in-Docker

The dev container supports running Docker commands, e.g. to build and run the
production image:

```bash
docker ps
docker images
```

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
