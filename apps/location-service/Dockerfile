FROM node:19-alpine as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/location-service

RUN yarn install
RUN yarn build


FROM node:19-alpine as runner

COPY --from=builder /app/apps/location-service/dist dist

CMD ["node", "dist/index.js"]
