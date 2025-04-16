FROM node:20 as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/content-service

RUN yarn workspaces focus @vexl-next/content-service
RUN yarn build
# RUN npx @sentry/wizard@latest -i sourcemaps


FROM node:20 as runner

ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="content service - ${ENVIRONMENT}"

COPY --from=builder /app/apps/content-service/ /app/apps/content-service
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

WORKDIR /app/apps/content-service

CMD ["node", "dist/index.cjs"]
