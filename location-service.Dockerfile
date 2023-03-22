FROM node:16-alpine

WORKDIR /app

COPY . .

WORKDIR /app/apps/location-service

RUN yarn install
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]
