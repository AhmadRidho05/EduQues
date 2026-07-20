# ⚡ EduQuest — Platform Belajar Gamified Multi-Kelas

Platform belajar berbasis web dengan nuansa **game petualangan** — untuk mata pelajaran apa pun.

- 🎮 **Mode Latihan** → peta petualangan, level, boss battle, XP/koin/lencana, Lab Kode
- 📝 **Mode Tes Harian** → tes terjadwal & dinilai (anti-contek: soal acak)
- 🏫 **Multi-kelas** → tiap dosen punya kelasnya sendiri (soal/materi/tes terpisah)
- 📚 **Materi** → dosen kirim teks atau upload PDF

**Dua peran:** mahasiswa belajar sambil "main game" & ikut tes; dosen kelola konten + pantau nilai — semua lewat browser.

> Bermula dari gabungan dua proyek desktop (game **PyQuest** + **Aplikasi Kuis**), kini berkembang jadi platform LMS gamified.

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
