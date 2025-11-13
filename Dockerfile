# Root Dockerfile for Cloud Run / Cloud Build
# Builds the Node API (server/) and serves the static site from the same container

FROM node:20-alpine AS deps
WORKDIR /app/server
# Install only server dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Bring in installed server deps and source
COPY --from=deps /app/server /app/server

# Copy the entire repository so static files (index.html, admin.html, assets, etc.) are available
COPY . /app

# Default environment (override in Cloud Run)
ENV PORT=8080 \
    STATIC_DIR=/app \
    MONGO_URI=mongodb://127.0.0.1:27017/lostfound \
    JWT_SECRET=change-me \
    ADMIN_PASSWORD=ChangeThisAdminPassword!123

EXPOSE 8080

CMD ["node", "server/server.js"]
