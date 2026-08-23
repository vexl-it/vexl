# syntax=docker/dockerfile:1
# The geocoding dataset refresh pipeline (scripts/refresh.sh), self-contained:
# one `docker run` downloads the raw OSM extracts, filters them and ingests
# them into the geocoding Postgres — see README "Refreshing the dataset".
#
# Build from the repo root (the monorepo is the build context):
#   docker build -f tooling/location-db-updater/Dockerfile .

# --- Pruner stage -----------------------------------------------------------
# Same pattern as the root Dockerfile: reduce the monorepo to just this
# package and its workspace dependencies.
FROM node:24 AS pruner

ARG TURBO_VERSION=2.10.0

WORKDIR /app

COPY . .

RUN npm install -g turbo@${TURBO_VERSION}
RUN turbo prune @vexl-next/location-db-updater --docker

# --- Builder stage ----------------------------------------------------------
FROM node:24 AS builder

WORKDIR /app

COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/patches ./patches

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    corepack enable && \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ ./
RUN pnpm --config.verify-deps-before-run=false \
    --filter @vexl-next/location-db-updater build

# --- Production deps stage --------------------------------------------------
FROM node:24 AS prod-deps

WORKDIR /app

COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/patches ./patches

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    corepack enable && \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --prod --frozen-lockfile

# --- Runner stage -----------------------------------------------------------
FROM node:24-slim AS runner

ARG SERVICE_VERSION

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV USE_COMPILED_INGEST=true

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl osmium-tool && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --chown=node:node --from=prod-deps /app/node_modules /app/node_modules
COPY --chown=node:node --from=prod-deps /app/package.json /app/package.json
COPY --chown=node:node --from=builder /app/tooling/location-db-updater/dist /app/tooling/location-db-updater/dist
COPY --chown=node:node --from=builder /app/tooling/location-db-updater/package.json /app/tooling/location-db-updater/package.json
COPY --chown=node:node --from=pruner /app/out/full/tooling/location-db-updater/scripts/refresh.sh /app/tooling/location-db-updater/scripts/refresh.sh

RUN mkdir /data && chown node:node /data

# Raw + filtered OSM files and refresh.log land here — mount a volume so an
# interrupted or repeated run resumes from the already-validated downloads.
VOLUME /data

USER node

# Configuration (GEOCODING_DB_* and SLACK_ALERT_WEBHOOK_URL) comes from the
# environment (`docker run --env-file`). Any arguments are passed through to
# refresh.sh (stages, -r regions); with none it refreshes the whole world.
ENTRYPOINT ["sh", "tooling/location-db-updater/scripts/refresh.sh", "-d", "/data"]
