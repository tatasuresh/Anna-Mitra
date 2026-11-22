# Anna Mitra — container image.
#
# Node 22 to match the toolchain this app was generated and
# type-checked with; a different major is a different set of type errors.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Only the manifests first, so a source-only change does not reinstall.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN mkdir -p public
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
# Never run as root in a container that serves the internet.
USER node
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma ./prisma
EXPOSE 3000
# Create/upgrade tables, clear end-to-end test data and repair inconsistent sample rows, seed demo accounts
# (idempotent), then serve.
# `db push` without --accept-data-loss refuses destructive changes.
CMD ["sh", "-c", "node_modules/.bin/prisma db push --skip-generate; node_modules/.bin/tsx prisma/maintenance.ts; node_modules/.bin/tsx prisma/seed.ts; npm start"]
