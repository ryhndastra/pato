# 💳 F05: Payment Settlement, Verification, & Dispute
**Dokumen Spesifikasi Fitur — PaTo (Pay Together)**

---

## 1. Ringkasan Fitur
Menyediakan alur pembayaran yang minim friksi bagi member (fitur salin cepat, QRIS langsung scan dari galeri), unggah bukti transfer m-banking, serta dashboard verifikasi bagi Host yang dilengkapi alur penyelesaian sengketa (*dispute flow*).

## 2. User Stories
* **Guest**: "Gue mau transfer tanpa harus bolak-balik ngapalin 10 digit nomor rekening dan tanpa salah ketik nominal sampai ke rupiah terakhir."
* **Host**: "Gue mau bisa ngeliat foto bukti transfer temen gue, cross-check sama daftar makanannya, dan kalau dia salah transfer nominal kurang, gue bisa tolak sambil kasih catatan."

---

## 3. Komponen UX Pembayaran Member

### 3.1 1-Tap Quick Copy
* **Tombol Salin Nominal**: Menyalin angka bersih (contoh: `47775` bukan `Rp 47.775,-`) agar siap di-paste ke kolom nominal m-banking tanpa error input.
* **Tombol Salin Rekening**: Menyalin nomor rekening bank atau nomor HP e-wallet Host.
* **Feedback Visual**: Ikon berganti menjadi centang hijau `✅` dan teks *"Tersalin!"* selama 1.5 detik.

### 3.2 Zoomable & Downloadable QRIS
* Host mengunggah gambar QRIS statis (BCA, GoPay, Dana, OVO, dll).
* Di layar member:
  - Gambar QRIS dapat di-tap untuk perbesaran modal.
  - Tombol **"Simpan QRIS ke Galeri 📥"**: Mengunduh file QRIS ke galeri HP member, sehingga member bisa membuka m-banking dan memilih opsi *Bayar QRIS ➔ Buka dari Galeri*.

---

## 4. Alur Unggah Bukti Bayar & Status Transaksi

```text
[ BELUM BAYAR ] ──(Upload Screenshot)──► [ MENUNGGU VERIFIKASI ]
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
             [ VERIFIED / LUNAS ✅ ]                             [ DITOLAK / REVISI ❌ ]
            (Host klik Verifikasi)                              (Host input alasan)
                                                                          │
                                                                          ▼
                                                                (Member upload ulang)
```

1. **Upload Bukti**:
   - Member memilih file screenshot mutasi/struk m-banking.
   - File dikompresi ke WebP/JPEG di browser klien sebelum di-upload ke backend `/api/rooms/{code}/payment/proof`.
   - Status member berubah menjadi: `MENUNGGU VERIFIKASI ⏳`.

---

## 5. Host Control Dashboard & Dispute Flow

### 5.1 Detail Informasi Member di Layar Host
Host disajikan daftar lengkap setiap member:
* Nama member & Avatar.
* **Daftar Rinci Item yang Dikonsumsi**:
  - `• 1x Salmon Sashimi (Rp 35.000)`
  - `• 1x Ocha Dingin (Rp 10.000)`
  - `• 1/4 Edamame Shared (Rp 5.500)`
  - `• Pajak PB1 & Service Charge`
* **Total Tagihan**: `Rp 52.000`.
* **Thumbnail Bukti Transfer**: Dapat di-klik untuk melihat screenshot ukuran penuh.

### 5.2 Aksi Verifikasi atau Penolakan
* **Jika Sesuai**: Host menekan tombol **[ Verifikasi ✅ ]**.
  - Status member menjadi `LUNAS ✅`.
  - Sistem membroadcast notifikasi ke seluruh room via WebSocket.
* **Jika Salah / Kurang Nominal (Dispute)**:
  - Host menekan tombol **[ Tolak ❌ ]**.
  - Muncul dialog modal input alasan penolakan:
    `[ Alasan: "Nominal kurang Rp 10.000 bro" ]`
  - Host menekan konfirmasi.
  - Status member di room berubah menjadi: `PERLU UPLOAD ULANG ⚠️` disertai pesan dari Host.
  - Member dapat membaca alasan penolakan dan mengunggah screenshot bukti transfer perbaikan.
