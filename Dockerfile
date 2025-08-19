
FROM node:18


WORKDIR /app


COPY package*.json ./


RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build


EXPOSE 3044


CMD ["npm", "run", "serve", "--", "--host", "0.0.0.0"]
