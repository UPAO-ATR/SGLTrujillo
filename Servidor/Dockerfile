FROM node:22-alpine
WORKDIR /aplicacion
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npm run preparar && npm start"]