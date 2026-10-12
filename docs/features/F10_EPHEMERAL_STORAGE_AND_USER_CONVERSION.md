# 🛡️ F10: Ephemeral Storage Purge & Guest-to-Account Conversion
**Dokumen Spesifikasi Fitur — PaTo (Pay Together)**

---

## 1. Ringkasan Fitur
Mengamankan privasi finansial pengguna dan menghemat kapasitas storage server dengan menghapus file gambar berat (struk kasir dan screenshot mutasi bank) secara berkala, sekaligus memanfaatkan momen penutupan room sebagai saluran konversi organik bagi guest untuk mendaftar akun permanen (*Growth Loop*).

## 2. Masalah yang Diselesaikan
* **Storage Bloat**: Setiap room menghasilkan 1 foto struk + 1 foto QRIS + 5-10 foto bukti transfer (~15MB per room). Jika ada 1.000 room per bulan, disk server akan membesar tanpa batas.
* **Risiko Privasi Finansial**: Menyimpan screenshot m-banking orang lain selamanya di server rentan terhadap kebocoran data privasi.
* **Retensi Pengguna**: Guest yang masuk tanpa login tidak memiliki riwayat pengeluaran jika mereka berpindah browser.

---

## 3. Kebijakan Pembersihan Media (Ephemeral Purge)

### 3.1 Pemicu Pembersihan (Triggers)
1. **Manual Trigger (Host Tutup Grup)**:
   Saat semua anggota sudah lunas, Host menekan tombol **"Tutup Grup & Selesaikan Acara 🏁"**.
   - Sistem menandai status room menjadi `CLOSED`.
   - File fisik struk kasir dan seluruh screenshot bukti transfer langsung dihapus dari disk server.
2. **Automated Background Worker (Cron 7 Hari)**:
   - Worker Golang berjalan setiap tengah malam.
   - Mencari room yang berstatus `CLOSED` atau room yang tidak aktif selama lebih dari 7 hari.
   - Menghapus file fisik di folder `/storage/` dan mencatat timestamp `media_purged_at = NOW()`.

### 3.2 Data yang Tetap Tersimpan Selamanya (Historical Ledger)
Meskipun file fisik gambar dihapus, **data numerik dan rekap teks tetap aman tersimpan**:
* Nama acara, tanggal, dan nama resto.
* Daftar makanan dan harga.
* Siapa saja yang ikut dan nominal yang dibayar.
* Status bahwa transaksi tersebut sudah terverifikasi lunas.

---

## 4. Growth Hook: Konversi Guest ke Registered User

Setelah room selesai atau saat guest melihat nominal tagihannya, muncul penawaran konversi yang bernilai tinggi (*high-value call to action*):

```text
+-------------------------------------------------------------+
| 📊 Mau Simpan Riwayat Pengeluaran Nongkrong Kamu?           |
| "Biar akhir bulan gak kaget duit abis ke mana, simpan data  |
| patungan kamu hari ini ke akun PaTo kamu!"                  |
|                                                             |
| [ G  Lanjutkan dengan Google (1-Tap Cepat) ]               |
| Atau daftar dengan Email & Password                         |
+-------------------------------------------------------------+
```

### 4.1 Mekanisme Akun Google One-Tap
* Member tinggal men-tap akun Google mereka yang sudah tersimpan di browser HP.
* Sistem membuat record di tabel `users` dan mengaitkan seluruh riwayat `member.guest_token` ke `user.id` baru tersebut.
* Member kini memiliki dashboard pribadi:
  - Total pengeluaran nongkrong bulan ini.
  - Daftar acara yang pernah diikuti.
  - Daftar teman yang paling sering makan bareng.
