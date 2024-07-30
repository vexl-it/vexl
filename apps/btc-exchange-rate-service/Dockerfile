FROM node:19 as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/exchange-rate-service

RUN yarn workspaces focus @vexl-next/exchange-rate-service
RUN yarn build
# RUN npx @sentry/wizard@latest -i sourcemaps


FROM node:19 as runner


COPY --from=builder /app/apps/exchange-rate-service/ /app/apps/exchange-rate-service
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

WORKDIR /app/apps/exchange-rate-service

CMD ["node", "dist/index.cjs"]
