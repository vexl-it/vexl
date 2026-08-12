# syntax=docker/dockerfile:1
# The geocoding dataset refresh pipeline (scripts/refresh.sh), self-contained:
# one `docker run` downloads the raw OSM extracts, filters them and ingests
# them into the geocoding Postgres — see README "Refreshing the dataset".
#
# Build from the repo root (the monorepo is the build context):
#   docker build -f packages/geocoding-db/Dockerfile .

# --- Pruner stage -----------------------------------------------------------
# Same pattern as the root Dockerfile: reduce the monorepo to just this
# package and its workspace dependencies.
FROM node:24 AS pruner

ARG TURBO_VERSION=2.10.0

WORKDIR /app

COPY . .

RUN npm install -g turbo@${TURBO_VERSION}
RUN turbo prune @vexl-next/geocoding-db --docker

# --- Runner stage -----------------------------------------------------------
FROM node:24 AS runner

# osmium filters the raw extracts; curl (already in node:24) downloads them.
RUN apt-get update && \
    apt-get install -y --no-install-recommends osmium-tool && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/patches ./patches

# Full install (no --prod): the ingest runs from source via tsx.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    corepack enable && \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ ./

# Raw + filtered OSM files and refresh.log land here — mount a volume so an
# interrupted or repeated run resumes from the already-validated downloads.
VOLUME /data

# Configuration (GEOCODING_DB_* and SLACK_ALERT_WEBHOOK_URL) comes from the
# environment (`docker run --env-file`). Any arguments are passed through to
# refresh.sh (stages, -r regions); with none it refreshes the whole world.
ENTRYPOINT ["sh", "packages/geocoding-db/scripts/refresh.sh", "-d", "/data"]
