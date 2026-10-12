# 👥 F03: Interactive Multiplayer Claiming & Host God-Mode
**Dokumen Spesifikasi Fitur — PaTo (Pay Together)**

---

## 1. Ringkasan Fitur
Inti dari pengalaman PaTo: antarmuka klaim real-time di mana setiap orang di meja makan mencentang makanannya sendiri, mendukung pembagian porsi bersama (*shared plates*), serta dilengkapi fitur "God-Mode" bagi Host untuk menyelesaikan perselisihan atau item yang tidak diakui.

## 2. User Stories
* **Guest**: "Gue cuma makan 1 potong sushi dari piring temen gue, gue mau bisa patungan 50:50 buat piring itu tanpa bikin orang lain pusing ngitungnya."
* **Host**: "Pas mau bayar ada 1 piring kentang goreng sisa yang gak ada yang ngaku. Gue mau ada tombol 1-klik yang langsung ngebagi rata kentang itu ke semua orang tanpa gue harus nanya-nanya lagi."

---

## 3. Spesifikasi Komponen Klaim

### 3.1 Multi-Quantity Counter `[ - ] [ Qty ] [ + ]`
* Jika struk memiliki `Ocha Dingin x 4`:
  - Baris item menampilkan: `Ocha Dingin (x4) • Rp 10.000 / porsi`.
  - User A menekan `[+]` ➔ status user A: `1 porsi`.
  - User B menekan `[+]` 2 kali ➔ status user B: `2 porsi`.
  - Kuota tersisa berkurang menjadi `1 porsi lagi`.
  - Begitu total klaim mencapai 4/4, tombol `[+]` di-disable dan muncul badge hijau `LENGKAP ✅`.

### 3.2 Multi-Claiming (Shared Plate / Patungan Bareng)
* Untuk makanan yang kuantitasnya 1 (misal `1x Salmon Maki Rp 30.000`), tetapi dimakan bersama oleh Kevin dan Siti:
  - Kevin klik **[👥 Patungan Bareng]** di item tersebut.
  - Siti juga mengklik tombol yang sama di HP-nya.
  - Sistem mencatat porsi masing-masing:
    $$\text{Porsi Kevin} = 0.5, \quad \text{Porsi Siti} = 0.5$$
    $$\text{Nominal Kevin} = \text{Rp } 15.000, \quad \text{Nominal Siti} = \text{Rp } 15.000$$
  - Avatar kecil Kevin dan Siti muncul berdampingan di bawah kartu makanan.

### 3.3 Indikator Status Item
Setiap kartu menu memiliki 3 status visual:
1. 🟢 **Lengkap (Claimed 100%)**: Seluruh kuantitas item sudah habis ter-assign.
2. 🟡 **Parsial (Partially Claimed)**: Baru sebagian kuantitas yang diklaim (misal 2 dari 4 Ocha).
3. 🔴 **Belum Diklaim (Unclaimed)**: Belum ada satu pun member yang mengambil makanan ini.

---

## 4. Host God-Mode & The "Unclaimed Item" Magic Button

### 4.1 Tombol Magic "Bagi Rata Item Sisa"
* Sebelum Host dapat mengunci tagihan, sistem mendeteksi apakah ada item yang belum diklaim atau kuantitasnya bersisa.
* Muncul card alert di dashboard Host:
  > *"Ada 2 item senilai Rp 32.000 yang belum diklaim sepenuhnya."*
* Host memiliki 2 opsi:
  1. *Manual Assign*: Host memilih nama member untuk membebankan item tersebut.
  2. *Bagi Rata (Magic Button)*: Host menekan tombol **"Bagi Rata Item Sisa ke Semua Orang"**. Sistem otomatis membuat record klaim porsi pecahan rata ke seluruh member aktif yang ada di room.

### 4.2 Kunci Tagihan (Lock Bill)
* Host menekan tombol **"Kunci Tagihan 🔒"**.
* Event WebSocket `BILL_LOCKED` dibroadcast ke seluruh klien.
* Layar seluruh member otomatis bertransisi dari *Claiming Mode* ke *Payment Mode* (rincian terkunci, QRIS dan tombol transfer tampil).

### 4.3 Buka Kunci Tagihan (Unlock Bill)
* Jika ada member yang komplain salah klaim setelah tagihan dikunci:
* Host dapat mengklik tombol **"Buka Kembali Tagihan 🔓"**.
* Konsekuensi: Sistem memunculkan banner peringatan kuning di semua layar:
  > *"Tagihan dibuka kembali oleh Host. Perubahan klaim sedang dilakukan."*
* Log aktivitas mencatat aksi unlock ini di linimasa chat room.
