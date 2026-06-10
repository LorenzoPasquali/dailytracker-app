# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# VITE_API_URL is baked into the bundle at build time. We use a placeholder
# here and replace it at container startup (see docker-entrypoint.sh), so the
# same image can target any backend URL defined on the server.
ARG VITE_API_URL=__VITE_API_URL__
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine

# SPA routing (mirrors the rewrite rule from vercel.json)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Built static assets
COPY --from=build /app/dist /usr/share/nginx/html

# Runtime env injection. The official nginx image automatically runs every
# script in /docker-entrypoint.d/ before starting nginx.
COPY docker-entrypoint.sh /docker-entrypoint.d/40-env-subst.sh
RUN chmod +x /docker-entrypoint.d/40-env-subst.sh

EXPOSE 80
