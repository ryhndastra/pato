#!/usr/bin/env bash
set -e

echo "🚀 [1/3] Mengambil kode terbaru dari Git..."
git pull origin main

echo "🐳 [2/3] Membuild dan merestart container Docker..."
docker compose up -d --build

echo "🧹 [3/3] Membersihkan image lama yang tidak terpakai..."
docker image prune -f

echo "✨ PaTo berhasil di-update dan aktif berjalan di Docker!"
