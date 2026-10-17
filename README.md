# PaTo (Pay Together)

PaTo adalah aplikasi web split-bill sosial berbasis Progressive Web App (PWA) dengan pendekatan mobile-first. Aplikasi ini dirancang untuk memudahkan pembagian tagihan makan bersama secara real-time, fleksibel, dan transparan langsung dari meja restoran tanpa mewajibkan tamu menginstal aplikasi dari app store.

---

## Daftar Isi

- [Latar Belakang](#latar-belakang)
- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Struktur Monorepo](#struktur-monorepo)
- [Prasyarat Sistem](#prasyarat-sistem)
- [Instalasi dan Pengembangan Lokal](#instalasi-dan-pengembangan-lokal)
  - [1. Kloning Repositori](#1-kloning-repositori)
  - [2. Konfigurasi Environment Backend](#2-konfigurasi-environment-backend)
  - [3. Instalasi Dependensi](#3-instalasi-dependensi)
  - [4. Migrasi Database](#4-migrasi-database)
  - [5. Menjalankan Server Pengembangan](#5-menjalankan-server-pengembangan)
- [Deployment dengan Docker](#deployment-dengan-docker)
  - [1. Konfigurasi File Lingkungan](#1-konfigurasi-file-lingkungan)
  - [2. Menjalankan Kontainer](#2-menjalankan-kontainer)
  - [3. Skrip Pembaruan Otomatis](#3-skrip-pembaruan-otomatis)
- [Referensi Variabel Lingkungan](#referensi-variabel-lingkungan)
- [Lisensi](#lisensi)

---

## Latar Belakang

Menghitung pembagian tagihan setelah makan bersama sering kali merepotkan ketika:
- Satu struk berisi pesanan bersama (disharing) dan pesanan pribadi.
- Terdapat pajak (tax), biaya layanan (service charge), dan diskon yang harus dibagi secara proporsional.
- Ada lebih dari satu orang yang menalangi pembayaran struk yang berbeda di satu meja.
- Muncul selisih uang receh akibat pembulatan manual yang tidak seimbang.

PaTo menyelesaikan masalah ini dengan menyediakan sesi meja bersama (live room) yang dapat diakses oleh semua anggota meja hanya melalui tautan atau kode QR.

---

## Fitur Utama

- **Sinkronisasi Meja Real-Time**: Host membuka sesi meja dan peserta dapat langsung bergabung via kode QR atau tautan tanpa perlu registrasi rumit. Perubahan status item dan klaim langsung tersinkronisasi ke seluruh layar via WebSocket.
- **Pemindaian Struk Otomatis (AI OCR)**: Menggunakan Google Gemini API untuk mengekstrak daftar pesanan, kuantitas, harga satuan, subtotal, diskon, pajak, dan service charge secara otomatis dari foto struk belanja.
- **Multi-Struk dalam Satu Meja**: Mendukung penggabungan beberapa struk belanja sekaligus dalam satu sesi tagihan.
- **Multi-Payer (Banyak Pembayar)**: Mengakomodasi skenario di mana orang yang menalangi pembayaran berbeda untuk tiap struk.
- **Klaim Item Fleksibel**: Peserta dapat memilih item miliknya sendiri atau membagi satu porsi makanan dengan peserta lain (split claim).
- **Perhitungan Pajak, Service, dan Diskon Proporsional**: Beban pajak dan diskon dihitung adil berdasarkan proporsi belanja masing-masing partisipan.
- **Pembulatan Adil (Fair Rounding)**: Mencegah kekurangan total tagihan akibat pembulatan nominal ke ratusan atau ribuan terdekat tanpa merugikan pembayar utama.
- **Ringkasan Tagihan Personal & Bukti Pembayaran**: Setiap tamu mendapatkan rincian nominal yang harus dibayar, info rekening/QRIS tujuan, serta fitur upload bukti transfer untuk verifikasi host.
- **Progressive Web App (PWA)**: Tampilan dioptimalkan khusus untuk layar ponsel pintar dan dapat dipasang langsung ke layar utama (Add to Home Screen).

---

## Teknologi yang Digunakan

### Frontend
- **Framework**: React 19
- **Bundler & Tooling**: Vite, TypeScript
- **Styling**: Tailwind CSS v4
- **Routing**: React Router
- **Ikon**: Phosphor Icons (@phosphor-icons/react)
- **Kapabilitas**: Web Manifest (PWA), Web Share API, Canvas API

### Backend
- **Runtime**: Node.js 22 LTS
- **Server Framework**: Express (TypeScript)
- **Database**: PostgreSQL dengan driver `pg`
- **Realtime Engine**: WebSocket (`ws`) dengan arsitektur Room Hub
- **Validasi Data**: Zod
- **Autentikasi**: JSON Web Token (JWT) dan Google OAuth SDK
- **AI OCR**: Google Gemini 2.0 Flash REST API

### DevOps & Infrastruktur
- **Kontainerisasi**: Docker & Docker Compose (Multi-Stage Build)
- **Web Server & Reverse Proxy**: Nginx Alpine
- **Akses Jaringan**: Cloudflare Tunnel (Zero Trust)

---

## Struktur Monorepo

```
pato/
├── backend/
│   ├── sql/              # Skrip SQL skema dan migrasi database
│   ├── src/
│   │   ├── controllers/  # Handler endpoint API REST
│   │   ├── middleware/   # Middleware autentikasi dan rate limit
│   │   ├── routes/       # Definisi rute Express
│   │   ├── services/     # Logika bisnis (kalkulasi, OCR, room)
│   │   ├── utils/        # Utility JWT dan kode room
│   │   ├── db.ts         # Konfigurasi koneksi pool PostgreSQL
│   │   ├── index.ts      # Entrypoint server HTTP & WebSocket
│   │   └── websocket.ts  # Manajemen koneksi WebSocket per room
│   ├── Dockerfile
│   └── tsconfig.json
├── frontend/
│   ├── public/           # Aset statis, ikon PWA, dan webmanifest
│   ├── src/
│   │   ├── assets/       # Gambar, ilustrasi, dan logo
│   │   ├── components/   # Komponen UI modular
│   │   ├── pages/        # Halaman aplikasi (Home, Room, History, Profile)
│   │   ├── services/     # Klien API HTTP dan WebSocket
│   │   └── types/        # Definisi antarmuka TypeScript
│   ├── Dockerfile
│   ├── nginx.conf        # Konfigurasi reverse proxy Nginx untuk kontainer
│   └── vite.config.ts
├── deploy/
│   ├── nginx.conf        # Contoh konfigurasi Nginx untuk server mandiri
│   └── update.sh         # Skrip otomatisasi pull dan redeploy kontainer
├── docs/                 # Dokumentasi arsitektur dan spesifikasi sistem
├── docker-compose.yml    # Orkestrasi kontainer database, backend, dan frontend
├── package.json          # Root workspace configuration
└── README.md
```

---

## Prasyarat Sistem

Sebelum memulai instalasi di komputer lokal, pastikan Anda telah memasang:
- **Node.js**: Versi 20 atau 22 LTS
- **npm**: Versi 10 atau yang lebih baru
- **PostgreSQL**: Versi 15 atau 16 (bisa berjalan lokal atau via kontainer Docker)
- **Git**

---

## Instalasi dan Pengembangan Lokal

### 1. Kloning Repositori

```bash
git clone https://github.com/ryhndastra/pato.git
cd pato
```

### 2. Konfigurasi Environment Backend

Salin template konfigurasi lingkungan di direktori backend:

```bash
cp backend/.env.example backend/.env
```

Buka file `backend/.env` lalu lengkapi variabel berikut:

```ini
PORT=4000
DATABASE_URL=postgresql://username:password@localhost:5432/pato_db
FRONTEND_URL=http://localhost:5173
JWT_SECRET=rahasia_jwt_acak_untuk_pengembangan_lokal
GOOGLE_CLIENT_ID=client_id_google_anda.apps.googleusercontent.com
GEMINI_API_KEYS=kunci_api_gemini_dari_google_aistudio
CORS_ORIGIN=http://localhost:5173
```

### 3. Instalasi Dependensi

Pasang dependensi untuk seluruh workspace monorepo dari direktori utama:

```bash
npm install
```

### 4. Migrasi Database

Pastikan service PostgreSQL lokal Anda telah aktif dan database telah dibuat, kemudian jalankan migrasi skema tabel:

```bash
npm run migrate:backend
```

### 5. Menjalankan Server Pengembangan

Jalankan backend API dan frontend Vite secara bersamaan dalam dua tab terminal:

Terminal 1 (Backend):
```bash
npm run dev:backend
```
Backend akan berjalan di `http://localhost:4000`.

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```
Frontend akan berjalan di `http://localhost:5173`.

---

## Deployment dengan Docker

Proyek ini telah dilengkapi konfigurasi Docker Compose siap produksi dengan arsitektur 3 layanan:
1. `db_pato`: Database PostgreSQL 16 Alpine dengan persistent volume.
2. `backend_pato`: REST API & WebSocket server Node.js 22.
3. `web_pato`: Nginx Alpine yang menyajikan file statis React serta mem-proxy request `/api/` ke backend.

### 1. Konfigurasi File Lingkungan

Salin template file environment khusus Docker di root direktori:

```bash
cp .env.docker.example .env.docker
```

Sesuaikan nilai di dalam `.env.docker`:

```ini
APP_NAME=PaTo
APP_ENV=production
APP_PORT=8200
FRONTEND_URL=https://domain-anda.com

DB_USER=pato_user
DB_PASSWORD=buat_password_database_yang_kuat
DB_NAME=pato_db

JWT_SECRET=buat_string_acak_panjang_dengan_crypto
GOOGLE_CLIENT_ID=client_id_google_anda.apps.googleusercontent.com
CORS_ORIGIN=*
GEMINI_API_KEYS=kunci_api_gemini_1,kunci_api_gemini_2
```

### 2. Menjalankan Kontainer

Bangun image dan jalankan seluruh kontainer di latar belakang:

```bash
docker compose --env-file .env.docker up -d --build
```

Untuk memeriksa status kontainer:

```bash
docker compose ps
```

Untuk melihat log aplikasi:

```bash
docker compose logs -f backend_pato
```

### 3. Skrip Pembaruan Otomatis

Untuk memperbarui aplikasi di server produksi saat ada commit baru di branch utama:

```bash
chmod +x deploy/update.sh
./deploy/update.sh
```

Skrip ini akan mengambil kode terbaru dari Git, melakukan build ulang image, me-restart kontainer tanpa downtime lama, dan membersihkan image yang tidak terpakai.

---

## Referensi Variabel Lingkungan

| Variabel | Deskripsi | Default / Contoh |
| :--- | :--- | :--- |
| `APP_PORT` | Port host lokal yang dibuka kontainer web Nginx | `8200` |
| `FRONTEND_URL` | URL publik tempat aplikasi diakses | `https://pato.domain.com` |
| `DB_USER` | Username untuk autentikasi database PostgreSQL | `pato_user` |
| `DB_PASSWORD` | Password untuk akun PostgreSQL | *(Wajib diisi)* |
| `DB_NAME` | Nama database yang digunakan aplikasi | `pato_db` |
| `JWT_SECRET` | String acak enkripsi tanda tangan token sesi pengguna | *(Wajib diisi)* |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Google Cloud untuk fitur Login dengan Google | `xxx.apps.googleusercontent.com` |
| `GEMINI_API_KEYS` | Kunci API Google Gemini untuk ekstraksi OCR struk (bisa multi-key dipisah koma) | *(Wajib diisi jika memakai OCR)* |
| `CORS_ORIGIN` | Origin yang diizinkan untuk Cross-Origin Resource Sharing | `*` |

---

## Lisensi

Proyek ini didistribusikan untuk keperluan pengembangan dan penggunaan internal. Hak cipta dilindungi undang-undang.
