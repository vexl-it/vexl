# syntax=docker/dockerfile:1
# Optimized multi-stage build for the dashboard app (Vite client + esbuild server).
# Mirrors the backend pipeline: turbo prune -> cacheable install -> build -> slim runner.

# --- Pruner stage -----------------------------------------------------------
# Produces a minimal, deterministic subset of the monorepo for this app:
#   /app/out/json -> only the package.json manifests (cacheable install input)
#   /app/out/full -> full source of the pruned package set
#   /app/out/pnpm-lock.yaml -> lockfile scoped to the pruned set
FROM node:24 as pruner
ARG TURBO_VERSION=2.10.0
WORKDIR /app
COPY . .
# node_modules is in .dockerignore, so install turbo globally to run prune.
RUN npm install -g turbo@${TURBO_VERSION}
RUN turbo prune @vexl-next/dashboard-app --docker

# --- Builder stage ----------------------------------------------------------
FROM node:24 as builder
WORKDIR /app

# Install layer: depends only on the manifests, the lockfile and patch files.
# Source-only changes do NOT invalidate this layer.
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/patches ./patches
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    corepack enable && \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# Build layer: full source of the pruned set (typecheck is gated by the
# test-lint CI workflow, so `build` only bundles the server + client).
COPY --from=pruner /app/out/full/ ./
RUN pnpm --filter @vexl-next/dashboard-app build

# --- Production deps stage --------------------------------------------------
# Installs ONLY production dependencies, reusing the same cacheable install
# inputs so devDependencies (vite, esbuild, typescript, jest, ...) stay out of
# the runtime image.
FROM node:24 as prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/patches ./patches
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    corepack enable && \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --prod --frozen-lockfile

# --- Runner stage -----------------------------------------------------------
# Slim runtime: only the production node_modules + the built dist/ (bundled
# server + Vite client static assets). No source, no devDependencies.
FROM node:24-slim as runner
WORKDIR /app

ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="Dashboard app service - ${ENVIRONMENT}"

COPY --chown=node:node --from=prod-deps /app/node_modules /app/node_modules
COPY --chown=node:node --from=prod-deps /app/package.json /app/package.json
COPY --chown=node:node --from=builder /app/apps/dashboard-app/dist /app/apps/dashboard-app/dist
COPY --chown=node:node --from=builder /app/apps/dashboard-app/package.json /app/apps/dashboard-app/package.json

WORKDIR /app/apps/dashboard-app

USER node

CMD ["node", "dist/server/index.cjs"]
