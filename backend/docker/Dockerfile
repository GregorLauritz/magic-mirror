ARG NODE_IMG_VERSION=20-alpine3.21
ARG NODE_ENV=production

FROM node:${NODE_IMG_VERSION}

ENV NODE_PATH=./src
ENV NODE_ENV=${NODE_ENV}

RUN apk --no-cache add ca-certificates \
    && rm -rf /var/cache/apk/*

COPY rootCA.pem /usr/local/share/ca-certificates/rootCa.crt

RUN update-ca-certificates

WORKDIR /opt

COPY . .

RUN mv ssl /etc/express

RUN yarn install

CMD [ "yarn", "prod" ]