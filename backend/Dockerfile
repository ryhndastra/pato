# =====================================================================
# Dockerfile - PaTo Backend (Express + TypeScript + Node 22 Alpine)
# =====================================================================

FROM node:22-alpine AS builder

WORKDIR /app

# ─── LAYER CACHE TRICK ──────────────────────────────────────────────
# Copy manifest dependencies terlebih dahulu agar layer npm ci di-cache
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm config set fetch-retries 5 && \
    npm ci

# Copy source code backend
COPY backend ./backend

# Build TypeScript menjadi JavaScript di backend/dist
RUN npm --workspace=backend run build

# ─── RUNNER STAGE (Minimal & Aman) ───────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install curl untuk Docker healthcheck
RUN apk add --no-cache curl

# Copy manifest di workspace root
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm config set fetch-retries 5 && \
    npm ci --workspace=backend --omit=dev

# Copy hasil build dan file SQL migrasi
COPY --from=builder /app/backend/dist ./backend/dist
COPY backend/sql ./backend/sql

WORKDIR /app/backend

EXPOSE 4000

# Jalankan migrasi database lalu jalankan server Express
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
