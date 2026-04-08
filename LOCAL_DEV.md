# Local Development

Run the full Magic Mirror stack locally on k3s with hot reload.

## Prerequisites

| Tool   | Install |
|--------|---------|
| k3s    | `curl -sfL https://get.k3s.io \| INSTALL_K3S_EXEC="server --disable traefik --flannel-backend=none --disable-network-policy" sh -` |
| mkcert | `apt install mkcert` or [github.com/FiloSottile/mkcert](https://github.com/FiloSottile/mkcert#installation) |

Verify k3s is running:

```bash
sudo k3s kubectl get nodes
```

## Quick Start

```bash
# Minimal (frontend + backend + MongoDB, no OAuth)
./scripts/dev.sh up

# With Google OAuth (enables oauth2-proxy)
OAUTH2_CLIENT_ID="your-id" \
OAUTH2_CLIENT_SECRET="your-secret" \
GEOCODE_API_KEY="your-key" \
  ./scripts/dev.sh up
```

## Access

| Service        | URL                          |
|----------------|------------------------------|
| Frontend       | http://localhost:30000       |
| Backend API    | http://localhost:30001/api   |
| MongoDB        | localhost:30017              |
| Node Debugger  | localhost:30229              |
| OAuth2-Proxy   | https://localhost:30443 (if enabled) |

## Commands

```bash
./scripts/dev.sh up              # Start the dev environment
./scripts/dev.sh down            # Stop (preserves data)
./scripts/dev.sh status          # Show pod status
./scripts/dev.sh logs            # Tail all logs
./scripts/dev.sh logs backend    # Tail backend logs only
./scripts/dev.sh logs frontend   # Tail frontend logs only
./scripts/dev.sh reset           # Stop and delete all dev data
```

## How It Works

The dev environment runs on k3s in a `magic-mirror-dev` namespace, separate
from any production deployment. Each service runs in a pod:

- **Frontend** - `node:24-alpine` running `yarn dev` (Vite dev server).
  Mounts `frontend/src/` and `frontend/public/` for hot reload.
- **Backend** - `node:24-alpine` running `yarn dev` (nodemon).
  Mounts `backend/src/` for hot reload on file changes.
- **MongoDB** - `mongo:8.2.3-noble` with data persisted in `.dev/mongo-data/`.
- **OAuth2-Proxy** (optional) - Uses mkcert TLS certificates.
  Only started if `OAUTH2_CLIENT_ID` and `OAUTH2_CLIENT_SECRET` are set.

Source directories are mounted read-only into the pods via `hostPath` volumes.
`node_modules` and Yarn cache are stored in `.dev/` (git-ignored) to avoid
conflicts with host-installed dependencies.

## Environment Variables

| Variable               | Required | Description |
|------------------------|----------|-------------|
| `OAUTH2_CLIENT_ID`    | No       | Google OAuth2 Client ID (enables oauth2-proxy) |
| `OAUTH2_CLIENT_SECRET`| No       | Google OAuth2 Client Secret |
| `GEOCODE_API_KEY`     | No       | Geocode Maps API key |
| `DEV_HOSTNAME`        | No       | Override hostname for TLS certs (default: auto-detected) |

## Attaching the Node.js Debugger

The backend exposes a debug port at `localhost:30229`. In VS Code, add this
launch configuration:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Backend (k3s)",
  "port": 30229,
  "address": "localhost",
  "restart": true,
  "sourceMaps": true
}
```

## Troubleshooting

**Pods stuck in ContainerCreating:**
Check that the repo path is accessible by k3s. On systems with strict
permissions, you may need to allow the k3s user to read the repo directory.

**Frontend/backend crash-looping:**
Check logs with `./scripts/dev.sh logs frontend` or `./scripts/dev.sh logs backend`.
The first start takes longer because `yarn install` runs inside the pod.

**OAuth2-proxy not starting:**
Ensure both `OAUTH2_CLIENT_ID` and `OAUTH2_CLIENT_SECRET` are set.
The Google OAuth redirect URI must include `https://localhost:30443`.

**Reset everything:**
```bash
./scripts/dev.sh reset
```
This deletes the namespace, all pod data, generated certs, and passwords.
