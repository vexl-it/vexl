FROM node:20 as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/btc-exchange-rate-service

RUN yarn workspaces focus @vexl-next/btc-exchange-rate-service
RUN yarn build
# RUN npx @sentry/wizard@latest -i sourcemaps


FROM node:20 as runner

ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="BTC exchange rate service - ${ENVIRONMENT}"

COPY --from=builder /app/apps/btc-exchange-rate-service/ /app/apps/btc-exchange-rate-service
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

WORKDIR /app/apps/btc-exchange-rate-service

CMD ["node", "dist/index.cjs"]
