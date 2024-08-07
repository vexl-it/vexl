FROM node:19 as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/user-service

RUN yarn workspaces focus @vexl-next/user-service
RUN yarn build
# RUN npx @sentry/wizard@latest -i sourcemaps


FROM node:19 as runner

ARG SERVICE_VERSION

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="User service"

COPY --from=builder /app/apps/user-service/ /app/apps/user-service
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

WORKDIR /app/apps/user-service

CMD ["node", "dist/index.cjs"]
