# Optimized multi-stage build for the backoffice Next.js app.
# Mirrors the backend pipeline: turbo prune -> cacheable install -> build -> slim runner.

# --- Pruner stage -----------------------------------------------------------
# Produces a minimal, deterministic subset of the monorepo for this app:
#   /app/out/json -> only the package.json manifests (cacheable install input)
#   /app/out/full -> full source of the pruned package set
#   /app/out/yarn.lock -> lockfile scoped to the pruned set
FROM node:24 AS pruner
WORKDIR /app
COPY . .
# node_modules is in .dockerignore, so install turbo globally to run prune.
RUN npm install -g turbo@2.9.14
RUN turbo prune @vexl-next/backoffice-app --docker

# --- Builder stage ----------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app

# Install layer: depends only on the manifests, the lockfile and the committed
# Yarn zero-install cache. Source-only changes do NOT invalidate this layer.
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/yarn.lock ./yarn.lock
COPY --from=pruner /app/.yarn/ ./.yarn/
COPY --from=pruner /app/.yarnrc.yml ./.yarnrc.yml
RUN YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn workspaces focus @vexl-next/backoffice-app

# Build layer: full source of the pruned set.
COPY --from=pruner /app/out/full/ ./
RUN yarn workspace @vexl-next/backoffice-app build

# Copy static assets INTO the standalone folder (not included by default).
WORKDIR /app/apps/backoffice-app
RUN cp -r .next/static .next/standalone/apps/backoffice-app/.next/ || true
RUN if [ -d "public" ]; then cp -r public .next/standalone/apps/backoffice-app/; fi

# --- Runner stage -----------------------------------------------------------
# Next.js standalone output already bundles a minimal traced node_modules.
FROM node:24-alpine AS runner
WORKDIR /app

ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV NODE_ENV=production
ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="Backoffice App - ${ENVIRONMENT}"
ENV PORT=3000

COPY --from=builder /app/apps/backoffice-app/.next/standalone ./

EXPOSE 3000

CMD ["node", "apps/backoffice-app/server.js"]
