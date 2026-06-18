# Single parameterized Dockerfile for all backend services.
# Select the service via the APP build arg (directory name under apps/),
# e.g. --build-arg APP=content-service

# --- Pruner stage -----------------------------------------------------------
# Produces a minimal, deterministic subset of the monorepo for the target app:
#   /app/out/json  -> only the package.json manifests (cacheable install input)
#   /app/out/full  -> full source of the pruned package set
#   /app/out/yarn.lock -> lockfile scoped to the pruned set
# Running turbo prune here means no host/CI prework is required.
FROM node:24 as pruner

ARG APP

WORKDIR /app

COPY . .

# node_modules is not installed in this stage (it is in .dockerignore), so run
# turbo via npx from a globally installed, version-pinned copy.
RUN npm install -g turbo@2.9.14
RUN turbo prune @vexl-next/${APP} --docker


# --- Builder stage ----------------------------------------------------------
FROM node:24 as builder

ARG APP

WORKDIR /app

# Install layer: depends only on the manifests, the lockfile and the committed
# Yarn zero-install cache (under .yarn/). Because none of these change when only
# source changes, this expensive layer is cached across source-only rebuilds.
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/yarn.lock ./yarn.lock
COPY --from=pruner /app/.yarn/ ./.yarn/
COPY --from=pruner /app/.yarnrc.yml ./.yarnrc.yml

# Immutable installs are disabled because the pruned lockfile may need to be
# reconciled in-image; nothing is fetched from the network — the committed
# .yarn/cache already contains every package zip (zero-installs).
RUN YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn workspaces focus @vexl-next/${APP}

# Build layer: full source of the pruned set. Changes here do NOT invalidate the
# install layer above.
COPY --from=pruner /app/out/full/ ./
RUN yarn workspace @vexl-next/${APP} build


# --- Production deps stage --------------------------------------------------
# Installs ONLY production dependencies for the target app, reusing the same
# pruner install inputs as the builder (so this layer caches identically) but
# with --production so devDependencies (typescript, esbuild, jest, eslint,
# prettier, @types, ...) are excluded from the runtime image.
FROM node:24 as prod-deps

ARG APP

WORKDIR /app

COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/yarn.lock ./yarn.lock
COPY --from=pruner /app/.yarn/ ./.yarn/
COPY --from=pruner /app/.yarnrc.yml ./.yarnrc.yml

RUN YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn workspaces focus --production @vexl-next/${APP}


# --- Runner stage -----------------------------------------------------------
# Slim runtime image: ships only the built dist/, the app's package.json
# (needed for "type":"module" so Node treats dist/index.js as ESM) and the
# production node_modules. No source, no tests, no devDependencies.
FROM node:24-slim as runner

# ARGs do not cross build stages, so re-declare the ones this stage needs.
ARG APP
ARG SERVICE_VERSION
ARG ENVIRONMENT
ARG SERVICE_DISPLAY_NAME=${APP}

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="${SERVICE_DISPLAY_NAME} - ${ENVIRONMENT}"

WORKDIR /app

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/package.json /app/package.json
COPY --from=builder /app/apps/${APP}/dist /app/apps/${APP}/dist
COPY --from=builder /app/apps/${APP}/package.json /app/apps/${APP}/package.json

WORKDIR /app/apps/${APP}

CMD ["node", "--enable-source-maps", "dist/index.js"]
