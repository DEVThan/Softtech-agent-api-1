# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# copy package files and tsconfig
COPY package*.json ./
COPY tsconfig.json ./

# install deps and build
RUN npm ci
COPY src ./src
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# copy only production deps
COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --only=production

# copy built output
COPY --from=builder /app/dist ./dist

# create non-root user and set ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3006/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]