FROM node:19 as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/dashboard-app

RUN yarn workspaces focus @vexl-next/dashboard-app
RUN yarn build
# RUN npx @sentry/wizard@latest -i sourcemaps


FROM node:19 as runner

ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="Offer service - ${ENVIRONMENT}"

COPY --from=builder /app/apps/dashboard-app/ /app/apps/dashboard-app
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json


WORKDIR /app/apps/dashboard-app

CMD ["yarn", "start"]
