# 🎨 03. Design System, Tokens, & Mobile Wireframes
**PaTo (Pay Together) — Visual Interface Architecture**

---

## 1. Palette & CSS Token Architecture

### 1.1 Brand Colors
* **Brand Primary**: `#4477bb` (Biru percaya diri, solid, modern fintech).
* **Brand Secondary**: `#7ca4d6` (Biru langit lembut untuk pill, glow, dan border aksen).
* **Accent Pure**: `#ffffff` (Putih bersih untuk kontras teks utama dan kartu).

### 1.2 CSS Variables (`index.css`)
```css
:root {
  /* Primitive Brand Blue */
  --pato-blue-50:  #f0f5fc;
  --pato-blue-100: #e2edfa;
  --pato-blue-200: #c5dbf5;
  --pato-blue-300: #9fc1ee;
  --pato-blue-400: #7ca4d6; /* Brand Secondary */
  --pato-blue-500: #5a8bd0;
  --pato-blue-600: #4477bb; /* Brand Primary */
  --pato-blue-700: #345c94;
  --pato-blue-800: #294773;
  --pato-blue-900: #1f3454;
  --pato-blue-950: #132034;

  /* Slate Neutrals */
  --pato-slate-900: #0f172a;
  --pato-slate-950: #090e1a; /* Deep Canvas Night */

  /* Status Semantics */
  --pato-emerald: #10b981; /* Lunas / Verified */
  --pato-amber:   #f59e0b; /* Pending / Locked */
  --pato-rose:    #f43f5e; /* Ditolak / Kurang */
  --pato-violet:  #8b5cf6; /* Gemini AI Magic Badge */
}

/* Dark Theme (Default Mobile Experience) */
[data-theme="dark"] {
  --color-bg-canvas: var(--pato-slate-950);
  --color-bg-surface: #0f172a;
  --color-bg-elevated: #1e293b;
  --color-border-subtle: rgba(148, 163, 184, 0.12);
  --color-border-active: rgba(124, 164, 214, 0.35);

  --color-text-primary: #ffffff;
  --color-text-secondary: #94a3b8;
  --color-brand-primary: var(--pato-blue-600);
  --color-brand-secondary: var(--pato-blue-400);
}
```

### 1.3 Tipografi
* **Font Utama**: `Plus Jakarta Sans` (Geometric Sans modern).
* **Font Angka / Struk**: `JetBrains Mono` / `Space Mono` (Rupiah rapi dan presisi).

---

## 2. Kontrak Komponen Inti

1. **`RoomHeader`**: Logo PaTo + Judul Acara + Status Tag (`LIVE`, `TERKUNCI`, `SELESAI`) + Tombol Share Room + Toggle Bahasa (ID/EN).
2. **`ItemClaimCard`**:
   - Nama makanan & harga per unit.
   - Badge kuantitas (misal `x4`).
   - Counter klaim porsi user (`[-] [ 2 ] [+]`).
   - Avatar bertumpuk teman yang ikut mengklaim item tersebut.
   - Indikator status: `Lengkap ✅`, `Sisa N Porsi ⚠️`, atau `Belum Diklaim`.
3. **`PaymentDock`**: Sticky bottom bar di layar HP yang menampilkan nominal tagihan real-time user dan tombol aksi kontekstual sesuai status room.
4. **`QuickCopyPill`**: Tombol salin 1-tap dengan animasi feedback *"Tersalin!"* 1.5 detik.

---

## 3. Wireframe Layar Mobile (ASCII)

### Layar 1: Multiplayer Claiming (Member View)
```text
+----------------------------------------------------+
| [PaTo]  Makan Sushi Tei Senopati        [Share Link]|
| Host: @fakhri  •  ● LIVE (5 Orang)       [🌐 ID/EN] |
+----------------------------------------------------+
| 📸 Struk Kasir Asli [Lihat Foto Struk (Zoom)]       |
| Status: Sisa 2 item belum ada yang ngaku!          |
+----------------------------------------------------+
| DAFTAR MENU (Tap [+] untuk ambil porsi kamu)        |
|                                                    |
| [🍣 Salmon Sashimi (x2)]               Rp 70.000   |
|   Milik: (👤 Kevin x1) (👤 Siti x1)                |
|   Porsi Kamu:  [-]  0  [+]                         |
|   Status: [ LENGKAP ✅ ]                           |
| -------------------------------------------------- |
| [🍣 Salmon Maki (x3)]                  Rp 90.000   |
|   Milik: (👤 Kamu x1) (👤 Budi x1)                 |
|   Porsi Kamu:  [-]  1  [+]                         |
|   Status: [ Sisa 1 Porsi ⚠️ ]                      |
| -------------------------------------------------- |
| [🍵 Ocha Dingin (x4)]                  Rp 40.000   |
|   Milik: (👤 Kamu x1) (👤 Siti x1) (👤 Budi x2)    |
|   Porsi Kamu:  [-]  1  [+]                         |
|   Status: [ LENGKAP ✅ ]                           |
+----------------------------------------------------+
| 💬 LIVE ACTIVITY & CHAT                            |
| 🤖 System: Kevin baru aja klaim Salmon Sashimi     |
| 💬 Budi: "Woy ocha sisa 1 siapa tuh?"              |
| [Ketik pesan di sini...                     ] [➤]  |
+----------------------------------------------------+
| [STICKY DOCK]                                      |
| Total Sementara Kamu: Rp 49.500 (Inc. Tax & Serv)  |
| [ Menunggu Host Kunci Tagihan ⏳ ]                  |
+----------------------------------------------------+
```

