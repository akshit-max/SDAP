# Stage 1: Builder
FROM node:20.18.1-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++ openssl
WORKDIR /app
COPY . .
RUN npm install -g npm@11.9.0
RUN npm ci
# Generate Prisma client for types
RUN cd packages/db && npx prisma generate
# Build Web (Disable Next.js telemetry)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx turbo run build --filter=web

# Stage 2: Runner
FROM node:20.18.1-alpine AS runner
RUN apk add --no-cache curl openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

# Health check (Next.js typically doesn't have /api/health unless added, we'll hit root)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "apps/web/server.js"]

