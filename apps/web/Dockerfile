# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root configurations
COPY package*.json ./
COPY turbo.json ./

# Copy packages and apps
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies (workspaces)
RUN npm ci

# Generate Prisma client for types
RUN cd packages/db && npx prisma generate

# Build Web (Disable Next.js telemetry)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=web

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built artifacts
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Note: Standalone output puts the server in apps/web/server.js
CMD ["node", "apps/web/server.js"]
