# Build arguments
ARG NODE_IMG_VERSION=24-alpine3.23
ARG YARN_VERSION=1.22.22

# =============================================================================
# Stage 1: Builder - Build the React application
# =============================================================================
FROM node:${NODE_IMG_VERSION} AS builder

# Set production environment for React build
ENV REACT_APP_NODE_ENV=production \
    NODE_ENV=production

# Install specific yarn version for reproducibility
RUN corepack enable && corepack prepare yarn@${YARN_VERSION} --activate

WORKDIR /opt/app

# Copy package files first for better layer caching
COPY package.json yarn.lock ./

# Install dependencies with frozen lockfile for reproducible builds
# Use --production=false to include devDependencies needed for build
RUN yarn install --immutable --production=false --network-timeout 100000 && \
    yarn cache clean

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
FROM nginx:1.29.4-alpine3.23

# Metadata labels for security scanning and documentation
LABEL maintainer="magic-mirror" \
      org.opencontainers.image.title="Magic Mirror Frontend" \
      org.opencontainers.image.description="React frontend for Magic Mirror dashboard" \
      org.opencontainers.image.vendor="magic-mirror" \
      org.opencontainers.image.version="1.0" \
      org.opencontainers.image.source="https://github.com/magic-mirror"

ENV REACT_APP_NODE_ENV=production

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

# Copy custom nginx configuration
COPY --chown=nginx-app:nginx-app nginx/nginx.conf /etc/nginx/conf.d/frontend.conf

# Switch to non-root user
USER nginx-app

# Expose application port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
