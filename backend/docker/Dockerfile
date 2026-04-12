# =============================================================================
# Multi-stage Dockerfile for Magic Mirror Backend
# =============================================================================
# Build arguments
ARG NODE_IMG_VERSION=24-alpine3.23
ARG NODE_ENV=production
ARG YARN_VERSION=4.12.0

# =============================================================================
# Stage 1: Dependencies (for caching)
# =============================================================================
FROM node:${NODE_IMG_VERSION} AS dependencies

# Set working directory
WORKDIR /app

# Install yarn at specific version for reproducibility
RUN corepack enable && corepack prepare yarn@${YARN_VERSION} --activate

# Copy package files first for better layer caching
# Only re-run yarn install if these files change
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies with frozen lockfile for reproducibility
RUN yarn install --immutable \
    && yarn cache clean

# =============================================================================
# Stage 2: Production image
# =============================================================================
FROM node:${NODE_IMG_VERSION} AS production
ARG YARN_VERSION

# Metadata labels following OCI image spec
LABEL org.opencontainers.image.title="Magic Mirror Backend" \
      org.opencontainers.image.description="Node.js + Express + TypeScript backend for Magic Mirror dashboard" \
      org.opencontainers.image.vendor="Magic Mirror" \
      org.opencontainers.image.licenses="MIT" \
      maintainer="magic-mirror" \
      security.scanning="enabled"

# Set environment variables
ENV NODE_PATH=./src \
    NODE_ENV=${NODE_ENV} \
    NODE_OPTIONS="--enable-source-maps" \
    NPM_CONFIG_LOGLEVEL=warn

# Install dumb-init for proper signal handling
# dumb-init ensures proper signal forwarding to Node.js process
RUN apk --no-cache add dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user and group for security
# Using specific UID/GID for consistency across environments
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 -G nodejs

# Set working directory
WORKDIR /app

RUN corepack enable && corepack prepare yarn@${YARN_VERSION} --activate

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=nodejs:nodejs /app/.yarn ./.yarn

# Copy only necessary application files
COPY --chown=nodejs:nodejs package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY --chown=nodejs:nodejs src ./src

# Ensure nodejs user owns the working directory so yarn can create .yarn cache
RUN chown nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3001

# Health check to ensure container is healthy
# Checks if the application is responding on port 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly (SIGTERM, SIGINT)
# This ensures graceful shutdown of Node.js application
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run the application
CMD ["yarn", "prod"]
