#!/usr/bin/env bash
set -e

echo "🚀 [1/4] Mengambil kode terbaru dari Git..."
git pull origin main

echo "📦 [2/4] Menginstall dependencies dan build frontend & backend..."
npm install
npm run build

echo "🗄️ [3/4] Menjalankan migrasi database..."
npm --workspace=backend run migrate

echo "🔄 [4/4] Merestart service backend..."
pm2 restart pato-backend || pm2 start ecosystem.config.cjs

echo "✨ Deploy/Update selesai! PaTo aktif berjalan."
