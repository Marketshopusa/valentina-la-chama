# syntax=docker/dockerfile:1

# ---------- Stage 1: build client + server bundle ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Install all deps (incl. dev) needed to build the Vite client and esbuild the server.
COPY package.json package-lock.json ./
RUN npm ci

# Build: `vite build` -> dist/ (client) and esbuild -> dist/server.cjs
COPY . .
RUN npm run build

# Prune to production-only dependencies for a smaller runtime image.
RUN npm prune --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Production dependencies and the built artifacts.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist

# Static assets served at runtime (uploads dir + downloadable archive).
COPY --from=builder /app/public ./public

# Writable state/upload directories (mount volumes here in production for persistence).
RUN mkdir -p /app/data /app/data/users /app/public/uploads /app/uploads

EXPOSE 3000

# Lightweight healthcheck against the app's own /api/health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.cjs"]
