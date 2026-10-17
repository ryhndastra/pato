# =====================================================================
# Dockerfile - PaTo Frontend (Vite + React + Tailwind + Nginx Alpine)
# =====================================================================

# Gunakan Debian slim untuk builder agar kompatibel dengan native binary Rolldown/esbuild (glibc)
FROM node:22-slim AS builder

WORKDIR /app

# Argumen build Google Client ID jika disuplai via environment
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

# ─── LAYER CACHE TRICK ──────────────────────────────────────────────
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm config set fetch-retries 5 && \
    npm ci

# Copy source code frontend
COPY frontend ./frontend

# Build frontend ke folder frontend/dist
RUN npm --workspace=frontend run build

# ─── SERVING STAGE (Nginx Alpine ~15MB) ──────────────────────────────
FROM nginx:alpine

# Salin konfigurasi Nginx reverse proxy
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Salin file static hasil build Vite
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
