# ── Build stage ─────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ── Runtime stage ───────────────────────────────────────────
FROM nginx:alpine
COPY docker-entrypoint.sh /gigdrive-entrypoint.sh
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["/gigdrive-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
