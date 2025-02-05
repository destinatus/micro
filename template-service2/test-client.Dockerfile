FROM node:20-alpine

WORKDIR /usr/src/app

COPY test-package.json ./package.json
COPY test-client.js .

RUN npm install

CMD ["node", "test-client.js"]
