ARG NODE_IMG_VERSION=24-alpine3.23

FROM node:${NODE_IMG_VERSION} AS builder

ENV REACT_APP_NODE_ENV=production

WORKDIR /opt 

COPY . .

RUN yarn install && yarn build

FROM nginx:latest

ENV REACT_APP_NODE_ENV=production

COPY --from=builder /opt/dist /var/www/frontend/html

COPY --from=builder /opt/nginx/nginx.conf /etc/nginx/conf.d/frontend.conf

EXPOSE 3000