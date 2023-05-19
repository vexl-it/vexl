FROM node:19-alpine as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/contact-service

RUN yarn install
RUN yarn build


FROM node:19-alpine as runner

COPY --from=builder /app/apps/service/dist dist

CMD ["node", "dist/index.js"]
