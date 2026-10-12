# 🧮 F04: Fair-Math Engine (Kalkulasi Proporsional Presisi)
**Dokumen Spesifikasi Fitur — PaTo (Pay Together)**

---

## 1. Ringkasan Fitur
Mesin kalkulasi matematis inti di backend Golang yang membagi beban Pajak Restoran (PB1 10%), Service Charge (5-10%), dan Diskon/Voucher secara **proporsional berdasarkan konsumsi aktual**, bukan membaginya sama rata secara buta.

## 2. Masalah yang Diselesaikan
* **Ketidakadilan Split Bill Konvensional**:
  Budi memesan hidangan mahal seharga Rp 180.000, sedangkan Siti hanya memesan es teh Rp 15.000.
  Total pajak PB1 resto adalah Rp 19.500.
  Jika pajak dibagi rata berdua (Rp 9.750 per orang), Siti membayar pajak 65% dari harga tehnya sendiri! Ini adalah sumber ketidakpuasan nomor 1 Gen-Z saat patungan.

---

## 3. Rumus Matematis Proporsional

### 3.1 Rasio Konsumsi Individu ($R_i$)
Dihitung dari subtotal makanan yang dikonsumsi oleh member ke-$i$ terhadap total subtotal seluruh makanan di room:

$$R_i = \frac{\text{Subtotal}_i}{\sum_{k=1}^{n} \text{Subtotal}_k}$$

### 3.2 Alokasi Pajak & Service Charge
Beban pajak dan service charge dihitung proporsional terhadap rasio konsumsi:

$$\text{Tax}_i = \text{round}(\text{Total Pajak Resto} \times R_i)$$

$$\text{Service}_i = \text{round}(\text{Total Service Resto} \times R_i)$$

### 3.3 Alokasi Diskon & Promo
* **Diskon Global (Milik Bersama)**: Misal diskon promo kartu kredit 20%:
  $$\text{Discount}_i = \text{round}(\text{Total Diskon Global} \times R_i)$$
* **Diskon Pribadi (Voucher Spesifik)**: Misal Siti membawa voucher potongan Rp 20.000 untuk pesanannya sendiri. Diskon ini dibebankan 100% langsung ke total Siti tanpa mempengaruhi orang lain.

### 3.4 Grand Total Akhir per Member
$$\text{Grand Total}_i = \text{Subtotal}_i + \text{Tax}_i + \text{Service}_i - \text{Discount}_i$$

---

## 4. Test Vector & Contoh Kasus Nyata

**Struk Kasir Sushi Tei**:
* Subtotal Makanan: **Rp 200.000**
* Pajak PB1 (10%): **Rp 20.000**
* Service Charge (5%): **Rp 10.000**
* Diskon Promo Kasir: **-Rp 15.000**
* **Grand Total Struk**: **Rp 215.000**

**Daftar Konsumsi**:
* **Kevin**: Makan Wagyu & Ocha = Rp 120.000 ($R = 0.60$)
* **Siti**: Makan Roll & Air Mineral = Rp 50.000 ($R = 0.25$)
* **Budi**: Makan Edamame & Ocha = Rp 30.000 ($R = 0.15$)

**Hasil Kalkulasi Fair-Math**:
| Member | Subtotal | Tax (10%) | Service (5%) | Diskon Promo | **Grand Total** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kevin** | Rp 120.000 | Rp 12.000 | Rp 6.000 | -Rp 9.000 | **Rp 129.000** |
| **Siti** | Rp 50.000 | Rp 5.000 | Rp 2.500 | -Rp 3.750 | **Rp 53.750** |
| **Budi** | Rp 30.000 | Rp 3.000 | Rp 1.500 | -Rp 2.250 | **Rp 32.250** |
| **TOTAL** | **Rp 200.000** | **Rp 20.000** | **Rp 10.000** | **-Rp 15.000** | **Rp 215.000** |

> ✅ **Verifikasi**: $\text{Total Bayar Member} = 129.000 + 53.750 + 32.250 = \text{Rp } 215.000$ (Persis 100% balance dengan total struk kasir tanpa selisih 1 rupiah pun!).

---

## 5. Aturan Penanganan Selisih Pembulatan (Penny Rounding)
Dalam kasus pembulatan desimal menghasilkan selisih $\pm \text{Rp } 1$ terhadap total struk kasir fisik:
* Sistem mendeteksi selisih:
  $$\Delta = \text{Grand Total Struk} - \sum \text{Grand Total Member}$$
* Jika $\Delta \neq 0$, selisih $\Delta$ tersebut secara otomatis diserapkan ke pemesan dengan konsumsi terbesar (Host / pemesan tertinggi) atau dibebankan ke item sisa, sehingga total kasir selalu seimbang sempurna.
