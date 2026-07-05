# Multi-stage build for the SCAM BANK SPA (Vite/React).
# Build stage compiles the bundle on Node; runtime stage serves static dist/ via nginx.
# Node 22-alpine is mandatory: Vite 8 requires Node 20.19+ / 22.12+ (node:18 would break).

# ---- build stage ----
FROM node:22.12-alpine AS build
WORKDIR /app

# Copy manifests first so the `npm ci` layer is cached independently of src changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and produce the production bundle in /app/dist.
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine

# Static bundle only — no Node in the runtime image.
COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback + reverse-proxy config (replaces nginx default site).
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
