#!/usr/bin/env bash
set -e

# Pindah ke root directory repository
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo "🚀 [1/3] Mengambil kode terbaru dari Git..."
git pull origin main

echo "🐳 [2/3] Membuild dan merestart container Docker..."
docker compose --env-file .env.docker up -d --build

echo "🧹 [3/3] Membersihkan image lama yang tidak terpakai..."
docker image prune -f

echo "✨ PaTo berhasil di-update dan aktif berjalan di Docker!"
