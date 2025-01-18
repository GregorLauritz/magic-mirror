FROM quay.io/oauth2-proxy/oauth2-proxy:v7.8.1

COPY rootCA.pem /etc/

COPY --chmod=755 ssl/ /opt/ssl/

COPY oauth2-proxy.cfg /opt/conf/
