FROM node:19 as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/metrics-service

RUN yarn workspaces focus @vexl-next/metrics-service
RUN yarn build
# RUN npx @sentry/wizard@latest -i sourcemaps


FROM node:19 as runner


ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="Metrics service - ${ENVIRONMENT}"

COPY --from=builder /app/apps/metrics-service/ /app/apps/metrics-service
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

WORKDIR /app/apps/metrics-service

CMD ["node", "dist/index.cjs"]
