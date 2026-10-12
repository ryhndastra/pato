# 📱 02. Feature Specifications & Edge Cases
**PaTo (Pay Together) — Core Engine & Functional Specs**

---

## 1. Siklus Hidup Room (State Machine)

Room bergerak melalui 4 state utama yang ketat:

```text
[ DRAFT ] ──────────► [ CLAIMING ] ──────────► [ LOCKED ] ──────────► [ CLOSED ]
(Host Setup & OCR)   (Multiplayer Claim)    (Kalkulasi Terkunci &   (Selesai, Media
                                              Pembayaran Dibuka)     Auto-Purged)
                             ▲                      │
                             └────── [ UNLOCK ] ────┘
                                   (Host God-Mode)
```

| State | Aksi Host | Aksi Guest/Member | Catatan Sistem |
| :--- | :--- | :--- | :--- |
| **`DRAFT`** | Scan struk AI, edit item manual, pasang QRIS & No Rekening | Belum bisa masuk room | Validasi Subtotal + Tax = Total |
| **`CLAIMING`** | Membagikan link, monitor klaim, chat di room | Join via link tanpa login, pilih/tambah porsi item | Real-time WebSocket sync |
| **`LOCKED`** | Cek item sisa, klik "Bagi Rata Item Sisa", kunci tagihan | Nominal terkunci paten, lihat QRIS, upload bukti bayar | Kalkulasi proporsional dihitung |
| **`CLOSED`** | Verifikasi semua lunas, tutup grup | Mengunduh Struk Digital Estetik, simpan history | File gambar fisik dihapus dari disk |

---

## 2. Fitur Input Struk (Hybrid)

### 2.1 AI OCR Struk Kasir Restoran (Gemini Flash)
* **Toleransi Lokal**: Menangani nama menu singkatan resto Indonesia (*"Slmn Sashm"*, *"Ocha Dngn"*, *"Sp.Chckn"*), struk thermal kusut, miring, atau berbayang.
* **Auto-Categorize**: Membedakan mana baris makanan/minuman, mana Subtotal, Pajak Resto (PB1/PPN 10-11%), Service Charge (5-10%), dan Diskon Kasir.
* **Review Draft Stage**: Host disajikan daftar item sebelum link disebar untuk memastikan tidak ada kesalahan pembacaan angka.

### 2.2 Manual Fast-Tap Input
* Tombol cepat nambah item: Nama makanan + Harga + Tombol `[+] / [-]` quantity.
* Berguna jika struk hilang, sobek total, atau saat makan di tempat kaki lima/angkringan yang tidak ada struk kasir.

### 2.3 Single Source of Truth
* Foto struk asli wajib diunggah dan dapat dilihat oleh seluruh anggota room melalui tombol pop-up zoom gambar, menjamin transparansi 100%.

---

## 3. Fitur Klaim Multiplayer & Anti-Curang

### 3.1 Item Multi-Quantity Counter
* Jika ada `Ocha Dingin x 4 (Rp 40.000)`, item tidak dipecah jadi 4 baris panjang, melainkan tetap 1 baris ber-counter.
* Kevin tap `[+]` ➔ mengambil 1 gelas. Budi tap `[+]` 2x ➔ mengambil 2 gelas. Siti mengambil 1 gelas.
* Sistem menandai status item: `Lengkap (4/4)` berwarna hijau.

### 3.2 Multi-Claiming (Shared Plates / Makan Bareng)
* 1 porsi makanan (misal: 1 piring Salmon Roll Rp 35.000) bisa dicentang oleh lebih dari 1 orang jika dimakan bersama.
* Sistem otomatis membagi rata porsi harga item tersebut ke semua orang yang mencentangnya.

### 3.3 Penanganan Item Sisa (The Magic Unclaimed Button)
* Jika ada makanan yang belum diklaim saat Host hendak mengunci tagihan (misal: 1 piring kentang goreng Rp 25.000 yang dimakan bareng-bareng atau lupa diakuin):
* Host cukup menekan tombol: **"Bagi Rata Item Sisa ke Semua Orang"**. Sistem otomatis membagi rata biaya item tersebut ke seluruh member dalam 1 klik.

