# Stage 1: Install dependencies
FROM node:22-slim AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build the application
FROM node:22-slim AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy production environment variables
COPY .env.production .env.production

# Next.js collects anonymous telemetry data. Disable it.
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js
RUN npm run build

# Stage 3: Production image
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create system user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install tini for proper signal handling
RUN apt-get update && \
    apt-get install -y \
    apt-transport-https \
    ca-certificates \
    tini \
    && rm -rf /var/lib/apt/lists/*

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create logs directory (if needed)
RUN mkdir -p logs && chown nextjs:nodejs logs

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Configure proper signal handling
STOPSIGNAL SIGTERM

ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["node", "server.js"]