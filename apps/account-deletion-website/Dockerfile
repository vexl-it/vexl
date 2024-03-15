FROM node:19-alpine as builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/account-deletion-website

RUN yarn install
RUN yarn build


FROM node:19-alpine as runner


COPY --from=builder /app/apps/account-deletion-website/ /app/apps/account-deletion-website/
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

WORKDIR /app/apps/account-deletion-website

CMD ["yarn", "start"]
