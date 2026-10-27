# Rencana Implementasi: Desain Halaman People, Trash, Security & Feedback ForgeDrive

Pembaruan antarmuka ini menyelaraskan empat halaman di bagian **WORKSPACE** (`People`, `Trash`, `Security`, dan `Feedback`) secara presisi dengan 4 tangkapan layar referensi baru yang Anda berikan, mengadopsi nama brand **ForgeDrive**, serta menyematkan interaktivitas penuh untuk manajemen kolaborator dan pemulihan berkas di tempat sampah.

---

## Ringkasan Keputusan Pengguna

> [!IMPORTANT]
> - **Nama Brand**: Menggunakan **ForgeDrive** di seluruh judul aplikasi, header, kartu feedback, dan metadata.
> - **Interaktivitas Halaman People**: Interaktivitas penuh dengan kemampuan mengundang kolaborator melalui input email, memilih role akses (Viewer/Editor), dan daftar orang yang dibagikan berkas.
> - **Interaktivitas Halaman Trash**: Tampilan kosong presisi sesuai screenshot, ditambah daftar berkas terhapus dengan tombol aksi **Restore** (pulihkan ke Drive) dan **Delete Forever** (hapus permanen dari IndexedDB).

---

## 1. Konsep & Arsitektur Visual

Aplikasi mengusung estetika **Dark Obsidian + Warm Orange** (`#f97316`) dengan hierarki tipografi bersih sesuai panduan *SaaS & Dashboard Guidelines*:
- **Background Utama**: `#0c0e14` dengan kartu permukaan `#11141d` dan garis batas subtil `#1e2433`.
- **Label Kategori**: Teks oranye kapital tanpa pill enclosure (`text-orange-500 text-xs font-semibold uppercase tracking-wider`).
- **Judul Halaman**: Teks besar `text-3xl font-bold text-white tracking-tight` dengan subjudul jelas abu-abu terang.
- **Brand ForgeDrive**: Logo palu & awan (*forge & cloud*) dengan nama `ForgeDrive` di sidebar dan bar judul.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              ForgeDrive                                │
├───────────────┬────────────────────────────────────────────────────────┤
│ SIDEBAR       │ WORKSPACE VIEWPORT                                     │
│               │                                                        │
│ • My Drive    │ [Category Tag: People / Trash / Security / Feedback]   │
│ • Computers   │ [Page Title & Subtitle]                                │
│ • Shared      │ ┌────────────────────────────────────────────────────┐ │
│ • Recent      │ │ Primary Dark Card (#11141d, border #1e2433)        │ │
│ • Starred     │ │ • Status Header (Icon Badge + Metrics)             │ │
│ ───────────── │ │ • Grid Sub-cards / Dashed Drop Area / Interactive  │ │
│ WORKSPACE     │ │ • Action Triggers (Invite, Restore, Send Feedback) │ │
│ • Storage     │ └────────────────────────────────────────────────────┘ │
│ • Activity    │                                                        │
│ • People      │                                                        │
│ • Trash       │                                                        │
│ • Security    │                                                        │
│ • Feedback    │                                                        │
└───────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. Rincian Desain 4 Halaman Baru

### A. Halaman People (Sesuai Screenshot 1)
- **Header**: Tag oranye `People`, judul `People`, subjudul *"Manage collaborators and file access."*
- **Card Utama**:
  - Ikon oranye `Users` dalam kontainer rounded `#161b26` dengan border oranye.
  - Sub-label `People & access` dengan counter dinamis: `0 people` (atau jumlah kolaborator nyata) dan status `No collaborators yet`.
  - Area dashed presisi: *"People you share files with will appear here."*
- **Fitur Interaktif Penuh**:
  - Tombol aksi *"Invite collaborator"* yang memunculkan input penambahan email pengguna dan role (Viewer / Editor).
  - Daftar kartu kolaborator yang dapat dicabut (*revoke*) atau diubah hak aksesnya, tersimpan di state persisten.

### B. Halaman Trash (Sesuai Screenshot 2)
- **Header**: Tag oranye `Trash`, judul `Trash`, subjudul *"Everything you're working on, in one place."*
- **Empty State (Presisi Sesuai Screenshot)**:
  - Kartu gelap terpusat dengan ikon tempat sampah `#1e2433`.
  - Judul `Trash is empty`.
  - Deskripsi: *"Deleted files will stay here temporarily so you can restore them before permanent removal."*
- **Populated State (Interaktivitas Penuh)**:
  - Ketika ada berkas yang dihapus ke sampah, menampilkan tabel/kartu berkas terhapus dengan tanggal dihapus dan ukuran file.
  - Tombol aksi per berkas: **Restore** (mengembalikan berkas ke folder asalnya di Drive) dan **Delete Forever** (menghapus blob IndexedDB secara permanen).
  - Tombol **Empty Trash** di pojok kanan atas untuk membersihkan seluruh isi tempat sampah sekaligus.

### C. Halaman Security (Sesuai Screenshot 3)
- **Header**: Tag oranye `Security`, judul `Security`, subjudul *"Review workspace access and protection."*
- **Card Utama**:
  - Ikon perisai oranye `ShieldCheck` dengan label `Workspace health`.
  - Status besar `Ready` dengan subteks `Your workspace is ready`.
- **3 Kartu Status Grid**:
  1. `File protection`: **Active** (Enkripsi penyimpanan lokal & transfer HTTPS aman).
  2. `Sharing access`: **Controlled** (Validasi token tautan publik Cloud Run).
  3. `Suspicious activity`: **None detected** (Pemantauan anomali berkas).
- **Security Checks Footer**:
  - Area gelap dengan border oranye gelap halus: *"Security checks will appear here."*
  - Tombol aksi untuk menjalankan *Scan Workspace Health* secara interaktif.

### D. Halaman Feedback (Sesuai Screenshot 4)
- **Header**: Tag oranye `Feedback`, judul `Feedback`, subjudul *"Everything you're working on, in one place."*
- **Card Utama**:
  - Ikon pesan oranye `MessageSquarePlus` dengan judul `Help us improve ForgeDrive`.
  - Subteks: *"Tell us what works well or what you would like to see next."*
  - Area input `textarea` gelap dengan placeholder *"Share your feedback..."* dan fokus border oranye.
  - Tombol oranye solid `Send feedback` (`bg-orange-500 hover:bg-orange-600`).
- **Interaktivitas**:
  - Validasi karakter, feedback pengiriman sukses (toast notifikasi), dan penyimpanan riwayat masukan.

---

## 3. Rencana Eksekusi & Verifikasi

1. **Pembaruan Branding**:
   - Memperbarui nama aplikasi dan logo menjadi **ForgeDrive** di `app/page.tsx`, `app/layout.tsx`, dan `metadata.json`.
2. **Implementasi Komponen Halaman**:
   - Menghubungkan state kolaborator (`collaborators`) dan integrasi tempat sampah nyata (`trashedItems`, `restoreItem`, `permanentDelete`).
   - Menyusun layout People, Trash, Security, dan Feedback sesuai screenshot referensi secara detail (warna, padding, font, ikon, border).
3. **Pengujian & Verifikasi**:
   - Menjalankan `lint_applet` untuk memastikan tidak ada kesalahan sintaks atau TypeScript.
   - Menjalankan `compile_applet` untuk memverifikasi aplikasi berhasil dikompilasi.
