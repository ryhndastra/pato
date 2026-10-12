# 🤝 F09: Social Impact (20% Donasi Bencana) & Tip Pengembang
**Dokumen Spesifikasi Fitur — PaTo (Pay Together)**

---

## 1. Ringkasan Fitur
Menyediakan fitur tip sukarela dari pengguna untuk mendukung operasional server, dengan komitmen sosial transparan: **20% dari setiap tip dialokasikan langsung untuk bantuan kemanusiaan dan korban bencana alam**. Dilengkapi dengan tautan ke halaman galeri transparansi donasi (`pato.app/donasi`).

## 2. Nilai & Filosofi Produk
Gen-Z memiliki kesadaran sosial (*social awareness*) yang sangat tinggi. Mereka enggan membayar biaya langganan SaaS yang kaku, tetapi mereka sangat rela memberikan apresiasi (*tipping*) jika aplikasi tersebut benar-benar mempermudah hidup mereka dan sebagian dananya disalurkan untuk menolong sesama yang tertimpa musibah.

---

## 3. Komponen Antarmuka Tipping

Di layar akhir setelah status member `LUNAS ✅`, muncul kartu apresiasi manis di bagian bawah:

```text
+-------------------------------------------------------------+
| ☕ Suka dengan PaTo? Traktir Developer Es Kopi Susu         |
| "Aplikasi ini bikin pertemanan lu bebas drama? Beliin es     |
| kopi susu buat dev (Rp 5.000) biar server tetap ngebut!"    |
|                                                             |
| 💙 Komitmen Sosial Kami:                                    |
| 20% dari tip kamu otomatis disalurkan untuk posko bencana   |
| alam & aksi kemanusiaan.                                    |
| [ 🔗 Lihat Bukti Transparansi & Galeri Donasi ]            |
|                                                             |
| [ ☕ Traktir Rp 5.000 ]   [ 🥟 Traktir Rp 10.000 ]   [ Custom ]
+-------------------------------------------------------------+
```

---

## 4. Alur Pembayaran Tip & Alokasi Donasi

1. User memilih nominal tip (Rp 5.000, Rp 10.000, atau nominal bebas).
2. Transaksi diproses melalui QRIS mikro cepat (Saweria, Trakteer, atau QRIS terintegrasi).
3. Backend mencatat mutasi ke tabel `tips`:
   - `amount`: Rp 10.000
   - `donation_amount`: Rp 2.000 (20% otomatis masuk ledger donasi)
   - `status`: `COMPLETED`
4. User menerima notifikasi: *"Terima kasih! Rp 2.000 dari tip kamu telah dialokasikan ke Kas Bantuan Bencana PaTo."*

---

## 5. Spesifikasi Landing Page Donasi (`/donasi`) — *Roadmap Next Dev*
Tautan `https://pato.app/donasi` mengarah ke halaman transparansi yang memuat:
1. **Counter Real-Time Dana Bencana**:
   - Total Dana Terkumpul dari Tip User (contoh: `Rp 4.250.000`).
   - Total Dana yang Sudah Disalurkan ke Lapangan (contoh: `Rp 3.500.000`).
2. **Galeri & Bukti Dokumentasi**:
   - Foto dokumentasi penyerahan bantuan ke posko banjir/gempa/relawan.
   - Kwitansi resmi penyaluran dan rincian logistik yang dibeli.
3. **Daftar Mitra Penyalur**: Kerjasama dengan organisasi relawan lokal terpercaya (misal: Kitabisa, PMI, atau relawan tanggap darurat independen).