---

### Layar 2: Tagihan Terkunci & Pembayaran (Member View)
```text
+----------------------------------------------------+
| 🔒 TAGIHAN DIKUNCI OLEH HOST                       |
| "Kuy transfer biar Host gak tekor di kasir!"       |
+----------------------------------------------------+
| RINCIAN KAMU (@sho):                               |
| • 1x Salmon Maki                     Rp 30.000     |
| • 1x Ocha Dingin                     Rp 10.000     |
| • 1/4 Edamame (Bagi Rata)            Rp  5.500     |
| -------------------------------------------------- |
| Subtotal Makanan:                    Rp 45.500     |
| Pajak Resto (PB1 10% Proporsional):  Rp  4.550     |
| Service Charge (5% Proporsional):    Rp  2.275     |
| Diskon Promo (Diskon Kartu 10%):    -Rp  4.550     |
| ================================================== |
| TOTAL TRANSFER:           Rp 47.775 [📋 Salin Pas] |
+----------------------------------------------------+
| TUJUAN TRANSFER HOST (@fakhri):                    |
| [ QRIS GAMPANG ]                                   |
| +------------------------------------------------+ |
| |                  [ QRIS IMAGE ]                | |
| |               (Tap untuk Perbesar)             | |
| +------------------------------------------------+ |
| [ ⬇️ Simpan QRIS ke Galeri (Bisa Scan dari M-Banking) ] |
|                                                    |
| Atau Transfer Manual:                              |
| Bank BCA: 5410982711 a/n Fakhri    [📋 Salin Rek]  |
+----------------------------------------------------+
| STATUS KAMU: [ ⏳ Belum Upload Bukti ]              |
| [ 📸 Upload Screenshot Bukti Transfer M-Banking ]  |
+----------------------------------------------------+
```

---

### Layar 3: Host Dashboard & Verifikasi (Dengan Detail Item)
```text
+----------------------------------------------------+
| 👑 HOST CONTROL DASHBOARD                          |
| Total Tagihan: Rp 245.000 • Terkumpul: Rp 142.500   |
+----------------------------------------------------+
| MONITORING MEMBER (4/5 Sudah Bayar):               |
|                                                    |
| 1. Siti (Rp 52.000)                                |
|    📋 Item yang Diklaim:                           |
|       • 1x Salmon Sashimi (Rp 35.000)              |
|       • 1x Ocha Dingin (Rp 10.000)                 |
|       • + PB1 (10%) & Service (5%)                 |
|    [Lihat Bukti TF 🖼️]                              |
|    Action: [ Tolak ❌ ]   [ Verifikasi ✅ ]         |
| -------------------------------------------------- |
| 2. Budi (Rp 47.775)                                |
|    📋 Item yang Diklaim:                           |
|       • 1x Salmon Maki (Rp 30.000)                 |
|       • 2x Ocha Dingin (Rp 20.000)                 |
|       • 1/4 Edamame (Rp 5.500)                     |
|    Status: [ VERIFIED LUNAS ✅ ]                   |
| -------------------------------------------------- |
| 3. Kevin (Rp 68.000)                               |
|    📋 Item yang Diklaim:                           |
|       • 1x Salmon Sashimi (Rp 35.000)              |
|       • 1x Spicy Tuna Roll (Rp 25.000)             |
|    Status: [ Menunggu Transfer ⏳ ]                |
|    Action: [ 💬 Nudge WA (Kirim Teks Tagih) ]      |
+----------------------------------------------------+
| KONTROL ROOM:                                      |
| [ 🔓 Buka Kembali Kunci (Revisi Tagihan) ]         |
| [ 🏁 Tutup Grup & Hapus Media (Semua Lunas) ]      |
| [ 🧾 Unduh Struk Digital Estetik (PNG) ]           |
+----------------------------------------------------+
```

