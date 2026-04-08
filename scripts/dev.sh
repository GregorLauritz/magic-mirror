#!/usr/bin/env bash
#
# Local development environment for Magic Mirror using k3s.
#
# Usage:
#   ./scripts/dev.sh up      Start the dev environment
#   ./scripts/dev.sh down    Stop the dev environment
#   ./scripts/dev.sh status  Show pod status
#   ./scripts/dev.sh logs    Tail logs for all pods
#   ./scripts/dev.sh reset   Tear down and clean all dev data
#
# Prerequisites:
#   - k3s installed (https://k3s.io)
#   - mkcert installed (for TLS certificates)
#   - kubectl available (comes with k3s)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEV_DIR="${REPO_ROOT}/.dev"
RENDERED_DIR="${DEV_DIR}/rendered"
MANIFEST_DIR="${REPO_ROOT}/k8s/dev"
NAMESPACE="magic-mirror-dev"
KUBECTL="k3s kubectl"

HOSTNAME="${DEV_HOSTNAME:-$(hostname -f 2>/dev/null || hostname).local}"

# ── Helpers ───────────────────────────────────────────────────────────────────

info()  { printf '\033[1;34m==> %s\033[0m\n' "$*"; }
ok()    { printf '\033[1;32m==> %s\033[0m\n' "$*"; }
err()   { printf '\033[1;31m==> %s\033[0m\n' "$*" >&2; }

