# Free Plan 1 GB Quota & Dynamic Storage Upgrade

Rencana pembaruan sistem kuota AsterDrive untuk mengubah kuota standar akun free dari 100 GB menjadi 1 GB, menyematkan indikator visual Free Plan, memberlakukan validasi kuota saat upload file, serta menghadirkan simulasi upgrade paket penyimpanan secara langsung.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan jawaban klarifikasi yang telah dikonfirmasi oleh pengguna, berikut adalah spesifikasi yang akan diimplementasikan:

- **Confirmed Decision 1 (Status Akun Free)**: Menampilkan badge status **Free Plan** yang elegan dan rapi pada kartu bilah penyimpanan (sidebar) dan di dalam panel profil pengguna.
- **Confirmed Decision 2 (Validasi Kuota Upload)**: Memvalidasi total ukuran file saat proses upload. Jika upload file baru menyebabkan penggunaan melebihi kapasitas 1 GB (atau kapasitas aktif), proses upload dibatalkan dan sistem secara otomatis membuka modal upgrade penyimpanan dengan notifikasi yang jelas.
- **Confirmed Decision 3 (Simulasi Upgrade Dinamis)**: Ketika pengguna memilih paket (misalnya 50 GB, 200 GB, 2 TB, 6 TB, atau 12 TB) dan menekan tombol *Continue*, sistem langsung memperbarui kapasitas kuota aktif secara dinamis di seluruh antarmuka (sidebar, profil, indikator progres), serta memperbarui status paket dari *Free Plan* ke paket berbayar yang dipilih.

---

## 1. Overview & Core Concept

- **What It Does**: Memperbarui arsitektur penyimpanan AsterDrive agar mendukung manajemen tier akun. Akun awal ditetapkan sebagai *Free Plan* dengan kuota tepat 1 GB (1,073,741,824 bytes). Tampilan teks kuota di sidebar dan profil disesuaikan dari `0 B of 100 GB used` menjadi `0 B of 1 GB used` (atau sesuai ukuran terpakai secara proporsional). Pengguna yang mengunggah file melebihi kapasitas akan dicegah dan diarahkan langsung ke upgrade modal.
- **Target Audience / Persona**: Pengguna baru atau pengguna akun gratis AsterDrive yang membutuhkan transparansi batasan kuota, kemudahan memantau pemakaian data, serta alur peningkatan kapasitas (upgrade) yang mulus.
- **Key Value**: Memberikan batasan kuota yang realistis (1 GB freemium), mencegah *overflow* data tanpa kontrol, dan meningkatkan konversi upgrade penyimpanan melalui *interception* upload yang ramah pengguna.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Tampilan Awal**: Pengguna melihat kartu penyimpanan di sidebar kiri dengan judul "Storage", badge "Free Plan", bilah progres penyimpanan, dan teks "0 B of 1 GB used".
  2. **Tampilan Profil**: Saat pengguna membuka profil layar penuh, baris Storage pada grup *Account* menampilkan badge "Free Plan" serta rincian penggunaan kuota "0 B of 1 GB used".
  3. **Alur Upload Terbatas**: Pengguna mengunggah file via tombol "New" -> "File upload". Sistem memeriksa `(totalUsedBytes + newFilesSize) > currentQuotaBytes`. Jika melebihi kuota, upload dibatalkan, pesan peringatan muncul ("Storage limit exceeded. Upgrade your plan to get more space"), dan modal *Upgrade your storage* otomatis terbuka.
  4. **Alur Upgrade Dinamis**: Di dalam modal upgrade, pengguna memilih paket (misalnya 2 TB - Recommended) lalu menekan tombol "Continue". Modal tertutup dengan konfirmasi visual (toast banner sukses), dan seluruh label kuota seketika berubah menjadi misalnya "0 B of 2 TB used" dengan badge status "2 TB Plan".

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: SaaS Dashboard modern, bersih, fungsional (mengikuti pedoman *Universal Frontend Design Constitution* dan *SaaS & Dashboard Guidelines*).
  - *Color Palette & Mood*:
    - Canvas: Putih bersih (`bg-white`) dan slate netral lembut (`bg-slate-50`).
    - Free Badge: Slate sejuk beraksen halus (`bg-slate-100 text-slate-700 font-medium text-xs px-2 py-0.5 rounded-md border border-slate-200/60`).
    - Upgraded Badge: Biru aksen bernuansa premium (`bg-blue-50 text-blue-700 font-medium text-xs px-2 py-0.5 rounded-md border border-blue-200`).
    - Warning State: Amber/Rose saat kuota mendekati 100% atau terlampaui.
  - *Typography & Hierarchy*:
    - Teks kuota dan ukuran menggunakan angka tabular (`font-mono tabular-nums` atau teks proporsional rapi) agar pergeseran angka tidak mengubah lebar layout.
    - Menghindari pill badge yang berlebihan; badge status dibuat minimalis menyatu dengan tipografi label.
  - *Interactive Feedback & Motion*:
    - Transisi perubahan kapasitas kuota pada progress bar berlangsung mulus dengan animasi CSS easing (`transition-all duration-500 ease-out`).
    - Toast feedback interaktif saat upgrade berhasil atau saat upload dicegah karena kuota penuh.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Penyimpanan State Kuota Akun (Dynamic Plan State)**
  - *Chosen Approach*: Menyediakan state `currentPlan` yang berisi metadata paket aktif (`id`, `name`, `quotaBytes`, `isFree`). Nilai awal disetel ke `{ id: 'free', name: 'Free Plan', quotaBytes: 1024 * 1024 * 1024, isFree: true }`.
  - *Why*: Memungkinkan simulasi upgrade langsung mengubah batas kuota secara reaktif di semua komponen tanpa me-reload halaman.
  - *Alternatives Considered*: Hardcode teks kuota statis 1 GB. Ditolak karena pengguna menginginkan simulasi upgrade yang dapat langsung memperbarui batas kuota ke paket baru.

