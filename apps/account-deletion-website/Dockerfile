FROM node:20-alpine as builder

WORKDIR /app

COPY . .
COPY yarn.lock ./

RUN corepack enable && corepack prepare yarn@3.4.1 --activate
RUN yarn install

WORKDIR /app/apps/account-deletion-website

RUN yarn install
RUN yarn build

CMD ["yarn", "start"]
