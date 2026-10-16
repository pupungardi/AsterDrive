# Rencana Implementasi: Penggunaan Data Riil & Pembersihan Simulasi

Menghapus seluruh file contoh dummy, tombol simulasi, dan file uji coba (*test file*). Mengimplementasikan sistem penyimpanan data riil berbasis **IndexedDB** untuk file biner asli (dokumen, video, audio, gambar, arsip) dan **LocalStorage** untuk metadata struktur drive, sehingga AsterDrive beroperasi dengan data pengguna yang sebenarnya dan persisten.

---

## 1. Analisis Kebutuhan
- **Pembersihan Dummy & Simulasi:**
  - Kosongkan `initialData` menjadi array kosong (`[]`) sehingga penyimpanan awal berstatus murni 0 B / 1 GB.
  - Hapus tombol "Simulate Testing" (`+ 400 MB Assets`, `+ 800 MB Video`) pada floating menu upload.
  - Hapus tombol `+ 400 MB Test File` pada tampilan drive kosong (*empty state*).
  - Hapus fungsi pembantu `handleAddSimulatedFile`.
- **Penyimpanan File Riil Persisten (IndexedDB & LocalStorage):**
  - **IndexedDB (`asterdrive_db`):** Menyimpan konten biner file (`File` / `Blob`) yang diunggah pengguna tanpa batasan kuota sempit LocalStorage.
  - **LocalStorage (`asterdrive_items`):** Menyimpan metadata file & folder (`id`, `name`, `type`, `size`, `parentId`, `updatedAt`, `starred`, `trashed`).
  - **Pratinjau & Unduh File Asli:**
    - Saat file video diputar, buat ObjectURL langsung dari blob asli di IndexedDB.
    - Saat file diunduh, buat file download langsung dari konten asli yang diunggah pengguna.
    - Saat file dihapus permanen, hapus pula blob dari IndexedDB untuk membebaskan ruang penyimpanan.

---

## 2. Rincian Teknis Implementasi

### A. Modul Utilitas IndexedDB (`lib/db.ts`)
- Membuat helper promise-based untuk IndexedDB:
  - `saveFileBlob(id: string, file: File | Blob): Promise<void>`
  - `getFileBlob(id: string): Promise<Blob | null>`
  - `deleteFileBlob(id: string): Promise<void>`
  - `clearAllFileBlobs(): Promise<void>`

### B. Pembersihan & Integrasi di `app/page.tsx`
1. **Inisialisasi Data Riil:**
   - Ubah `initialData` menjadi `[]`.
   - Gunakan `useEffect` untuk memuat metadata dari `localStorage` saat klien aktif.
   - Sinkronkan setiap perubahan item (tambah file, buat folder, rename, trash, hapus permanen) ke `localStorage`.
2. **Penyimpanan Upload Riil:**
   - Pada `handleFileUpload` dan `handleWindowDrop`, simpan setiap file biner yang diunggah ke IndexedDB melalui `saveFileBlob`.
3. **Pemutar Video & Unduhan Riil:**
   - Pada `openVideoPreview`: Muat blob asli dari IndexedDB, generate ObjectURL, dan setel ke elemen `<video>`.
   - Pada `handleDownloadItem`: Muat blob asli dari IndexedDB dan picu proses unduhan browser langsung dengan nama file asli.
4. **Pembersihan UI Simulasi:**
   - Hapus sub-menu simulasi di floating action menu (`+`).
   - Ubah teks *empty state* agar mengajak pengguna mengunggah file riil atau menyeret (*drag-and-drop*) folder asli dari komputer mereka.

---

## 3. Langkah Verifikasi
1. **Pemeriksaan Kode & Linter:**
   - Jalankan `lint_applet` untuk memastikan tidak ada kesalahan TypeScript atau aturan React Hooks.
2. **Uji Kompilasi:**
   - Jalankan `compile_applet` guna memverifikasi build aplikasi sukses.
3. **Uji Fungsionalitas:**
   - Verifikasi drive mulai dari kondisi kosong (0 B terpakai).
   - Unggah file nyata (misalnya gambar, dokumen, atau video MP4) melalui tombol upload atau drag-and-drop.
   - Verifikasi bahwa file tersimpan secara persisten setelah halaman di-refresh.
   - Putar video asli dan unduh kembali file asli untuk memastikan integritas data.
