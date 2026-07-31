# Stage 1: Prune
FROM node:20.18.1-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g npm@11.9.0
RUN npm install -g turbo
COPY . .
RUN turbo prune api --docker

# Stage 2: Builder (builds everything)
FROM node:20.18.1-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++ openssl
WORKDIR /app
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY --from=pruner /app/out/full/packages/db/prisma ./packages/db/prisma
RUN npm install -g npm@11.9.0
RUN npm ci
COPY --from=pruner /app/out/full/ .
RUN cd packages/db && npx prisma generate
RUN npx turbo run build --filter=api

# Stage 3: Prod Dependencies
FROM node:20.18.1-alpine AS prod-deps
RUN apk add --no-cache libc6-compat python3 make g++ openssl
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
# Install only production dependencies, ignoring scripts so prisma doesn't crash before it's ready
ENV NODE_ENV=production
RUN npm install -g npm@11.9.0
RUN npm ci --omit=dev --ignore-scripts
# Copy just the prisma schema to generate the client
COPY --from=pruner /app/out/full/packages/db/prisma ./packages/db/prisma
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma

# Stage 4: Runner
FROM node:20.18.1-alpine AS runner
RUN apk add --no-cache openssl curl
WORKDIR /app
ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy root node_modules and workspaces (needed for symlinks)
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
# Copy compiled packages
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
# Copy compiled API app
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/package.json

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "run", "start:prod", "--workspace=api"]

