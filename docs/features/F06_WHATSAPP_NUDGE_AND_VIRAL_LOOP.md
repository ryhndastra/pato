# 💬 F06: WhatsApp Nudge Generator & Organic Viral Loop
**Dokumen Spesifikasi Fitur — PaTo (Pay Together)**

---

## 1. Ringkasan Fitur
Menghilangkan kecanggungan sosial saat menagih uang patungan ke teman tongkrongan melalui generator pesan WhatsApp otomatis yang variatif, santai, dan cerdas, tanpa perlu menyimpan nomor HP pengguna di database aplikasi.

## 2. Masalah & Solusi
* **Masalah Sosial**: Banyak orang Indonesia (khususnya Gen-Z) merasa "gak enakan", sungkan, atau takut merusak pertemanan saat harus menagih utang makan.
* **Solusi PaTo**: Tombol 1-klik **"Nudge WA"** yang langsung memformat pesan WhatsApp lucu dan kasual, siap dikirim ke teman yang bersangkutan.

---

## 3. Mekanika Universal WhatsApp URL (Zero Phone Storage)

PaTo **tidak menyimpan nomor HP siapapun** untuk melindungi privasi user 100%.

### Cara Kerja URL:
```text
https://wa.me/?text={ENCODED_MESSAGE}
```
1. Host menekan tombol **"Nudge WA 💬"** di samping nama Kevin yang belum bayar.
2. Browser mengeksekusi URL `wa.me/?text=...` tanpa parameter nomor telepon.
3. Aplikasi WhatsApp di HP Host otomatis terbuka dan menampilkan layar pemilih kontak (*contact picker*).
4. Host tinggal memilih kontak "Kevin".
5. Draf pesan langsung terisi rapi di kolom chat WhatsApp, siap ditekan kirim!

---

## 4. Library Template Pesan (Shuffled Microcopy)

Host dapat memilih nuansa pesan atau membiarkan sistem me-random formatnya:

### 4.1 Template Santai / Friendly (Default)
> *"Halo [Nama]! Tadi seru banget nongkrong di [Nama Acara/Resto]. Biar pertemanan kita tetap estetik dan langgeng, bagian patungan kamu Rp [Nominal] ya ges yaa. Rincian & QRIS bisa langsung dicek di sini: [Link Room]"*

### 4.2 Template To The Point
> *"Bro/Sis [Nama], rekap tagihan [Nama Acara] udah beres nih Rp [Nominal]. QRIS & info rekening ada di link ini: [Link Room]. Tolong ditransfer kalau udah senggang yaa, thank you!"*

### 4.3 Template Roasting Akrab Tongkrongan
> *"Woy [Nama]! Jangan pura-pura mati suri pas tagihan keluar wkwk. Bagian lu Rp [Nominal] nih di [Nama Acara]. Kuy langsung beresin ke sini biar Host gak nangis di pojokan kasir: [Link Room]"*

---

## 5. Salin Rekap Teks ke Grup Chat (Group Broadcast)
Selain menagih perorangan, Host memiliki tombol **"Salin Rekap Grup 📋"** di dashboard:
```text
🧾 REKAP TAGIHAN PATO: Makan Sushi Tei
Total Resto: Rp 245.000 (Status: 4/5 Sudah Lunas)

1. @siti      : Rp 52.000 [LUNAS ✅]
2. @budi      : Rp 47.775 [LUNAS ✅]
3. @sho       : Rp 47.775 [LUNAS ✅]
4. @kevin     : Rp 68.000 [MENUNGGU TRANSFER ⏳]
5. @fakhri    : Rp 29.450 [HOST]

Kuy beresin transfernya ke QRIS/Rekening Fakhri di:
👉 https://pato.app/r/SUSHITEI-492
```

---

## 6. Efek Viralitas Organik (Growth Engine)
Setiap link room dan pesan rekap yang dibagikan ke grup WhatsApp kampus, kantor, atau komunitas menjadi media promosi gratis bagi PaTo. Teman-teman di dalam grup yang melihat betapa rapi dan mudahnya sistem ini akan terdorong menggunakan PaTo saat mereka menjadi Host di acara berikutnya.
