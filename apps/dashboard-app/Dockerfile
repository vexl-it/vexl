FROM node:20 as builder

WORKDIR /app

COPY . .


# Enable corepack
RUN corepack enable

# Prepare correct yarn version from package.json's "packageManager"
RUN corepack install

WORKDIR /app/apps/dashboard-app

RUN yarn workspaces focus @vexl-next/dashboard-app
RUN yarn build

FROM node:20 as runner

ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="Dashboard app service - ${ENVIRONMENT}"


COPY --from=builder /app/apps/dashboard-app/ /app/apps/dashboard-app
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/yarn.lock /app/yarn.lock


WORKDIR /app
# Enable corepack
RUN corepack enable
# Prepare correct yarn version from package.json's "packageManager"
RUN corepack install

WORKDIR /app/apps/dashboard-app

CMD ["node", "dist/server/index.cjs"]
