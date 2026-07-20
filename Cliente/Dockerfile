FROM node:22-alpine AS constructor
WORKDIR /aplicacion
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_URL_API
ENV VITE_URL_API=$VITE_URL_API
RUN npm run construir

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=constructor /aplicacion/dist /usr/share/nginx/html
EXPOSE 80