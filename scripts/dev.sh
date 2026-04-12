#!/usr/bin/env bash
#
# Local development environment for Magic Mirror using k3s (or k3d on WSL2).
#
# Usage:
#   ./scripts/dev.sh up      Start the dev environment
#   ./scripts/dev.sh down    Stop the dev environment
#   ./scripts/dev.sh status  Show pod status
#   ./scripts/dev.sh logs    Tail logs for all pods
#   ./scripts/dev.sh reset   Tear down and clean all dev data
#
# Prerequisites (native Linux):
#   - k3s installed (https://k3s.io)
#   - mkcert installed (for TLS certificates)
#   - kubectl available (comes with k3s)
#
# Prerequisites (WSL2):
#   - Docker Desktop or Docker Engine running
#   - k3d installed (https://k3d.io)
#   - kubectl installed (https://kubernetes.io/docs/tasks/tools/)
#   - mkcert installed (for TLS certificates)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEV_DIR="${REPO_ROOT}/.dev"
RENDERED_DIR="${DEV_DIR}/rendered"
MANIFEST_DIR="${REPO_ROOT}/k8s/dev"
NAMESPACE="magic-mirror-dev"

HOSTNAME="${DEV_HOSTNAME:-$(hostname -f 2>/dev/null || hostname).local}"

# ── Runtime detection ────────────────────────────────────────────────────────

IS_WSL2=false
if grep -qi "microsoft\|wsl" /proc/sys/kernel/osrelease 2>/dev/null; then
  IS_WSL2=true
fi

K3D_CLUSTER="magic-mirror-dev"

if $IS_WSL2; then
  KUBECTL="kubectl"
else
  KUBECTL="k3s kubectl"
fi

# ── Helpers ───────────────────────────────────────────────────────────────────

info()  { printf '\033[1;34m==> %s\033[0m\n' "$*"; }
ok()    { printf '\033[1;32m==> %s\033[0m\n' "$*"; }
err()   { printf '\033[1;31m==> %s\033[0m\n' "$*" >&2; }

