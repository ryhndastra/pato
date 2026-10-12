# 💬 F07: Live Activity Feed & Hybrid In-Room Chat
**Dokumen Spesifikasi Fitur — PaTo (Pay Together)**

---

## 1. Ringkasan Fitur
Menggabungkan kolom obrolan santai antar-teman dengan linimasa peristiwa otomatis (*system activity feed*) yang disinkronkan secara instan via WebSocket, memberikan atmosfer interaktif (*multiplayer game vibes*) di dalam room.

## 2. User Stories
* **Guest**: "Gue mau nanya di room siapa yang makan piring salmon terakhir tanpa harus bolak-balik buka WhatsApp."
* **Host**: "Gue mau tau secara live detik itu juga pas ada temen gue yang nge-claim makanan atau pas ada yang baru aja upload bukti transfer."

---

## 3. Desain Komponen Hybrid Chat & Activity

Kolom linimasa di bawah daftar menu menyatukan dua jenis pesan:

```text
+-------------------------------------------------------------+
| 💬 LIVE ROOM CHAT & AKTIVITAS                               |
|-------------------------------------------------------------|
| 🤖 [SYSTEM] 21:15  Kevin bergabung ke room                 |
| 🤖 [SYSTEM] 21:16  Kevin mengklaim 1x Salmon Sashimi        |
| 💬 [BUDI]   21:17  "Woy itu Ocha 1 lagi punya siapa ya?"    |
| 💬 [SITI]   21:18  "Punya gue Bud, bentar gue klik"         |
| 🤖 [SYSTEM] 21:18  Siti mengklaim 1x Ocha Dingin            |
| 🤖 [SYSTEM] 21:22  Host mengunci tagihan 🔒                 |
| 🤖 [SYSTEM] 21:25  Budi mengunggah bukti transfer 📸        |
| 🤖 [SYSTEM] 21:26  Host memverifikasi pembayaran Budi ✅    |
+-------------------------------------------------------------+
| [ Ketik pesan obrolan...                            ] [ ➤ ] |
+-------------------------------------------------------------+
```

---

## 4. Spesifikasi Event WebSocket

### 4.1 Koneksi
* **URL**: `wss://api.pato.app/ws/rooms/{room_code}?token={guest_token}`
* **Format**: JSON Message Payload.

### 4.2 Skema Message Payload
```json
{
  "event_type": "CLAIM_ITEM",
  "room_code": "SUSHITEI-492",
  "sender_type": "SYSTEM",
  "member_id": "uuid-member-kevin",
  "display_name": "Kevin",
  "payload": {
    "item_id": "uuid-item-salmon",
    "item_name": "Salmon Sashimi",
    "portion_quantity": 1.0,
    "unit_price": 35000
  },
  "timestamp": "2026-09-04T21:16:00Z"
}
```

### 4.3 Tipe Event yang Didukung:
1. `USER_JOINED`: Member baru memasuki room.
2. `CLAIM_ITEM`: Member menambah/mengurangi porsi makanan.
3. `AUTO_SPLIT_REMAINING`: Host membagi rata item sisa.
4. `BILL_LOCKED`: Tagihan dikunci, beralih ke mode pembayaran.
5. `BILL_UNLOCKED`: Tagihan dibuka kembali oleh Host.
6. `PROOF_UPLOADED`: Member mengunggah screenshot bukti transfer.
7. `PAYMENT_VERIFIED`: Host memverifikasi pembayaran salah satu member.
8. `PAYMENT_REJECTED`: Bukti transfer ditolak oleh Host.
9. `CHAT_MESSAGE`: Pesan obrolan teks bebas yang diketik oleh member.
10. `ROOM_CLOSED`: Room ditutup permanen.

---

## 5. Indikator Presensi Online (Active Pulse)
* Header room menampilkan indikator jumlah anggota yang sedang membuka room saat ini:
  `● LIVE (4 Orang Online di Meja)`
* Backend mengelola *heartbeat ping/pong* tiap 30 detik untuk mendeteksi user yang aktif membuka halaman.
