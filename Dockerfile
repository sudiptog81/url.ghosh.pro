FROM node:lts-buster-slim

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn

COPY . .

EXPOSE 80
CMD ["npm", "start"]