### 3.4 Host God-Mode & Lock Bill
* Host memiliki wewenang mengedit porsi jika ada anggota yang salah klaim.
* Tombol **"Kunci Tagihan"** membekukan klaim.
* Jika ada komplain setelah dikunci, Host dapat menekan **"Buka Kunci (Unlock)"**, memunculkan notifikasi peringatan kuning dan log perubahan di Activity Feed.

---

## 4. Algoritma Fair Math (Proporsional Presisi)

Pajak dan Service Charge dibebankan secara **proporsional terhadap nilai konsumsi makanan**, bukan dibagi rata ke semua kepala:

$$\text{Rasio Konsumsi Member}_i = \frac{\text{Subtotal Makanan Member}_i}{\text{Total Subtotal Makanan Seluruh Room}}$$

$$\text{Pajak Member}_i = \text{Total Pajak Resto} \times \text{Rasio Konsumsi Member}_i$$

$$\text{Service Member}_i = \text{Total Service Charge} \times \text{Rasio Konsumsi Member}_i$$

$$\text{Total Tagihan Member}_i = \text{Subtotal}_i + \text{Pajak}_i + \text{Service}_i - \text{Diskon Proporsional}_i$$

> **Contoh**: Jika Kevin makan Wagyu Rp 150.000 dan Siti hanya minum Teh Rp 15.000, Siti hanya membayar 10% dari pajak tehnya saja (~Rp 1.500), bukan menanggung pajak daging Kevin!

---

## 5. Settlement & Pembayaran Anti-Ribet

1. **1-Tap Copy Nominal**: Tombol salin nominal presisi rupiah tanpa teks tambahan (memudahkan paste di aplikasi m-banking).
2. **1-Tap Copy Rekening**: Tombol salin nomor rekening atau akun e-wallet Host.
3. **Zoomable & Downloadable QRIS**: Gambar QRIS Host dapat di-tap full screen dan ada tombol simpan ke galeri HP agar user bisa scan dari menu m-banking (*Scan from Gallery*).
4. **Upload Bukti Bayar**: Member mengunggah screenshot mutasi m-banking di room.
5. **Verifikasi Host & Dispute**:
   - Host dapat memilih **[Verifikasi ✅]** (status member jadi Lunas).
   - Atau memilih **[Tolak Bukti ❌]** dengan alasan singkat (misal: *"Kurang Rp 15.000 bro"*), status member berubah jadi *"Perlu Upload Ulang"*.

---

## 6. WhatsApp Nudge Generator (Tanpa Database Nomor HP)

* PaTo **tidak menyimpan nomor HP member** untuk menjaga privasi (Zero Data Leak).
* Saat Host menekan tombol **"Tagih via WhatsApp"** di samping nama member yang nunggak:
  - Browser mengeksekusi URL resmi: `https://wa.me/?text=[PESAN_TERFORMAT]`.
  - Aplikasi WhatsApp di HP Host langsung terbuka menampilkan kontak picker. Host tinggal tap nama teman yang dituju.
  - Pesan otomatis terisi lengkap dengan rincian makanan, nominal rupiah, dan link room PaTo.

---

## 7. Komitmen Sosial: Tipping & 20% Donasi Bencana

* Pada bagian bawah penyelesaian tagihan, terdapat tombol sukarela traktir pengembang (*"Beliin es kopi susu buat dev ☕ Rp 5.000"*).
* **Komitmen Sosial Transparan**: **20% dari setiap tip dialokasikan langsung untuk bantuan korban bencana alam dan aksi kemanusiaan**.
* Tersedia hyperlink ke halaman transparansi donasi: `https://pato.app/donasi` (menampilkan laporan penyaluran dan galeri dokumentasi).