check_prereqs() {
  local missing=()
  command -v k3s   >/dev/null 2>&1 || missing+=(k3s)
  command -v mkcert >/dev/null 2>&1 || missing+=(mkcert)

  if [[ ${#missing[@]} -gt 0 ]]; then
    err "Missing prerequisites: ${missing[*]}"
    echo "Install k3s:   curl -sfL https://get.k3s.io | sh -"
    echo "Install mkcert: https://github.com/FiloSottile/mkcert#installation"
    exit 1
  fi
}

# ── Render manifests ──────────────────────────────────────────────────────────

render_manifests() {
  info "Rendering manifests (REPO_ROOT=${REPO_ROOT}, HOSTNAME=${HOSTNAME})"
  mkdir -p "${RENDERED_DIR}"

  for f in "${MANIFEST_DIR}"/*.yml; do
    sed \
      -e "s|__REPO_ROOT__|${REPO_ROOT}|g" \
      -e "s|__HOSTNAME__|${HOSTNAME}|g" \
      "$f" > "${RENDERED_DIR}/$(basename "$f")"
  done
}

# ── Generate secrets ──────────────────────────────────────────────────────────

generate_secrets() {
  local secrets_file="${RENDERED_DIR}/secrets.yml"
  local pw_file="${DEV_DIR}/mongopw.txt"
  local cookie_file="${DEV_DIR}/cookie.txt"

  # Generate stable passwords (reused across restarts)
  if [[ ! -f "$pw_file" ]]; then
    LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32 > "$pw_file"
  fi
  if [[ ! -f "$cookie_file" ]]; then
    LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32 > "$cookie_file"
  fi

  local mongo_pw
  local cookie_secret
  mongo_pw="$(cat "$pw_file")"
  cookie_secret="$(cat "$cookie_file")"

  cat > "$secrets_file" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: mongo-credentials
  namespace: ${NAMESPACE}
type: Opaque
stringData:
  MONGO_INITDB_ROOT_USERNAME: mongoadmin
  MONGO_INITDB_ROOT_PASSWORD: "${mongo_pw}"
---
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
  namespace: ${NAMESPACE}
type: Opaque
stringData:
  MONGO_USERNAME: mongoadmin
  MONGO_PASSWORD: "${mongo_pw}"
  GEOCODE_API_KEY: "${GEOCODE_API_KEY:-}"
---
apiVersion: v1
kind: Secret
metadata:
  name: oauth2-proxy-secrets
  namespace: ${NAMESPACE}
type: Opaque
stringData:
  OAUTH2_PROXY_CLIENT_ID: "${OAUTH2_CLIENT_ID:-}"
  OAUTH2_PROXY_CLIENT_SECRET: "${OAUTH2_CLIENT_SECRET:-}"
  OAUTH2_PROXY_COOKIE_SECRET: "${cookie_secret}"
  OAUTH2_PROXY_EMAIL_DOMAINS: "*"
EOF
}

# ── Generate TLS certs ────────────────────────────────────────────────────────

generate_certs() {
  local cert_dir="${DEV_DIR}/certs"
  mkdir -p "$cert_dir"

  if [[ ! -f "${cert_dir}/${HOSTNAME}.pem" ]]; then
    info "Generating TLS certificates for ${HOSTNAME}"
    mkcert -install 2>/dev/null || true
    mkcert \
      -key-file "${cert_dir}/${HOSTNAME}.key" \
      -cert-file "${cert_dir}/${HOSTNAME}.pem" \
      "${HOSTNAME}" localhost 127.0.0.1 ::1
  fi

  # Create k8s TLS secret from cert files
  $KUBECTL create secret generic oauth2-proxy-tls \
    --namespace="${NAMESPACE}" \
    --from-file="${HOSTNAME}.pem=${cert_dir}/${HOSTNAME}.pem" \
    --from-file="${HOSTNAME}.key=${cert_dir}/${HOSTNAME}.key" \
    --dry-run=client -o yaml > "${RENDERED_DIR}/tls-secret.yml"
}

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_up() {
  check_prereqs
  mkdir -p "${DEV_DIR}"

  render_manifests

  info "Applying namespace"
  $KUBECTL apply -f "${RENDERED_DIR}/namespace.yml"

  generate_secrets
  generate_certs

  info "Applying secrets and configmaps"
  $KUBECTL apply -f "${RENDERED_DIR}/secrets.yml"
  $KUBECTL apply -f "${RENDERED_DIR}/tls-secret.yml"
  $KUBECTL apply -f "${RENDERED_DIR}/configmaps.yml"

  info "Starting services"
  $KUBECTL apply -f "${RENDERED_DIR}/mongo.yml"
  $KUBECTL apply -f "${RENDERED_DIR}/backend.yml"
  $KUBECTL apply -f "${RENDERED_DIR}/frontend.yml"

  if [[ -n "${OAUTH2_CLIENT_ID:-}" && -n "${OAUTH2_CLIENT_SECRET:-}" ]]; then
    $KUBECTL apply -f "${RENDERED_DIR}/oauth2-proxy.yml"
  else
    info "Skipping oauth2-proxy (set OAUTH2_CLIENT_ID and OAUTH2_CLIENT_SECRET to enable)"
  fi

  # Clean up rendered files (contain secrets)
  rm -rf "${RENDERED_DIR}"

  info "Waiting for pods to start..."
  $KUBECTL wait --for=condition=Ready pod -l app=mongo -n "${NAMESPACE}" --timeout=60s 2>/dev/null || true
  $KUBECTL wait --for=condition=Ready pod -l app=backend -n "${NAMESPACE}" --timeout=120s 2>/dev/null || true
  $KUBECTL wait --for=condition=Ready pod -l app=frontend -n "${NAMESPACE}" --timeout=120s 2>/dev/null || true

  echo ""
  ok "Dev environment is running!"
  echo ""
  echo "  Frontend:       http://localhost:30000"
  echo "  Backend API:    http://localhost:30001/api"
  echo "  MongoDB:        localhost:30017"
  echo "  Debugger:       localhost:30229 (Node.js inspector)"
  if [[ -n "${OAUTH2_CLIENT_ID:-}" ]]; then
    echo "  OAuth2-Proxy:   https://localhost:30443"
  fi
  echo ""
  echo "  Logs:           ./scripts/dev.sh logs"
  echo "  Status:         ./scripts/dev.sh status"
  echo ""
}

cmd_down() {
  info "Stopping dev environment"
  $KUBECTL delete namespace "${NAMESPACE}" --ignore-not-found
  ok "Dev environment stopped"
}

cmd_status() {
  $KUBECTL get pods,svc -n "${NAMESPACE}" -o wide 2>/dev/null || echo "Namespace ${NAMESPACE} not found"
}

cmd_logs() {
  local target="${1:-}"
  if [[ -n "$target" ]]; then
    $KUBECTL logs -f -n "${NAMESPACE}" -l "app=${target}"
  else
    $KUBECTL logs -f -n "${NAMESPACE}" --all-containers --prefix --max-log-requests=10
  fi
}

cmd_reset() {
  info "Tearing down dev environment and cleaning data"
  $KUBECTL delete namespace "${NAMESPACE}" --ignore-not-found
  rm -rf "${DEV_DIR}"
  ok "Dev environment reset"
}

# ── Main ──────────────────────────────────────────────────────────────────────

case "${1:-help}" in
  up)     cmd_up ;;
  down)   cmd_down ;;
  status) cmd_status ;;
  logs)   shift; cmd_logs "$@" ;;
  reset)  cmd_reset ;;
  *)
    echo "Usage: $0 {up|down|status|logs [app]|reset}"
    echo ""
    echo "Commands:"
    echo "  up      Start the dev environment"
    echo "  down    Stop the dev environment (preserves data)"
    echo "  status  Show pod and service status"
    echo "  logs    Tail logs (optionally filter: logs backend)"
    echo "  reset   Tear down and delete all dev data"
    echo ""
    echo "Environment variables:"
    echo "  OAUTH2_CLIENT_ID      Google OAuth2 Client ID (enables oauth2-proxy)"
    echo "  OAUTH2_CLIENT_SECRET  Google OAuth2 Client Secret"
    echo "  GEOCODE_API_KEY       Geocode Maps API key"
    echo "  DEV_HOSTNAME          Override hostname (default: auto-detected)"
    exit 1
    ;;
esac
