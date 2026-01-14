# Dev Container Configuration

This directory contains the development container configuration for the Magic Mirror project. The dev container provides a consistent, fully-configured development environment with all necessary tools and dependencies.

## What's Included

### Base Environment
- **Node.js 24**: Latest LTS version as required by the project
- **Yarn**: Package manager via Corepack
- **Git**: Version control
- **Docker-in-Docker**: Ability to run Docker commands inside the container

### Services
- **MongoDB 8.2.3**: Database service automatically started
  - Accessible at `localhost:27017`
  - Default credentials: `admin` / `password`

### VS Code Extensions
The following extensions are automatically installed:
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **React snippets**: React development helpers
- **Docker**: Docker container management
- **MongoDB**: MongoDB database management
- **GitLens**: Enhanced Git capabilities
- **Path IntelliSense**: Autocomplete for file paths
- **Error Lens**: Inline error highlighting

### Port Forwarding
The following ports are automatically forwarded:
- `3000`: Frontend development server
- `3001`: Backend API server
- `9229`: Node.js debugger port
- `27017`: MongoDB database

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) or Docker Engine
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Opening in Dev Container

1. Open the project in VS Code
2. When prompted, click "Reopen in Container" or:
   - Press `F1` or `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac)
   - Type "Dev Containers: Reopen in Container"
   - Press Enter

3. Wait for the container to build (first time takes a few minutes)
4. Dependencies will be automatically installed via the post-create script

### Manual Setup

If you need to manually run the setup:

```bash
bash .devcontainer/post-create.sh
```

## Running the Application

### Frontend Only
```bash
cd frontend
yarn dev
```
Access at: http://localhost:3000

### Backend Only
```bash
cd backend
yarn dev
```
Access at: http://localhost:3001

### Full Stack (Docker Compose)
```bash
cd docker-compose
docker compose -f docker-compose.dev.yml up
```

## Configuration

### MongoDB Connection
The MongoDB service is preconfigured with:
- Host: `db` (or `localhost` from your machine)
- Port: `27017`
- Username: `admin`
- Password: `password`

These credentials are set in `docker-compose/backend.env` (auto-generated if not exists).

### OAuth2 Configuration
For full OAuth functionality, configure `docker-compose/proxy.env` with your Google OAuth credentials:
```env
OAUTH2_PROXY_CLIENT_ID=your-client-id
OAUTH2_PROXY_CLIENT_SECRET=your-client-secret
OAUTH2_PROXY_COOKIE_SECRET=your-cookie-secret
```

## Testing

### Backend Tests
```bash
cd backend
yarn test          # Run all tests
yarn test:watch    # Watch mode
yarn test:ui       # UI mode
yarn test:coverage # With coverage
```

### Frontend Tests
```bash
cd frontend
yarn test          # Run all tests
yarn test:ui       # UI mode
yarn test:coverage # With coverage
```

## Linting & Formatting

Both frontend and backend support:
```bash
yarn lint          # Check for issues
yarn lint:fix      # Auto-fix issues
yarn format        # Format code with Prettier
yarn format:check  # Check formatting
```

## Debugging

The Node.js debugger is available on port `9229`. VS Code launch configurations can be added to `.vscode/launch.json` to attach to the running process.

Example debug configuration:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Backend",
  "port": 9229,
  "restart": true,
  "skipFiles": ["<node_internals>/**"]
}
```

## Troubleshooting

### Container won't start
- Ensure Docker is running
- Check Docker has enough resources (4GB+ RAM recommended)
- Try rebuilding: "Dev Containers: Rebuild Container"

### Dependencies not installed
- Run the post-create script manually: `bash .devcontainer/post-create.sh`
- Or install manually: `cd frontend && yarn install` and `cd backend && yarn install`

### MongoDB connection issues
- Verify MongoDB is running: `docker ps`
- Check connection string in `docker-compose/backend.env`
- Ensure port 27017 is not already in use

### Port conflicts
- Check if ports 3000, 3001, or 27017 are already in use
- Stop conflicting services or modify port mappings in `docker-compose.yml`

## Customization

### Adding VS Code Extensions
Edit `.devcontainer/devcontainer.json` and add extension IDs to the `extensions` array.

### Modifying Environment Variables
Edit the respective `.env` files in the `docker-compose` directory.

### Changing Node.js Version
Update the image version in `.devcontainer/docker-compose.yml`:
```yaml
image: mcr.microsoft.com/devcontainers/typescript-node:XX
```

## Additional Resources
- [Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Magic Mirror Project Documentation](../CLAUDE.md)
