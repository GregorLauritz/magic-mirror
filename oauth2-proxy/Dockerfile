ARG OAUTH2_PROXY_VERSION=v7.8.1

FROM quay.io/oauth2-proxy/oauth2-proxy:${OAUTH2_PROXY_VERSION}

COPY rootCA.pem /etc/

COPY --chmod=755 ssl/ /opt/ssl/

COPY oauth2-proxy.cfg /opt/conf/
