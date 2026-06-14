# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# VITE_API_URL is read from .env.production at build time and baked into the
# bundle (import.meta.env.VITE_API_URL). Change it there, not on the server.
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine

# SPA routing (mirrors the rewrite rule from vercel.json)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Built static assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
