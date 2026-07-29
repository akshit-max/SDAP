# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies needed for node-gyp and Prisma
RUN apk add --no-cache python3 make g++ openssl

# Copy root configurations
COPY package*.json ./
COPY turbo.json ./

# Copy packages and apps
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies (workspaces)
RUN npm ci

# Generate Prisma client
RUN cd packages/db && npx prisma generate

# Build API
RUN npm run build --workspace=api

# Production stage
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Set production env
ENV NODE_ENV=production

# Copy built artifacts and production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Non-root user for security
USER node

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "run", "start:prod", "--workspace=api"]
