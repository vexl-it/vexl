# Optimized multi-stage build for the dashboard app (Vite client + esbuild server).
# Mirrors the backend pipeline: turbo prune -> cacheable install -> build -> slim runner.

# --- Pruner stage -----------------------------------------------------------
# Produces a minimal, deterministic subset of the monorepo for this app:
#   /app/out/json -> only the package.json manifests (cacheable install input)
#   /app/out/full -> full source of the pruned package set
#   /app/out/yarn.lock -> lockfile scoped to the pruned set
FROM node:24 as pruner
WORKDIR /app
COPY . .
# node_modules is in .dockerignore, so install turbo globally to run prune.
RUN npm install -g turbo@2.9.14
RUN turbo prune @vexl-next/dashboard-app --docker

# --- Builder stage ----------------------------------------------------------
FROM node:24 as builder
WORKDIR /app

# Install layer: depends only on the manifests, the lockfile and the committed
# Yarn zero-install cache. Source-only changes do NOT invalidate this layer.
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/yarn.lock ./yarn.lock
COPY --from=pruner /app/.yarn/ ./.yarn/
COPY --from=pruner /app/.yarnrc.yml ./.yarnrc.yml
RUN YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn workspaces focus @vexl-next/dashboard-app

# Build layer: full source of the pruned set (typecheck is gated by the
# test-lint CI workflow, so `build` only bundles the server + client).
COPY --from=pruner /app/out/full/ ./
RUN yarn workspace @vexl-next/dashboard-app build

# --- Production deps stage --------------------------------------------------
# Installs ONLY production dependencies, reusing the same cacheable install
# inputs so devDependencies (vite, esbuild, typescript, jest, ...) stay out of
# the runtime image.
FROM node:24 as prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/yarn.lock ./yarn.lock
COPY --from=pruner /app/.yarn/ ./.yarn/
COPY --from=pruner /app/.yarnrc.yml ./.yarnrc.yml
RUN YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn workspaces focus --production @vexl-next/dashboard-app

# --- Runner stage -----------------------------------------------------------
# Slim runtime: only the production node_modules + the built dist/ (bundled
# server + Vite client static assets). No source, no devDependencies.
FROM node:24-slim as runner
WORKDIR /app

ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="Dashboard app service - ${ENVIRONMENT}"

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/package.json /app/package.json
COPY --from=builder /app/apps/dashboard-app/dist /app/apps/dashboard-app/dist
COPY --from=builder /app/apps/dashboard-app/package.json /app/apps/dashboard-app/package.json

WORKDIR /app/apps/dashboard-app

CMD ["node", "dist/server/index.cjs"]
