# Multi-stage Dockerfile for Catan Friends
# Stage 1: Build client
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Minimal runtime container
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Install only production dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production && npm cache clean --force

# Copy artifacts from build stages
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=client-builder /app/client/dist ./client/dist

# Switch to unprivileged node user
USER node

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
