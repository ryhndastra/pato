# 🧾 F08: Shareable Esthetic Receipt & Multi-Theme Canvas Engine
**Dokumen Spesifikasi Fitur — PaTo (Pay Together)**

---

## 1. Ringkasan Fitur
Menghasilkan kartu struk digital berkualitas tinggi (*High-Resolution PNG*) yang estetik dan dapat diunduh atau dibagikan langsung ke Instagram Story / WhatsApp. Pengguna dapat memilih salah satu dari 4 tema visual sebelum mengunduh.

## 2. User Stories
* **User**: "Gue mau pamer struk split bill yang estetik dan rapi di Instagram Story atau grup WhatsApp, biar keliatan keren dan transparan siapa aja yang udah lunas."
* **PaTo (Branding)**: Menjadi alat viralitas organik di mana setiap gambar struk memuat watermark dan tautan unik room PaTo.

---

## 3. 4 Pilihan Tema Visual Struk

Pengguna disajikan selector tema radio/tab sebelum export:

### 3.1 🧾 Tema 1: Minimalist Thermal Receipt (Default)
* **Karakter**: Kertas struk fisik kafe modern warna putih gading.
* **Tipografi**: Font monospace hitam pekat (`Space Mono` / `Courier New`).
* **Elemen Visual**: Garis putus-putus (*dashed line*), efek tepi sobekan kertas bergerigi (*jagged edge*) di bagian atas dan bawah, barcode dekoratif, dan stempel hitam.

### 3.2 🌌 Tema 2: Midnight Cyber Blue (Signature PaTo)
* **Karakter**: Tampilan gelap futuristik fintech modern.
* **Latar**: Gradasi radial warna navy pekat (`#090e1a` ke `#0f172a`).
* **Aksen**: Glow biru neon khas brand (`#4477bb` dan `#7ca4d6`), frosted glassmorphism border transparan, dan font modern geometric sans.

### 3.3 📜 Tema 3: Vintage Retro Kraft
* **Karakter**: Kertas daur ulang cokelat hangat (*kraft paper texture*).
* **Tipografi**: Font mesin tik klasik (*American Typewriter*).
* **Elemen Visual**: Stempel merah tebal bertuliskan: `PAID IN FULL / LUNAS ✅` dengan rotasi miring 12 derajat.

### 3.4 🍬 Tema 4: Clean Pastel Gen-Z
* **Karakter**: Ceria, playful, dan cerah ala tren Y2K / Notion aesthetic.
* **Warna**: Latar cream latte lembut dengan aksen border rounded tebal warna periwinkle blue (`#7ca4d6`) dan sticker emoji lucu.

---

## 4. Struktur Anatomi Kartu Struk

```text
+------------------------------------------------------+
|                     P A T O                          |
|             ••• PAY TOGETHER RECEIPT •••             |
|                                                      |
| Restoran : Sushi Tei Senopati                        |
| Tanggal  : Jumat, 04 September 2026 • 21:40 WIB      |
| Host     : Fakhri (@fakhri)                          |
| ID Room  : #SUSHITEI-492                             |
| ---------------------------------------------------- |
| RINCIAN PATUNGAN:                                    |
| 👤 @kevin (2 item)  ....................  Rp  68.000 |
| 👤 @siti  (2 item)  ....................  Rp  52.000 |
| 👤 @budi  (3 item)  ....................  Rp  47.775 |
| 👤 @sho   (3 item)  ....................  Rp  47.775 |
| 👤 @fakhri(Host)    ....................  Rp  29.450 |
| ---------------------------------------------------- |
| SUBTOTAL MAKANAN    ....................  Rp 200.000 |
| PAJAK RESTO (PB1)   ....................  Rp  20.000 |
| SERVICE CHARGE      ....................  Rp  10.000 |
| DISKON PROMO        .................... -Rp  15.000 |
| ==================================================== |
| TOTAL TRANSAKSI     ....................  Rp 215.000 |
| STATUS              ....................  LUNAS 100% |
| ---------------------------------------------------- |
|        [ STEMPEL RESMI: VERIFIED BY PATO ✅ ]         |
|                                                      |
|       "Nongkrong happy, bayar adil, no drama."       |
|          Bikin split bill kamu di: pato.app          |
+------------------------------------------------------+
```

---

## 5. Implementasi Teknis (Client-Side Rendering)

1. **Teknologi**: Menggunakan library ringan seperti `html-to-image` atau HTML5 Canvas API murni.
2. **Device Pixel Ratio (DPR)**: Dirender dengan scale 2x / 3x (Retina Display Ready) agar teks tetap tajam saat di-zoom atau di-post ke Instagram Story (resolusi 1080x1920).
3. **Web Share API**:
   - Jika browser mendukung `navigator.share({ files: [blob] })`, tombol **"Share ke IG / WhatsApp"** langsung membuka sheet berbagi native HP.
   - Jika tidak didukung, otomatis memicu download file `pato-receipt-SUSHITEI-492.png`.