- **Decision 2: Pengalaman Validasi Upload (Auto-Trigger Upgrade Modal)**
  - *Chosen Approach*: Validasi langsung di fungsi `handleFileUpload`. Jika kapasitas tidak mencukupi, sistem menolak file, menampilkan pesan peringatan yang jelas dan informatif, serta langsung mengaktifkan `setIsUpgradeModalOpen(true)`.
  - *Why*: Mengurangi friksi bagi pengguna—ketika ruang habis, mereka langsung diberi solusi pilihan upgrade tanpa perlu mencari-cari menu upgrade secara manual.
  - *Alternatives Considered*: Mengizinkan file terunggah lalu menampilkan angka kuota minus atau merah. Ditolak karena melanggar batasan kuota freemium dan membingungkan pengguna.

- **Decision 3: Menghilangkan `window.alert()` pada Modal Upgrade**
  - *Chosen Approach*: Mengganti `alert('Redirecting...')` dengan state notifikasi in-app (toast / dialog konfirmasi) yang bersih dan modern.
  - *Why*: Mematuhi batasan lingkungan runtime (lingkungan dev/iframe membatasi `window.alert`) dan memberikan estetika antarmuka kelas enterprise.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       AsterDriveApp                         │
│                                                             │
│  State:                                                     │
│   • driveItems: DriveItem[]                                 │
│   • currentPlan: { id, name, quotaBytes, isFree }           │
│   • totalUsedBytes: number (computed via useMemo)           │
│   • storagePercentage: number (clamped to 0 - 100%)         │
│   • toastNotification: { type, title, message } | null      │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────┐  ┌───────────────────────────────┐
│     Sidebar Storage Card      │  │     Full Screen Profile       │
│                               │  │                               │
│ • "Storage" + [Free Plan]     │  │ • Storage Item in Account     │
│ • Progress Bar (0-100%)       │  │ • "0 B of 1 GB used"          │
│ • "0 B of 1 GB used"          │  │ • Status [Free Plan] badge    │
│ • "Get more storage" CTA      │  │ • Click opens Upgrade Modal   │
└───────────────┬───────────────┘  └───────────────┬───────────────┘
                │                                  │
                └─────────────────┬────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Upload & Upgrade Flow                   │
│                                                             │
│ 1. handleFileUpload(e):                                     │
│    • incomingSize = sum(files.size)                         │
│    • if (totalUsedBytes + incomingSize > currentPlan.bytes) │
│        -> Show error toast & open Upgrade Modal             │
│    • else -> append newItems to driveItems                  │
│                                                             │
│ 2. Upgrade Storage Modal:                                   │
│    • Plan options: 50GB, 200GB, 2TB (Recommended), 6TB, 12TB│
│    • On "Continue":                                         │
│        -> Update currentPlan state to selected plan         │
│        -> Close modal & display success toast banner        │
└─────────────────────────────────────────────────────────────┘
```

### Data Model & State Mapping

- **Plan Entity Schema**:
  ```typescript
  interface StoragePlan {
    id: string;
    name: string;
    quotaBytes: number;
    price: string;
    recommended?: boolean;
    isFree?: boolean;
  }
  ```
- **Paket yang Tersedia**:
  - `free`: 1 GB (`1 * 1024 * 1024 * 1024` bytes) - Free Plan
  - `50GB`: 50 GB (`50 * 1024 * 1024 * 1024` bytes) - IDR 15.000 / bln
  - `200GB`: 200 GB (`200 * 1024 * 1024 * 1024` bytes) - IDR 45.000 / bln
  - `2TB`: 2 TB (`2 * 1024 * 1024 * 1024 * 1024` bytes) - IDR 149.000 / bln (Recommended)
  - `6TB`: 6 TB (`6 * 1024 * 1024 * 1024 * 1024` bytes) - IDR 449.000 / bln
  - `12TB`: 12 TB (`12 * 1024 * 1024 * 1024 * 1024` bytes) - IDR 899.000 / bln

- **State Transitions**:
  - Saat `currentPlan` diperbarui dari `free` ke paket baru, label penyimpanan otomatis berganti format sesuai ukuran (misal `0 B of 2 TB used`), badge profil & sidebar menyesuaikan nama paket, dan perhitungan persen kuota dikalkulasi ulang terhadap kapasitas baru.
