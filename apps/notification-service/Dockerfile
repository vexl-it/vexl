FROM node:19 as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/notification-service


RUN yarn workspaces focus @vexl-next/notification-service
RUN yarn build


FROM node:19 as runner

ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="Notification service - ${ENVIRONMENT}"

COPY --from=builder /app/apps/notification-service/ /app/apps/notification-service
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

WORKDIR /app/apps/notification-service

CMD ["node", "dist/index.cjs"]
