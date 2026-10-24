# Rencana Implementasi: Perubahan Desain Dark Theme & Aksen Oranye AsterDrive

Berdasarkan screenshot referensi yang Anda berikan dan jawaban klarifikasi, kami akan memperbarui desain AsterDrive menjadi tema gelap premium (*dark mode*) dengan aksen oranye cerah (*warm orange* `#f97316` / `#ea580c`), menata ulang menu sidebar dengan bagian **WORKSPACE**, serta membuat halaman khusus untuk **Storage** dan **Activity**.

---

## 1. Skema Warna & Tema Global (*Dark Obsidian + Orange Accent*)
- **Background Utama**: Warna gelap elegan (`bg-[#0c0e14]` / `#11141c`) untuk nuansa modern, bersih, dan kontras tinggi.
- **Card & Surface**: Panel gelap bertingkat (`bg-[#161a23]`, `bg-[#1c2230]`, border `#2a3245`).
- **Aksen Oranye**:
  - Tombol aksi utama (*Call to Action*): `bg-orange-600 hover:bg-orange-500 text-white font-medium shadow-md shadow-orange-600/20`.
  - Status aktif menu navigasi: latar gelap dengan border oranye dan teks oranye cerah (`bg-orange-950/30 border-orange-500/30 text-orange-400`).
  - Badge kategori: teks oranye dengan badge minimalis seperti pada screenshot referensi.
  - Ikon dan highlight pilihan file/folder: aksen oranye dan ring fokus.

---

## 2. Struktur Navigasi Sidebar Baru
Sesuai preferensi Anda untuk menggabungkan menu screenshot dan fitur Sync Computers:
- **Header**: Logo AsterDrive dengan ikon awan/drive bernuansa oranye gelap.
- **Menu Utama**:
  - `My Drive` (Ikon Hard Drive / Home, aktif secara default)
  - `Computers` (Ikon Laptop/PC untuk fitur Sync & Backup folder lokal)
  - `Shared with me` (Ikon Users)
  - `Recent` (Ikon Clock)
  - `Starred` (Ikon Star)
- **Bagian WORKSPACE** (sesuai Screenshot 1):
  - `Storage` (Membuka tampilan ringkasan kapasitas & paket penyimpanan)
  - `Activity` (Membuka riwayat aktivitas berkas dan sinkronisasi)
  - `People` (Manajemen kolaborator & akses bersama)
  - `Trash` (Tempat sampah berkas terhapus)
  - `Security` (Keamanan akun & enkripsi)
  - `Feedback` (Kritik & saran pengguna)
- **Footer Sidebar**:
  - Tautan reguler: `About us`, `Help center`, `Privacy`, `Terms`.
  - Mini widget kuota penyimpanan oranye.

---

## 3. Tampilan Halaman Khusus

### A. Halaman Storage (Sesuai Screenshot 2)
- Label kategori oranye kecil: **Storage**.
- Judul besar: **Storage** dengan subjudul *"Everything you're working on, in one place."*
- Card utama **Storage overview**:
  - Ikon drive/vault dengan lingkaran aksen oranye.
  - Teks kapasitas total terpakai (contoh: `0 GB` atau ukuran dinamis file riil yang tersimpan).
  - Keterangan status file tersimpan.
- Sub-cards:
  - **Used**: Menampilkan ukuran total file aktif pengguna secara akurat (format byte/MB/GB).
  - **Free space**: Menampilkan sisa kuota penyimpanan dari paket aktif (misal 1 GB Free atau 2 TB Pro).
- Tombol aksi utama oranye: **Buy storage** (langsung membuka modal pemilihan paket penyimpanan).
- Grafik rincian alokasi tipe file (Video, Gambar, Dokumen, Arsip).

### B. Halaman Activity (Sesuai Screenshot 3)
- Label kategori oranye: **Activity**.
- Judul besar: **Activity** dengan subjudul *"Everything you're working on, in one place."*
- Card utama **Recent activity**:
  - Ikon jam melingkar dalam lingkaran oranye.
  - Jumlah total aktivitas (badge counter).
  - Kontainer dashed elegan: *"Uploads and changes will appear here."*
  - Riwayat kronologis aktivitas nyata: riwayat unggah file, sinkronisasi folder dari PC, pembuatan link publik, dan penghapusan file.

### C. Halaman My Drive & Computers
- Tampilan kartu file & folder dengan tema gelap modern.
- Toolbar pencarian, tombol unggah, tampilan Grid/List, serta navigasi folder (breadcrumbs) bernuansa gelap dan tajam.
- Dukungan drag-and-drop dan fitur penyimpanan lokal riil IndexedDB tetap dipertahankan 100%.

---

## 4. Penyesuaian Modal & Dialog Interaktif
- **Modal Share Link Publik**: Latar gelap dengan badge link publik Cloud Run dan tombol salin oranye.
- **Modal Sync Folder**: Pemilihan direktori browser dan daftar folder PC dengan gaya dark mode.
- **Modal Video Player**: Pemutar video gelap dengan kontrol playback speed dan opsi download.
- **Modal Upgrade Storage**: Pilihan paket Free, 50 GB, 200 GB, hingga 2 TB dengan kartu yang rapi dan tombol oranye.

---

## 5. Rencana Pengujian & Verifikasi
1. **Verifikasi Tampilan**:
   - Sidebar navigasi menampilkan menu utama, bagian `WORKSPACE`, dan tautan footer.
   - Halaman `Storage` menampilkan layout persis seperti Screenshot 2.
   - Halaman `Activity` menampilkan layout persis seperti Screenshot 3.
2. **Verifikasi Fungsionalitas**:
   - Upload file dan folder tetap berfungsi dengan penyimpanan riil IndexedDB.
   - Fitur Sync Computers tetap dapat menambahkan dan memfilter folder komputer.
   - Pembuatan tautan publik Cloud Run tetap berjalan lancar.
3. **Kompilasi & Linting**:
   - Menjalankan `compile_applet` dan `lint_applet` untuk memastikan kode bebas dari error TypeScript atau styling.
