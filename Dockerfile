# # Production image for Node.js Express API
# FROM node:20-alpine

# WORKDIR /app

# # Install production dependencies
# COPY package*.json ./

# ENV NODE_ENV=production
# # RUN npm install --production --no-optional
# # RUN npm install --production
# RUN npm install


# # Copy all source code
# COPY . .


# ## Copy application source code
# # COPY index.js ./
# # COPY db.js ./
# # COPY .env ./
# # COPY controllers ./controllers
# # COPY middleware ./middleware
# # COPY routes ./routes

# # Create uploads directory and set permissions
# RUN mkdir -p uploads && \
#     addgroup -g 1001 -S nodejs && \
#     adduser -S nodejs -u 1001 && \
#     chown -R nodejs:nodejs /app

# USER nodejs

# EXPOSE 3006

# # Health check endpoint
# HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3006) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# CMD ["node", "index.js"]

FROM node:20-alpine

WORKDIR /app

# ตั้ง environment ก่อนติดตั้ง dependencies
ENV NODE_ENV=production

# Copy และติดตั้ง dependencies แบบ production
COPY package*.json ./
# RUN npm ci --only=production
RUN npm install --omit=dev

# Copy source code ทั้งหมด
COPY . .

# สร้าง uploads directory และกำหนดสิทธิ์
# RUN mkdir -p uploads && \
#     addgroup -g 1001 -S nodejs && \
#     adduser -S nodejs -u 1001 && \
#     chown -R nodejs:nodejs /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3006/health || exit 1

CMD ["node", "index.js"]
