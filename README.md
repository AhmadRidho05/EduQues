# 🐍 PyQuest Web — Platform Belajar Python Gamified

Platform belajar Python berbasis web yang menggabungkan **dua proyek desktop**:

- **PyQuest** (game edukasi) → peta petualangan, XP, koin, lencana, boss battle, Lab Kode
- **Aplikasi Kuis** (dosen–mahasiswa) → dosen kelola bank soal & pantau nilai, mahasiswa mengerjakan

**Hasil gabungan:** mahasiswa belajar sambil "main game", dosen mengatur konten & memantau progres — lewat browser.

## 🧩 Konsep Dua Peran

| Peran | Yang dilihat |
|---|---|
| 👨‍🎓 **Mahasiswa** | Peta petualangan, level & soal, gamifikasi (XP/koin/lencana), Lab Kode, leaderboard |
| 👨‍🏫 **Dosen** | Dashboard kelola level & soal (CRUD), pantau progres & nilai mahasiswa |

## 🛠️ Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python) + SQLAlchemy |
| Database | SQLite (dev) → PostgreSQL (produksi) |
| Jalankan kode Python | Pyodide (di browser, aman) |
| Deploy | Vercel (frontend) + Render (backend + DB) |

## 📁 Struktur

```
pyquest-web/
├── backend/    # FastAPI: API, database, auth, logika game
│   └── app/
├── frontend/   # React: tampilan mahasiswa & dosen
├── ROADMAP.md  # Rencana pengerjaan per fase (contreng di sini!)
└── README.md
```

## 🚀 Menjalankan (nanti, setelah tiap bagian dibuat)

```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev
```

Lihat **[ROADMAP.md](ROADMAP.md)** untuk langkah pengerjaan.
