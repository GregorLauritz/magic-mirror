# Local Development

Magic Mirror is a static frontend with no backend, database, or auth proxy —
it calls external APIs directly from the browser. There are two ways to run
it locally:

- **`yarn dev`** (simplest) — the Vite dev server with hot reload.
- **The Docker image** — the production build served by nginx, exactly as it
  is deployed.

## Vite dev server

```bash
cd frontend
yarn install
yarn dev            # http://localhost:3000
```

## Production image

```bash
docker build -f frontend/docker/Dockerfile -t magic-mirror frontend
docker run --rm -p 8080:8080 magic-mirror    # http://localhost:8080
```

Build-time settings are passed as build args, e.g.
`--build-arg VITE_GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com` (see
[README.md](README.md#configuration)).

## Google Sign-In

Google Identity Services only runs on `https://` origins, with one exception:
`http://localhost`. Add the origin you open the app on (e.g.
`http://localhost:3000` and `http://localhost:8080`) as an **Authorized
JavaScript origin** of the OAuth Client ID in Google Cloud Console (see
[README.md](README.md#1-google-oauth-client-id)).
