ARG OAUTH2_PROXY_VERSION=v7.13.0-alpine

FROM quay.io/oauth2-proxy/oauth2-proxy:${OAUTH2_PROXY_VERSION}

# Create non-root user if not already in base image
RUN addgroup -g 1000 oauth2 && adduser -u 1000 -G oauth2 -s /sbin/nologin -D oauth2 || true

# Create mount points for runtime-injected config and certs
RUN mkdir -p /opt/conf /opt/ssl \
    && chown -R oauth2:oauth2 /opt/conf /opt/ssl \
    && chmod 755 /opt/conf /opt/ssl

# Switch to non-root user
USER oauth2

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:4180/ping || exit 1
