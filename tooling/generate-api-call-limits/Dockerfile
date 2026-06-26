# syntax=docker/dockerfile:1
FROM node:24 as builder

WORKDIR /app

COPY . .

WORKDIR /app/tooling/generate-api-call-limits

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    corepack enable && \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --filter @vexl-next/generate-api-call-limits...
RUN pnpm build
# RUN npx @sentry/wizard@latest -i sourcemaps


FROM node:24 as runner


COPY --from=builder /app/tooling/generate-api-call-limits/ /app/tooling/generate-api-call-limits
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json


WORKDIR /app/tooling/generate-api-call-limits
