FROM node:24 as builder

WORKDIR /app

COPY . .

WORKDIR /app/tooling/handy-scripts

RUN yarn workspaces focus @vexl-next/dashboard-app
RUN yarn build
# RUN npx @sentry/wizard@latest -i sourcemaps


FROM node:24 as runner


COPY --from=builder /app/tooling/handy-scripts/ /app/tooling/handy-scripts
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json


WORKDIR /app/tooling/handy-scripts

