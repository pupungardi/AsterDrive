# Rencana Implementasi: Tampilan Status Sync & Pengelolaan File di Tab Computers

Rencana ini berfokus pada penyempurnaan tab **Computers** untuk menampilkan status sinkronisasi secara rinci, memberikan kontrol penuh terhadap file yang baru diunggah untuk pencadangan (*backup*), serta memastikan file dari komputer dapat dikelola secara optimal.

---

## 1. Analisis Kebutuhan
- Pengguna telah mengunggah 2 file untuk sync & backup dan ingin **melihat status sync serta mengelola file di tab Computers**.
- Saat ini file dengan sumber `source: 'computer'` tampil di tab Computers, namun:
  1. Jika pengguna mengunggah file melalui My Drive atau drag-and-drop umum, file tersebut perlu dapat diubah/dihubungkan statusnya menjadi file Sync & Backup (`source: 'computer'`).
  2. Kartu file dan baris tabel di tab Computers membutuhkan badge visual status sinkronisasi yang jelas (misal: *Synced*, *Last Synced Just Now*, ukuran, dan perangkat asal *This PC*).
  3. Diperlukan aksi interaktif di banner Computers: tombol **"Sync Now / Refresh Sync"** dengan animasi progres singkat untuk memverifikasi file telah aman tersinkron, tombol **Unduh Asli**, serta menu konteks untuk mengelola file (lihat info properti, buka preview, hapus sync).

---

## 2. Rincian Fitur & Modifikasi

### A. Indikator Status & Filter Komprehensif di Tab Computers
- **Banner Status Komputer:**
  - Menampilkan jumlah file yang tersinkron, total ukuran yang dibackup, dan waktu sync terakhir (misal: *All files synced & up-to-date*).
  - Menambahkan tombol interaktif **"Sync Now"** dengan status animasi putar (*spinner*) yang memberikan konfirmasi real-time bahwa file lokal dan cloud telah sinkron.
- **Badge Status pada Grid / List Item:**
  - Menampilkan badge hijau elegan `✓ Synced` pada setiap item file/folder yang berada di bawah sumber komputer.
  - Menampilkan nama perangkat asal (misal: `This PC / Windows` atau nama folder sync).

### B. Kemudahan Menghubungkan File ke Sync & Backup
- Menambahkan opsi di menu item (klik kanan / tombol aksi titik tiga) serta di panel info detail file: **"Add to Computer Sync & Backup"** atau **"Toggle Computer Sync"**.
  - Hal ini memudahkan jika 2 file yang baru diunggah masuk ke My Drive secara default, agar dapat langsung dialihkan/ditautkan ke tab Computers dengan 1 klik.

### C. Pengelolaan & Tindakan Cepat di Tab Computers
- **Download Asli Langsung:** Memastikan tombol unduh langsung mengambil blob biner riil dari IndexedDB.
- **Pratinjau File:** File video, gambar, atau dokumen dapat dibuka langsung dari tab Computers.
- **Hapus / Putus Sinkronisasi:** Opsi untuk melepas file dari sinkronisasi komputer tanpa merusak file di My Drive, atau menghapusnya jika diinginkan.

---

## 3. Langkah Verifikasi
1. **Linter:** Jalankan `lint_applet` untuk memastikan tidak ada kesalahan tipe TypeScript.
2. **Kompilasi:** Jalankan `compile_applet` untuk menjamin build Next.js sukses.
3. **Uji Fungsional:**
   - Masuk ke tab **Computers**: verifikasi file yang diunggah tampil dengan badge status `Synced` dan nama perangkat yang jelas.
   - Klik tombol **Sync Now** untuk memverifikasi feedback visual sinkronisasi real-time.
   - Lakukan klik pada file untuk melihat detail sinkronisasi di sidebar properties (Path, Device, Timestamp).
   - Unduh file untuk memastikan file biner asli terunduh dengan sempurna.
