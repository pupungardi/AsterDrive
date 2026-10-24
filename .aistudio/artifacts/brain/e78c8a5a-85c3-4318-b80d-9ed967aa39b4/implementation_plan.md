# Rencana Implementasi: Perbaikan Public Share Link & Sinkronisasi Folder Komputer

Berdasarkan jawaban Anda, kami merancang dua perbaikan utama:
1. **Public Share Link & Modal Dialog Berbagi:** Mengganti tautan `localhost` dengan URL publik Cloud Run (`https://ais-pre-owradbeu2qux37froeiwcs-7606689415.asia-southeast1.run.app`), serta menghadirkan **Modal Dialog Share Link** lengkap dengan opsi salin tautan dan izin akses.
2. **Sinkronisasi Folder Komputer Otomatis:** Memperbaiki sistem upload folder agar secara otomatis membuat entitas folder asli (`type: 'folder'`, `source: 'computer'`), menyusun file di dalam foldernya, dan mendukung dialog pembuatan folder sync interaktif.

---

## 1. Rincian Fitur & Modifikasi

### A. Fitur Public Share Link & Modal Dialog Berbagi
- **Deteksi URL Publik:**
  - Menghindari penggunaan `http://localhost:3000` di dalam iframe.
  - Menggunakan URL publik Cloud Run: `https://ais-pre-owradbeu2qux37froeiwcs-7606689415.asia-southeast1.run.app/share/[fileId]`.
- **Modal Dialog Share Interaktif:**
  - Saat menekan tombol **Share Link** (dari menu titik tiga, panel detail, atau pemutar video), aplikasi akan membuka popup modal yang elegan:
    - Menampilkan preview file (nama, ikon, ukuran).
    - Menampilkan kotak input URL publik siap salin.
    - Tombol **"Copy Link"** dengan status feedback (*Copied!*).
    - Tombol **"Share via Apps"** menggunakan *Web Share API* bawaan peramban (WhatsApp, Telegram, Email, dll).
    - Status privasi: *"Anyone with this public link can view & download"*.

### B. Fitur Sinkronisasi Folder Komputer Otomatis
- **Perbaikan `handleComputerUpload`:**
  - Saat pengguna memilih folder melalui pemilih folder (`webkitdirectory`), sistem akan:
    1. Mengekstrak nama folder utama dan subfolder dari `webkitRelativePath`.
    2. Membuat entitas folder nyata (`type: 'folder'`, `source: 'computer'`, `computerDevice: 'This PC'`) di dalam state `driveItems` dan menyimpannya di `localStorage`.
    3. Menyimpan file-file di dalam folder tersebut (`parentId: folderId`).
    4. Menyimpan data biner asli setiap file ke dalam IndexedDB.
- **Dialog Interaktif "Sync Folder":**
  - Memberikan opsi dialog pembuatan folder sinkronisasi:
    - Pilih folder lokal dari komputer via folder browser picker.
    - Opsi cepat: Buat nama folder sinkronisasi baru (misal: `Dokumen Kerja`, `Photos Backup`, `Project Files`) lalu langsung pilih berkas untuk dimasukkan ke dalamnya.
- **Dukungan Drag-and-Drop Folder:**
  - Menyeret folder langsung ke tab Computers akan otomatis membentuk folder dan file yang tersinkronisasi.

---

## 2. Langkah-Langkah Verifikasi
1. **Linter & Tipe:** Jalankan `lint_applet` untuk memastikan seluruh tipe data TypeScript valid.
2. **Uji Kompilasi:** Jalankan `compile_applet` untuk memverifikasi proses build Next.js sukses.
3. **Uji Fungsional Share Link:**
   - Klik tombol **Share Link** pada file apa pun.
   - Pastikan modal share terbuka dan tautan yang dihasilkan menggunakan URL publik Cloud Run (bukan localhost).
   - Uji tombol **Copy Link** untuk memastikan tautan tersalin dengan benar ke clipboard.
4. **Uji Fungsional Sync Folder:**
   - Klik **Sync Folder** di tab Computers dan pilih folder dari PC.
   - Verifikasi folder muncul sebagai folder asli dengan ikon folder dan badge `✓ Synced`.
   - Buka folder tersebut dan pastikan file-file di dalamnya tersimpan dan dapat diunduh/dilihat.
