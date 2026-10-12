# 📋 F01: Room Management & Guest Session
**Dokumen Spesifikasi Fitur — PaTo (Pay Together)**

---

## 1. Ringkasan Fitur
Mengatur siklus hidup room dari pembuatan, pembagian link, manajemen sesi guest tanpa login, hingga penutupan room.

## 2. User Stories & Persona
* **Host**: "Sebagai ketua acara, gue mau bikin room patungan dengan cepat, dapet kode room/link unik, dan bisa ngatur siapa aja yang gabung tanpa ribet verifikasi akun."
* **Guest**: "Sebagai teman di meja makan, gue mau langsung masuk room cuma dengan klik link WhatsApp dan ketik nama panggilan gue tanpa disuruh download app atau bikin password."

---

## 3. Siklus State Machine Room
Room memiliki 4 status:
1. `DRAFT`:
   - Host baru membuat room, memasukkan daftar menu/struk kasir, mengatur pajak dan rekening pembayaran.
   - Room belum dapat diakses oleh guest (link mengarah ke halaman waiting/draft notice jika dibuka selain oleh host).
2. `CLAIMING` (Live):
   - Host membagikan link room.
   - Status live indicator aktif (dot hijau berkedip).
   - Guest dapat masuk, memilih porsi makanan, dan berinteraksi secara real-time.
3. `LOCKED`:
   - Host mengunci tagihan. Klaim makanan dibekukan (read-only).
   - Angka nominal final per orang keluar (termasuk pajak proporsional).
   - Rekening dan QRIS host tampil, guest mulai mengunggah bukti bayar.
4. `CLOSED`:
   - Semua pembayaran selesai diverifikasi oleh Host.
   - Room ditutup secara permanen. Media foto struk dan bukti bayar masuk antrean purge untuk dihapus dari disk.

---

## 4. Mekanika Sesi Guest Tanpa Login
1. **Penyimpanan Token**:
   - Saat guest membuka link `https://pato.app/r/{room_code}`, sistem mengecek `localStorage.getItem("pato_guest_token")`.
   - Jika belum ada, sistem meng-generate UUID v4 token acak dan menyimpannya di browser HP user.
2. **Identitas**:
   - Guest diminta menginput `display_name` (nama panggilan, misal: "Kevin").
   - Token dan nama dikirim ke backend endpoint `POST /api/rooms/{code}/join`.
3. **Persistensi**:
   - Jika tab browser tertutup atau HP mati, saat guest membuka kembali link dari WhatsApp, sistem mengenali `guest_token` dan otomatis memulihkan sesi Kevin tanpa tanya nama ulang.

---

## 5. Spesifikasi API Endpoint

### 5.1 Create Room
* **Endpoint**: `POST /api/rooms`
* **Request**:
  ```json
  {
    "title": "Makan Sushi Tei Senopati",
    "host_name": "Fakhri",
    "bank_name": "BCA",
    "bank_account_no": "5410982711",
    "bank_account_name": "Fakhri Alamsyah"
  }
  ```
* **Response**:
  ```json
  {
    "room_code": "SUSHITEI-492",
    "status": "DRAFT",
    "host_token": "uuid-v4-secret-token",
    "share_url": "https://pato.app/r/SUSHITEI-492"
  }
  ```

### 5.2 Join Room
* **Endpoint**: `POST /api/rooms/{code}/join`
* **Request**:
  ```json
  {
    "guest_token": "uuid-v4-client-token",
    "display_name": "Kevin"
  }
  ```
* **Response**:
  ```json
  {
    "member_id": "uuid-member",
    "display_name": "Kevin",
    "is_host": false,
    "room_status": "CLAIMING"
  }
  ```

### 5.3 Lock & Unlock Room
* **Endpoint**: `POST /api/rooms/{code}/lock` (Hanya Host)
* **Endpoint**: `POST /api/rooms/{code}/unlock` (Hanya Host)

---

## 6. Edge Cases & Validasi
* **Nama Kembar di Room**: Jika ada dua orang bernama "Budi", sistem otomatis menambahkan angka identifikasi: `Budi (1)` dan `Budi (2)` atau meminta inisial nama belakang.
* **Host Berganti Device**: Host memiliki `host_token` unik di URL / localStorage. Jika Host ganti HP, Host bisa login via akun atau memasukkan PIN 4-digit yang dibuat saat room dibuat.