check_prereqs() {
  local missing=()

  if $IS_WSL2; then
    command -v docker  >/dev/null 2>&1 || missing+=(docker)
    command -v k3d     >/dev/null 2>&1 || missing+=(k3d)
    command -v kubectl >/dev/null 2>&1 || missing+=(kubectl)
  else
    command -v k3s >/dev/null 2>&1 || missing+=(k3s)
  fi
  command -v mkcert   >/dev/null 2>&1 || missing+=(mkcert)
  command -v envsubst >/dev/null 2>&1 || missing+=(envsubst)

  if [[ ${#missing[@]} -gt 0 ]]; then
    err "Missing prerequisites: ${missing[*]}"
    if $IS_WSL2; then
      echo "Install Docker:   https://docs.docker.com/engine/install/"
      echo "Install k3d:      curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash"
      echo "Install kubectl:  https://kubernetes.io/docs/tasks/tools/"
    else
      echo "Install k3s:      curl -sfL https://get.k3s.io | sh -"
    fi
    echo "Install mkcert:   https://github.com/FiloSottile/mkcert#installation"
    echo "Install envsubst: apt install gettext-base"
    exit 1
  fi

  if $IS_WSL2; then
    if ! docker info >/dev/null 2>&1; then
      err "Docker daemon is not running. Start Docker Desktop or the Docker service."
      exit 1
    fi
  fi
}

# ── k3d cluster management (WSL2 only) ──────────────────────────────────────

ensure_k3d_cluster() {
  if k3d cluster list 2>/dev/null | grep -q "^${K3D_CLUSTER} "; then
    info "k3d cluster '${K3D_CLUSTER}' exists, ensuring it is running"
    k3d cluster start "${K3D_CLUSTER}" 2>/dev/null || true
  else
    info "Creating k3d cluster '${K3D_CLUSTER}'"
    k3d cluster create "${K3D_CLUSTER}" \
      --volume "${REPO_ROOT}:${REPO_ROOT}" \
      --port "30000:30000@server:0" \
      --port "30001:30001@server:0" \
      --port "30017:30017@server:0" \
      --port "30229:30229@server:0" \
      --port "30443:30443@server:0" \
      --k3s-arg '--disable=traefik@server:0'
  fi

  # Ensure kubectl context points to our cluster
  kubectl config use-context "k3d-${K3D_CLUSTER}" >/dev/null 2>&1
}

# ── Render manifests ──────────────────────────────────────────────────────────

render_manifests() {
  info "Rendering manifests (REPO_ROOT=${REPO_ROOT}, HOSTNAME=${HOSTNAME})"
  mkdir -p "${RENDERED_DIR}"

  # envsubst with an explicit variable list only substitutes the named
  # placeholders, leaving any other ${...} content untouched. This is robust
  # against arbitrary characters (including '|' or '/') appearing in the
  # values, unlike sed-based replacement.
  export REPO_ROOT HOSTNAME
  for f in "${MANIFEST_DIR}"/*.yml; do
    envsubst '${REPO_ROOT} ${HOSTNAME}' \
      < "$f" > "${RENDERED_DIR}/$(basename "$f")"
  done
}

# ── Generate secrets ──────────────────────────────────────────────────────────

generate_secrets() {
  local secrets_file="${RENDERED_DIR}/secrets.yml"
  local pw_file="${DEV_DIR}/ferretdbpw.txt"
  local cookie_file="${DEV_DIR}/cookie.txt"

  # Generate stable passwords (reused across restarts)
  if [[ ! -f "$pw_file" ]]; then
    LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32 > "$pw_file"
  fi
  if [[ ! -f "$cookie_file" ]]; then
    LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32 > "$cookie_file"
  fi

  local ferretdb_pw
  local cookie_secret
  ferretdb_pw="$(cat "$pw_file")"
  cookie_secret="$(cat "$cookie_file")"

  cat > "$secrets_file" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: ferretdb-credentials
  namespace: ${NAMESPACE}
type: Opaque
stringData:
  FERRETDB_USERNAME: ferretadmin
  FERRETDB_PASSWORD: "${ferretdb_pw}"
---
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
  namespace: ${NAMESPACE}
type: Opaque
stringData:
  FERRETDB_USERNAME: ferretadmin
  FERRETDB_PASSWORD: "${ferretdb_pw}"
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
  local ferretdb_cert_dir="${DEV_DIR}/ferretdb/ssl"
  mkdir -p "$cert_dir" "$ferretdb_cert_dir"

  mkcert -install 2>/dev/null || true

  if [[ ! -f "${cert_dir}/${HOSTNAME}.pem" ]]; then
    info "Generating TLS certificates for ${HOSTNAME}"
    mkcert \
      -key-file "${cert_dir}/${HOSTNAME}.key" \
      -cert-file "${cert_dir}/${HOSTNAME}.pem" \
      "${HOSTNAME}" localhost 127.0.0.1 ::1
  fi

  if [[ ! -f "${ferretdb_cert_dir}/ferretdb.pem" ]]; then
    info "Generating FerretDB TLS certificates"
    mkcert \
      -key-file "${ferretdb_cert_dir}/ferretdb.key" \
      -cert-file "${ferretdb_cert_dir}/ferretdb.pem" \
      ferretdb localhost 127.0.0.1 ::1
  fi

  # Create k8s TLS secret for oauth2-proxy
  $KUBECTL create secret generic oauth2-proxy-tls \
    --namespace="${NAMESPACE}" \
    --from-file="${HOSTNAME}.pem=${cert_dir}/${HOSTNAME}.pem" \
    --from-file="${HOSTNAME}.key=${cert_dir}/${HOSTNAME}.key" \
    --dry-run=client -o yaml > "${RENDERED_DIR}/tls-secret.yml"

  # Create k8s TLS secret for FerretDB
  $KUBECTL create secret generic ferretdb-tls \
    --namespace="${NAMESPACE}" \
    --from-file="ferretdb.pem=${ferretdb_cert_dir}/ferretdb.pem" \
    --from-file="ferretdb.key=${ferretdb_cert_dir}/ferretdb.key" \
    --dry-run=client -o yaml > "${RENDERED_DIR}/ferretdb-tls-secret.yml"
}

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_up() {
  check_prereqs
  mkdir -p "${DEV_DIR}"
  trap 'rm -rf "${RENDERED_DIR}"' EXIT

  if $IS_WSL2; then
    ensure_k3d_cluster
  fi

  render_manifests

  info "Applying namespace"
  $KUBECTL apply -f "${RENDERED_DIR}/namespace.yml"

  generate_secrets
  generate_certs

  info "Applying secrets and configmaps"
  $KUBECTL apply -f "${RENDERED_DIR}/secrets.yml"
  $KUBECTL apply -f "${RENDERED_DIR}/tls-secret.yml"
  $KUBECTL apply -f "${RENDERED_DIR}/ferretdb-tls-secret.yml"
  $KUBECTL apply -f "${RENDERED_DIR}/configmaps.yml"

  info "Starting services"
  $KUBECTL apply -f "${RENDERED_DIR}/ferretdb.yml"
  $KUBECTL apply -f "${RENDERED_DIR}/backend.yml"
  $KUBECTL apply -f "${RENDERED_DIR}/frontend.yml"

  if [[ -n "${OAUTH2_CLIENT_ID:-}" && -n "${OAUTH2_CLIENT_SECRET:-}" ]]; then
    $KUBECTL apply -f "${RENDERED_DIR}/oauth2-proxy.yml"
  else
    info "Skipping oauth2-proxy (set OAUTH2_CLIENT_ID and OAUTH2_CLIENT_SECRET to enable)"
  fi

  info "Waiting for pods to start (this may take a few minutes for yarn install)..."
  $KUBECTL wait --for=condition=Ready pod -l app=ferretdb -n "${NAMESPACE}" --timeout=120s
  $KUBECTL wait --for=condition=Ready pod -l app=backend -n "${NAMESPACE}" --timeout=210s
  $KUBECTL wait --for=condition=Ready pod -l app=frontend -n "${NAMESPACE}" --timeout=210s

  echo ""
  ok "Dev environment is running!"
  if $IS_WSL2; then
    echo "  (using k3d on WSL2)"
  fi
  echo ""
  echo "  Frontend:       http://localhost:30000"
  echo "  Backend API:    http://localhost:30001/api"
  echo "  FerretDB:       localhost:30017"
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
  if $IS_WSL2; then
    # Delete namespace but keep the k3d cluster for faster restarts
    $KUBECTL delete namespace "${NAMESPACE}" --ignore-not-found 2>/dev/null || true
    k3d cluster stop "${K3D_CLUSTER}" 2>/dev/null || true
  else
    $KUBECTL delete namespace "${NAMESPACE}" --ignore-not-found
  fi
  ok "Dev environment stopped"
}

cmd_status() {
  if $IS_WSL2; then
    echo "Runtime: k3d (WSL2)"
    k3d cluster list 2>/dev/null | grep "^${K3D_CLUSTER} " || echo "k3d cluster '${K3D_CLUSTER}' not found"
    echo ""
  fi
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
  if $IS_WSL2; then
    k3d cluster delete "${K3D_CLUSTER}" 2>/dev/null || true
  else
    $KUBECTL delete namespace "${NAMESPACE}" --ignore-not-found
  fi
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
    if $IS_WSL2; then
      echo "Runtime: k3d (WSL2 detected)"
    else
      echo "Runtime: k3s (native Linux)"
    fi
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
