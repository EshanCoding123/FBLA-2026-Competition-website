# Build a container for Google Cloud Run / App Engine (Node 20)
# Serves both the API and the static site from the same image

FROM node:20-alpine AS deps
WORKDIR /app/server
# Install only server dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy installed server node_modules
COPY --from=deps /app/server /app/server

# Copy the full project so we can serve static files too
# Build context must be the repository root (see README build command)
COPY . /app

# Environment (override at deploy time)
ENV PORT=8080 \
    STATIC_DIR=/app \
    MONGO_URI=mongodb://127.0.0.1:27017/lostfound \
    JWT_SECRET=change-me \
    ADMIN_PASSWORD=ChangeThisAdminPassword!123

EXPOSE 8080

CMD ["node", "server/server.js"]