---

### Layar 4: Export Struk Estetik Digital (4 Pilihan Tema)
1. 🧾 **Theme A: Minimalist Thermal Receipt** (Kertas fisik putih, font monospaced hitam, sobekan gerigi & barcode).
2. 🌌 **Theme B: Midnight Cyber Blue (Signature PaTo)** (Latar navy `#090e1a`, gradasi glowing `#4477bb`, glassmorphism modern).
3. 📜 **Theme C: Vintage Retro Kraft** (Warna kertas cokelat kraft, font mesin tik antik, cap lunas merah).
4. 🍬 **Theme D: Clean Pastel Gen-Z** (Kombinasi periwinkle soft, border tebal rounded, emoji playful).

```text
+------------------------------------------+
| [ Pilihan Tema: (● Thermal) (○ Cyber) (○ Vintage) (○ Pastel) ]
|
| +--------------------------------------+ |
| |                 PaTo                 | |
| |      ••• PAY TOGETHER RECEIPT •••    | |
| | Resto    : Sushi Tei Senopati        | |
| | Tanggal  : 04 Sep 2026, 21:40 WIB    | |
| | Host     : @fakhri                   | |
| | ------------------------------------ | |
| | MEMBER BREAKDOWN:                    | |
| | @kevin (2 items) .......... Rp 68.000| |
| | @siti  (2 items) .......... Rp 52.000| |
| | @budi  (3 items) .......... Rp 47.775| |
| | @sho   (3 items) .......... Rp 47.775| |
| | @fakhri(1 item) ........... Rp 29.450| |
| | ------------------------------------ | |
| | TOTAL BILL RESTO:          Rp 245.000| |
| | STATUS:                    LUNAS 100%| |
| | [ STEMPEL: VERIFIED BY PATO ✅ ]     | |
| | ------------------------------------ | |
| | "Nongkrong happy, bayar adil, no drama." |
| | Split bill via: pato.app/r/sushi-tei | |
| +--------------------------------------+ |
| [ ⬇️ Unduh Gambar PNG ]  [ 📤 Share ke WhatsApp / IG ] |
+------------------------------------------+
```

---

## 4. Dynamic Shuffled Microcopy Library (Array Teks)

```javascript
export const MICROCOPY = {
  id: {
    billLockedBanners: [
      "Tagihan udah dikunci ya ges, kuy transfer biar Host gak tekor!",
      "Dompet kasir udah nangis, yuk beresin transferannya!",
      "Hitungan udah adil seadil-adilnya. Cek nominal kamu di bawah!",
      "Bayar kuy sebelum ditagih malaikat tongkrongan!"
    ],
    nudgeTemplates: {
      friendly: (name, resto, amount, link) => 
        `Halo ${name}! Tadi seru banget makan di ${resto}. Biar pertemanan kita tetap estetik, total patungan kamu Rp ${amount} ya ges yaa. Cek rincian & QRIS-nya di sini: ${link}`,
      direct: (name, resto, amount, link) => 
        `Bro/Sis ${name}, tagihan ${resto} udah keluar nih Rp ${amount}. QRIS & no rek ada di link ini: ${link}. Tolong ditransfer yaa thank you!`,
      roasting: (name, resto, amount, link) => 
        `Woy ${name}! Jangan pura-pura tidur pas tagihan keluar wkwk. Bagian lu Rp ${amount} nih di ${resto}. Langsung transfer ke sini ya: ${link}`
    },
    tippingImpact: [
      "Aplikasi ini bikin hidup lu gak pusing? Beliin es kopi susu buat dev ☕ (Rp 5.000). 20% tip kamu otomatis didonasikan untuk bantuan korban bencana alam.",
      "Traktir developer gorengan 🥟 biar server tetap ngebut. 20% disalurkan langsung ke posko bencana sesama."
    ]
  },
  en: {
    billLockedBanners: [
      "Bill is locked! Time to pay up so the Host doesn't cry.",
      "Fair math is ready. Check your exact share below!",
      "Keep friendships alive, pay your split on time!"
    ],
    nudgeTemplates: {
      friendly: (name, resto, amount, link) => 
        `Hey ${name}! Had a blast eating at ${resto}. To keep things smooth, your split is Rp ${amount}. View breakdown & QRIS here: ${link}`
    }
  }
};
```
