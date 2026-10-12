# 📘 PaTo (Pay Together) — Master Project Blueprint
> **Split Bill Anti-Pusing untuk Anak Nongkrong**  
> *Monorepo: React (PWA) + Golang Backend + PostgreSQL*

---

## 🎯 Ringkasan Eksekutif & Visi Produk
**PaTo** adalah aplikasi *social financial micro-tool* (SaaS Split Bill) yang dirancang untuk Gen-Z dan komunitas muda. PaTo menyelesaikan masalah klasik saat nongkrong/makan bareng (terutama kasus rumit seperti sushi per plate, diskon kombo/voucher, dan pajak resto PB1 + service charge) dengan prinsip:
1. **Zero-Friction**: Teman/Guest masuk ke room lewat link/QR WhatsApp **tanpa login dan tanpa install aplikasi**.
2. **Multiplayer Claiming**: Setiap orang mencentang sendiri makanan yang dimakan secara real-time di HP masing-masing.
3. **Fair Math Engine**: Pajak, service, dan diskon dihitung **proporsional presisi** berdasarkan konsumsi aktual, bukan sekadar dibagi rata.
4. **Single Source of Truth**: Foto struk kasir asli wajib ditampilkan di room agar Host tidak dicurigai manipulasi harga.
5. **Human & Alive**: UI hidup dengan **Dynamic Shuffled Microcopy** (bahasa santai/roasting akrab Gen-Z) + **Komitmen Sosial (20% tip dialokasikan untuk bantuan bencana)**.

---

## 📂 Struktur Monorepo Project

```text
/mnt/data/Projects/Web/React/pato/
├── BLUEPRINT.md                        # Master reference file (AI & Developer context)
├── docs/
│   ├── 01_SYSTEM_ARCHITECTURE.md       # Arsitektur sistem, deployment & integrasi
│   ├── 02_FEATURE_SPECIFICATIONS.md   # Rangkuman alur fitur utama
│   ├── 03_DESIGN_SYSTEM_AND_UI.md      # Token warna, komponen, wireframe & tema struk
│   ├── 04_DATABASE_SCHEMA_AND_MODELS.md# Skema PostgreSQL DDL & Struct Domain Golang
│   └── features/                       # DOKUMEN GRANULAR PER FITUR (LENGKAP):
│       ├── F01_ROOM_MANAGEMENT_AND_SESSION.md
│       ├── F02_RECEIPT_OCR_AND_MANUAL_INPUT.md
│       ├── F03_MULTIPLAYER_CLAIMING_AND_GODMODE.md
│       ├── F04_FAIR_MATH_ENGINE.md
│       ├── F05_PAYMENT_SETTLEMENT_AND_DISPUTE.md
│       ├── F06_WHATSAPP_NUDGE_AND_VIRAL_LOOP.md
│       ├── F07_LIVE_CHAT_AND_ACTIVITY_FEED.md
│       ├── F08_ESTHETIC_RECEIPT_CANVAS_EXPORT.md
│       ├── F09_SOCIAL_IMPACT_DONATION_AND_TIPS.md
│       └── F10_EPHEMERAL_STORAGE_AND_USER_CONVERSION.md
├── frontend/                           # React PWA (Vite + TypeScript + Tailwind/CSS)
└── backend/                            # Golang Backend (Echo/Chi + pgx/sqlx + WebSockets)
```

---

## 🧭 Panduan Cepat untuk AI / Developer Selanjutnya
Jika kamu membuka project ini dalam sesi chat baru:
1. **Frontend Stack**: React 18+ (Vite), TypeScript, Mobile-First PWA, Real-time WebSocket/SSE, LocalStorage Session.
2. **Backend Stack**: Golang 1.22+, PostgreSQL, WebSocket Room Hub, Google Gemini 2.0 Flash API (Free Tier OCR).
3. **Warna Brand**:
   - Primary: `#4477bb`
   - Secondary: `#7ca4d6`
   - Accent: `#ffffff`
   - Dark Slate Canvas: `#090e1a` & Surface: `#0f172a`
4. **Baca Dokumen Detail**: Rujuk folder `docs/` untuk implementasi kode teknis per bagian.
