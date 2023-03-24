FROM node:19-alpine as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/location-service

RUN yarn install
RUN yarn build


FROM node:19-alpine as runner

COPY --from=builder /app/apps/location-service/dist dist
COPY --from=builder /app/apps/location-service/package.json package.json

CMD ["yarn", "start"]
