# Rencana Implementasi: Penghapusan Kedua Elemen Drag-and-Drop

Berdasarkan tangkapan layar dan konfirmasi, kami akan menghapus kedua elemen visual *drag-and-drop*:
1. **Callout Bar Bagian Atas:** Bar horizontal tipis dengan border putus-putus (*"Drag & drop files or entire folders here to upload directly"* dan link *"Browse computer"*).
2. **Kotak Dropzone Empty State:** Kotak putus-putus di bagian tengah layar kosong (*"Drag & drop files or entire folders here"*).

---

## 1. Rincian Modifikasi pada `app/page.tsx`

### A. Hapus Quick Drag-and-Drop Upload Callout Bar (Baris ~1622–1640)
Menghapus blok berikut dari bagian atas area konten:
```tsx
{/* QUICK DRAG-AND-DROP UPLOAD CALLOUT BAR */}
{(activeNav === 'my-drive' || activeNav === 'computers') && (
  <div 
    onClick={() => fileInputRef.current?.click()}
    className="mb-4 py-2.5 px-4 bg-slate-50/90 hover:bg-blue-50/60 border border-dashed border-slate-200 hover:border-blue-400 rounded-2xl flex items-center justify-between text-xs text-slate-600 hover:text-blue-700 transition-all cursor-pointer group shadow-2xs"
  >
    ...
  </div>
)}
```

### B. Hapus Kotak Dropzone pada Empty State (Baris ~1805–1821)
Menghapus kotak putus-putus pada kondisi `activeNav === 'my-drive'`:
```tsx
{activeNav === 'my-drive' ? (
  <div 
    onClick={() => fileInputRef.current?.click()}
    className="w-full p-5 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/40 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center group"
  >
    ...
  </div>
) : (
  <button 
    type="button"
    onClick={() => handleNavSelect('my-drive')}
    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
  >
    ← Back to My Drive
  </button>
)}
```
Jika `activeNav !== 'my-drive'`, tombol navigasi `← Back to My Drive` tetap dipertahankan agar navigasi pengguna tetap mudah.

---

## 2. Integritas Fungsionalitas
- **Upload via Floating Action Button (`+`):** Tetap berjalan normal (Upload File, Upload Folder, Buat Folder Baru).
- **Drag-and-Drop Jendela Browser:** Event handler drag & drop pada tingkat window/halaman tetap aktif, sehingga pengguna masih dapat menyeret file kapan saja langsung ke drive.
- **Penyimpanan Nyata (IndexedDB & LocalStorage):** Tetap berfungsi penuh untuk semua file asli yang diunggah.

---

## 3. Langkah Verifikasi
1. **Linter:** Menjalankan `lint_applet` untuk memastikan kode bersih dari kesalahan sintaksis.
2. **Kompilasi:** Menjalankan `compile_applet` untuk memastikan build Next.js berjalan tanpa error.
3. **Pemeriksaan Visual:** Memverifikasi kedua elemen telah hilang dari tampilan antarmuka dan tampilan layout tetap seimbang dan rapi.
