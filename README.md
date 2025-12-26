# Jelajahi TataSurya — Fullstack (React + Tailwind + 3D + Node/Express)

Aplikasi pembelajaran bertema **Jelajahi TataSurya** dengan fitur:

- **Halaman Utama (Home)**: nuansa galaksi + tombol interaktif **Mulai Jelajah**, **Mode 3D**, **Data Eksplorasi**
- **Halaman Eksplorasi (3D)**: navigasi planet 3D + efek cahaya + orbit dinamis (React Three Fiber)
- **Halaman Pengetahuan**: materi planet (teks) + **narasi** (SpeechSynthesis) + ilustrasi animatif (Anime.js)
- **Halaman Tantangan (Kuis)**: soal pilihan ganda, penilaian otomatis, pembahasan
- **Halaman Progres**: peta planet yang sudah dikunjungi + grafik perkembangan nilai
- **Login multi-role**: Guru / Murid
- **Dashboard Guru**:
  - melihat nilai kuis siswa
  - menambah & mengubah soal
  - menambah & mengubah materi

---

## 1) Menjalankan Backend

```bash
cd backend
npm install
npm run dev
# API: http://localhost:4000
```

### (Opsional) ENV Backend

Buat file `backend/.env`:

```env
PORT=4000
JWT_SECRET=ubah_ini_jadi_rahasia
```

---

## 2) Menjalankan Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

### (Opsional) ENV Frontend

Buat file `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

---

## 3) Akun & Role

Silakan **Daftar** dari UI, pilih role:

- **guru** → masuk ke Dashboard Guru (`/teacher`)
- **murid** → masuk ke Eksplorasi (`/explore`)

Semua data tersimpan di file JSON: `backend/db.json` (sederhana untuk demo/prototype).

---

## 4) Endpoint Utama (Ringkas)

- `POST /api/auth/register` (guru/murid)
- `POST /api/auth/login`
- `GET /api/planets`
- `GET /api/materials?planetId=...`
- `POST /api/materials` (guru)
- `GET /api/questions?planetId=...`
- `POST /api/questions` (guru)
- `POST /api/quiz/submit` (murid → tersimpan; guru → preview)
- `GET /api/quiz/scores` (guru)
- `GET /api/progress/my` (murid/guru)
- `POST /api/progress/visit`

---

## 5) Kustomisasi Animasi

- Lottie JSON contoh ada di: `frontend/src/assets/lottie/pulse.json`
- Anda bisa mengganti dengan Lottie lain (file `.json`) dan pakai komponen `lottie-react`.

---

## 6) Catatan

Ini versi MVP/prototype (file DB JSON). Untuk produksi, disarankan migrasi ke DB (PostgreSQL/MongoDB), tambah validasi input, rate-limit, dan audit akses yang lebih ketat.
