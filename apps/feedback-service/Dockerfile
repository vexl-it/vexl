FROM node:24 as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/feedback-service

RUN yarn workspaces focus @vexl-next/feedback-service
RUN yarn build
# RUN npx @sentry/wizard@latest -i sourcemaps


FROM node:24 as runner

ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="Feedback service - ${ENVIRONMENT}"

COPY --from=builder /app/apps/feedback-service/ /app/apps/feedback-service
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

WORKDIR /app/apps/feedback-service

CMD ["node", "dist/index.cjs"]
