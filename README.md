# Magic Mirror

A personalized smart display dashboard showing real-time weather, calendar events, birthdays, and time — built for always-on displays (originally Raspberry Pi).

**Stack:** React · TypeScript · Node.js · Express · MongoDB · OAuth2-Proxy · Docker Compose

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/) | Run the application |
| [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/) | Local setup automation |
| Google Cloud project with OAuth2 credentials | Authentication |
| [Geocode Maps API key](https://geocode.maps.co/) | Location lookup (free tier available) |

---

## First-Time Setup

### 1. Google OAuth2 Credentials

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create (or select) a project.
2. Enable the **Google Calendar API** under *APIs & Services → Library*.
3. Go to *APIs & Services → Credentials* → **Create Credentials → OAuth 2.0 Client ID**.
4. Application type: **Web application**.
5. Add an authorized redirect URI:
   ```
   https://<your-hostname>.<domain>/oauth2/callback
   ```
   Example: `https://mymachine.fritz.box/oauth2/callback`
6. Save the **Client ID** and **Client Secret** — you will need them in step 3.

### 2. Generate SSL Certificates

Run the cert playbook. It installs [mkcert](https://github.com/FiloSottile/mkcert) automatically if missing and generates locally-trusted certificates.

```bash
ansible-playbook ansible/setup_certs.yml
```

Supported platforms: **Ubuntu**, **Debian**, **macOS**.

This creates:
- `backend/ssl/express.pem` + `express.key` — for the Express backend
- `oauth2-proxy/ssl/<hostname>.pem` + `.key` + `.bundle.pem` — for the OAuth2-Proxy TLS listener
- `backend/rootCA.pem`, `certs/rootCA.pem`, `oauth2-proxy/rootCA.pem` — root CA copies

> **macOS:** Requires [Homebrew](https://brew.sh/). Run `brew install mkcert` manually if Homebrew is not in the system `PATH` when running as `localhost`.

### 3. Configure Environment Files

Run the env playbook. It creates all `.env` files and the OAuth2-Proxy config, generating and persisting random secrets.

```bash
ansible-playbook ansible/setup_env.yml
```

You will be prompted for:

| Prompt | Description |
|--------|-------------|
| Google OAuth2 Client ID | From step 1 |
| Google OAuth2 Client Secret | From step 1 |
| Geocode Maps API Key | From [geocode.maps.co](https://geocode.maps.co/) |
| Local domain suffix | Default: `fritz.box` |

Generated files (all git-ignored):
- `docker-compose/.env`
- `docker-compose/backend.env`
- `docker-compose/frontend.env`
- `docker-compose/proxy.env`
- `oauth2-proxy/oauth2-proxy.cfg`

Generated secrets (MongoDB password, cookie secret) are stored in `ansible/pwstore/` and reused on subsequent runs.

### 4. DNS / Hosts Resolution

The application uses your machine's hostname with the configured domain suffix (e.g. `mymachine.fritz.box`). Make sure this resolves on your network.

**Option A — `/etc/hosts` (local machine only):**
```
127.0.0.1   mymachine.fritz.box
```

**Option B — Router DNS:** Point `*.fritz.box` (or the specific hostname) to your machine's IP. Most home routers (e.g. Fritz!Box) support static DNS entries.

### 5. Start the Application

**Development** (hot reload for frontend & backend):
```bash
cd docker-compose
docker compose -f docker-compose.dev.yml up
```

**Production:**
```bash
cd docker-compose
docker compose -f docker-compose.yml up
```

Open `https://<hostname>.<domain>` in your browser. On first visit, you will be redirected to Google for authentication.

---

## Post-Login Configuration

After logging in, visit `/settings` to configure:

- **Location** — city, country, or zip code for weather
- **Events calendar** — Google Calendar ID for upcoming events
- **Birthdays calendar** — Google Calendar ID for birthday reminders

---

## Architecture

```
Browser (HTTPS :443)
    └── OAuth2-Proxy  ── injects: x-forwarded-user, x-forwarded-email, x-forwarded-access-token
            ├── /api/*  ──►  Backend  (Express :3001)  ──►  MongoDB
            └── /*      ──►  Frontend (React :3000)
```

Authentication is handled entirely by OAuth2-Proxy. The backend trusts the injected headers and never deals with OAuth flows directly.

---

## Development Commands

```bash
# Frontend
cd frontend
yarn dev          # Dev server on :3000 with hot reload
yarn lint         # ESLint
yarn test         # Vitest unit tests

# Backend
cd backend
yarn dev          # Dev server on :3001 (debugger on :9229)
yarn lint         # ESLint
yarn test         # Vitest unit tests
```

---

## Deployment

For deployment to a server or Raspberry Pi, use the Ansible playbooks:

```bash
# Deploy backend + docker-compose stack to a server
ansible-playbook ansible/server_setup.yml -i ansible/inventory/

# Set up a Raspberry Pi display
ansible-playbook ansible/rpi_setup.yml -i ansible/inventory/
```

Configure your inventory hosts and variables in `ansible/inventory/`.

---

[Impressum / Privacy Policy](impressum.md)
