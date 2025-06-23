FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8000

CMD ["node", "dist/index.js"]
