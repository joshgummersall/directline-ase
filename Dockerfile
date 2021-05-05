FROM node:14

RUN mkdir -p /usr/src/app

ENV NODE_ENV production
ENV PORT 3000

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .


RUN yarn --frozen-lockfile

COPY . .

RUN yarn build

EXPOSE 3000

USER node

CMD [ "yarn", "start" ]
