# Project Memory

Memori lokal proyek ini. ringkasan keputusan penting yang gak boleh hilang saat context window diringkas.

## Konteks
- file ini dibuat otomatis oleh phantom-nixos-bridge saat proyek pertama kali terdeteksi
- sinkron ke Obsidian Vault lewat mirror global Hermes

## Catatan
- backend pindah dari go ke express dan typescript, entry di backend/src/index.ts, migrasi di backend/src/migrate.ts
- konfigurasi database lewat DATABASE_URL postgres, jwt secret dan google client id diisi di backend/.env yang di-ignore
- frontend pakai react router 8 dan tailwind 4 lewat plugin vite, halaman dipisah per folder di frontend/src/pages
- npx tidak ada di PATH, jalankan binary lokal langsung misalnya ./node_modules/.bin/tsc atau ./node_modules/.bin/vite
- jangan lupa backend/go.mod sudah dihapus, tinggal sisa referensi if any
- joinRoom atomik pakai transaksi + SELECT ... FOR UPDATE pada baris rooms untuk serialisasi per-room, retry terbatas hanya kode SQLSTATE 40001 dan 40P01
- tabel members hanya punya unique (room_id, guest_token), tidak ada unique display_name, jadi keunikan nama dijaga di aplikasi lewat row lock room
- rate limiter terpisah di backend/src/middleware/rateLimit.ts, auth 20/menit dan join 30/menit, route GET sengaja tidak dilimit
- scratch test pakai database isolasi pato_scratch di container wbs_postgres port 5433, JANGAN sentuh DATABASE_URL utama di backend/.env
- bug pra-ada: generateRoomCode memakai prefix judul sehingga judul panjang menghasilkan kode lebih dari 12 karakter dan gagal insert rooms (varchar(12))
