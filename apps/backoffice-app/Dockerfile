FROM node:24-alpine AS builder
WORKDIR /app

# Copy entire monorepo
COPY . .

# Set working directory to backoffice app
WORKDIR /app/apps/backoffice-app

# Focus workspace and build (omit --production to include devDependencies)
RUN yarn workspaces focus @vexl-next/backoffice-app
RUN yarn build

# Copy static assets INTO standalone folder (as per Next.js docs)
# This is required because standalone output doesn't include these by default
RUN cp -r .next/static .next/standalone/apps/backoffice-app/.next/ || true
RUN if [ -d "public" ]; then cp -r public .next/standalone/apps/backoffice-app/; fi

FROM node:24-alpine AS runner
WORKDIR /app

ARG SERVICE_VERSION
ARG ENVIRONMENT

ENV NODE_ENV=production
ENV SERVICE_VERSION=${SERVICE_VERSION}
ENV SERVICE_NAME="Backoffice App - ${ENVIRONMENT}"
ENV PORT=3000

# Copy only the standalone output (minimal size - includes traced dependencies)
COPY --from=builder /app/apps/backoffice-app/.next/standalone ./

EXPOSE 3000

# Start the Next.js server from standalone directory
CMD ["node", "apps/backoffice-app/server.js"]
