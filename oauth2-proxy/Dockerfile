ARG OAUTH2_PROXY_VERSION=v7.13.0-alpine

FROM quay.io/oauth2-proxy/oauth2-proxy:v7.13.0-alpine

# Create non-root user if not already in base image
RUN addgroup -g 1000 oauth2 && adduser -u 1000 -G oauth2 -s /sbin/nologin -D oauth2 || true

COPY --chown=oauth2:oauth2 --chmod=644 rootCA.pem /etc/

COPY --chown=oauth2:oauth2 --chmod=755 ssl/ /opt/ssl/

# Create config directory with proper permissions
RUN mkdir -p /opt/conf && chown -R oauth2:oauth2 /opt/conf && chmod 755 /opt/conf

COPY --chown=oauth2:oauth2 --chmod=644 oauth2-proxy.cfg /opt/conf/

# Switch to non-root user
USER oauth2

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:4180/ping || exit 1