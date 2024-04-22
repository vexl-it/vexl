FROM node:19 as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/notification-service


RUN yarn install
RUN yarn build


FROM node:19 as runner


COPY --from=builder /app/apps/notification-service/ /app/apps/notification-service
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

WORKDIR /app/apps/notification-service

CMD ["node", "dist/index.cjs"]
