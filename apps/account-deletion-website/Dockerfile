FROM node:24-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare yarn@3.4.1 --activate

COPY . .

WORKDIR /app/apps/account-deletion-website

RUN yarn workspaces focus account-deletion-website
RUN yarn build

RUN mkdir -p .next/standalone/apps/account-deletion-website/.next && cp -r .next/static .next/standalone/apps/account-deletion-website/.next/
RUN if [ -d "public" ]; then cp -r public .next/standalone/apps/account-deletion-website/; fi

FROM node:24-alpine AS runner
WORKDIR /app

ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV NODE_ENV=production
ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="Account Deletion Website - ${ENVIRONMENT}"
ENV PORT=3000

COPY --from=builder /app/apps/account-deletion-website/.next/standalone ./

EXPOSE 3000

CMD ["node", "apps/account-deletion-website/server.js"]
