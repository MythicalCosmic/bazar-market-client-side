FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=https://api.bazarmarket.org/api
ARG VITE_FILES_API_KEY
ARG VITE_APP_NAME=Bazar\ Market
ARG VITE_DEFAULT_LOCALE=uz
ARG VITE_DEFAULT_LAT=40.5553
ARG VITE_DEFAULT_LNG=71.4742

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_FILES_API_KEY=$VITE_FILES_API_KEY
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_DEFAULT_LOCALE=$VITE_DEFAULT_LOCALE
ENV VITE_DEFAULT_LAT=$VITE_DEFAULT_LAT
ENV VITE_DEFAULT_LNG=$VITE_DEFAULT_LNG

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
