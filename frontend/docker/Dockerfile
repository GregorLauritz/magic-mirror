# Build arguments
ARG NODE_IMG_VERSION=24-alpine3.23
ARG YARN_VERSION=4.12.0

# =============================================================================
# Stage 1: Builder - Build the React application
# =============================================================================
FROM node:${NODE_IMG_VERSION} AS builder

# Build-time configuration, baked into the bundle (Vite reads only VITE_*
# variables, see src/app/config.ts). Empty means the default in loadConfig.
#   docker build --build-arg VITE_GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com ...
ARG VITE_GOOGLE_CLIENT_ID=""
ARG VITE_LOCALE=""
ARG VITE_REFRESH_INTERVAL_MS=""
ARG VITE_WEATHER_ICON_ZOOM=""
ENV NODE_ENV=production \
    VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID} \
    VITE_LOCALE=${VITE_LOCALE} \
    VITE_REFRESH_INTERVAL_MS=${VITE_REFRESH_INTERVAL_MS} \
    VITE_WEATHER_ICON_ZOOM=${VITE_WEATHER_ICON_ZOOM}

# Install specific yarn version for reproducibility
RUN corepack enable && corepack prepare yarn@${YARN_VERSION} --activate

WORKDIR /opt/app

# Copy package files first for better layer caching
COPY package.json yarn.lock .yarnrc.yml ./

# Install all dependencies (devDependencies needed for tsc + vite build)
RUN yarn install --immutable

# Copy only necessary source files
COPY tsconfig.json tsconfig.node.json vite.config.ts ./
COPY index.html ./
COPY public ./public
COPY src ./src

# Build the application
RUN yarn build

# =============================================================================
# Stage 2: Production - Serve with Nginx
# =============================================================================
FROM nginx:1.29.8-alpine3.23

# Metadata labels for security scanning and documentation
LABEL maintainer="magic-mirror" \
      org.opencontainers.image.title="Magic Mirror Frontend" \
      org.opencontainers.image.description="Magic Mirror dashboard: static React app served by nginx over plain HTTP" \
      org.opencontainers.image.vendor="magic-mirror" \
      org.opencontainers.image.version="1.0" \
      org.opencontainers.image.source="https://github.com/GregorLauritz/magic-mirror"

# Create non-root user for nginx
RUN addgroup -g 102 -S nginx-app && \
    adduser -S -D -H -u 102 -h /var/cache/nginx -s /sbin/nologin -G nginx-app -g nginx-app nginx-app && \
    # Create necessary directories with proper permissions
    mkdir -p /var/www/frontend/html /var/cache/nginx /var/run /var/log/nginx && \
    chown -R nginx-app:nginx-app /var/www/frontend /var/cache/nginx /var/run /var/log/nginx && \
    # Set proper permissions for nginx directories
    chmod -R 755 /var/www/frontend && \
    # Remove default nginx config
    rm -f /etc/nginx/conf.d/default.conf && \
    # Fix /run directory permissions for PID file access
    chmod 777 /run

# Copy built application from builder stage
COPY --from=builder --chown=nginx-app:nginx-app /opt/app/dist /var/www/frontend/html

# Copy custom nginx configuration (the snippet is included per location, so it
# must live outside conf.d, which nginx loads wholesale)
COPY --chown=nginx-app:nginx-app nginx/nginx.conf /etc/nginx/conf.d/frontend.conf
COPY --chown=nginx-app:nginx-app nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Switch to non-root user
USER nginx-app

# Plain HTTP; put a TLS-terminating reverse proxy in front (Google sign-in
# needs an https:// origin unless the app is opened on localhost)
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/health || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
