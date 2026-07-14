# 🗺️ ROADMAP — PyQuest Web

Kerjakan **satu fase per sesi**. Centang `[x]` kalau sudah kelar.
Tiap ganti fase, mulai sesi baru (`/clear`) biar konteks nggak bengkak & hemat limit.

---

## ✅ Fase 0 — Persiapan
- [x] Cek tool (Node, Python, Git) — semua terpasang ✔️
- [x] Bikin folder proyek: `backend/` + `frontend/`
- [x] `git init`
- [x] README, .gitignore, ROADMAP
- [ ] Bikin repo GitHub & push pertama *(manual — lihat catatan di bawah)*

## ⬜ Fase 1 — Database & Model
- [ ] Bikin virtual environment Python di `backend/`
- [ ] Install FastAPI + SQLAlchemy + Alembic
- [ ] Rancang tabel: `users`, `levels`, `questions`, `progress`, `badges`, `user_badges`, `answers`
- [ ] Setup SQLAlchemy models + koneksi SQLite
- [ ] Seed: pindahkan 10 level + bank soal dari `content.py` PyQuest

## ⬜ Fase 2 — Backend: Login & API Dasar
- [ ] Register + login (hash password, JWT)
- [ ] Bedakan peran dosen vs mahasiswa
- [ ] Endpoint dasar (ambil level, ambil soal)
- [ ] Tes lewat Swagger (`/docs`)

## ⬜ Fase 3 — Frontend: Fondasi
- [ ] Setup React + Vite + Tailwind + React Router
- [ ] Halaman login/register + simpan token
- [ ] Protected route per peran
- [ ] Layout + tema gelap/terang

## ⬜ Fase 4 — Sisi Mahasiswa: Peta & Soal
- [ ] Peta petualangan (10 node, buka bertahap)
- [ ] Halaman level: materi + soal (pilihan ganda, tebak output, lengkapi kode)
- [ ] Nyawa, skor, kirim jawaban ke backend

## ⬜ Fase 5 — Gamifikasi
- [ ] XP, koin, level pemain, gelar
- [ ] Lencana + leaderboard + combo

## ⬜ Fase 6 — Pyodide: Kode Python di Browser
- [ ] Integrasi Pyodide
- [ ] Soal "tulis kode": jalankan + cek output otomatis
- [ ] Lab Kode (editor bebas)

## ⬜ Fase 7 — Sisi Dosen
- [ ] Dashboard dosen
- [ ] CRUD level & soal
- [ ] Pantau progres & nilai mahasiswa + statistik

## ⬜ Fase 8 — Boss Battle & Poles
- [ ] Boss battle (timer, HP bar, animasi)
- [ ] Responsive, loading state, error handling

## ⬜ Fase 9 — Deploy
- [ ] Backend + PostgreSQL ke Render
- [ ] Frontend ke Vercel
- [ ] Atur environment variable & CORS

---

### 📝 Catatan: bikin repo GitHub (langkah manual Fase 0)
1. Buat repo kosong baru di https://github.com/new (kasih nama `pyquest-web`, jangan centang "Add README").
2. Di folder `D:\pyquest-web`, jalankan:
   ```bash
   git add .
   git commit -m "Fase 0: kerangka proyek"
   git remote add origin https://github.com/USERNAME/pyquest-web.git
   git push -u origin main
   ```
   (ganti `USERNAME` dengan username GitHub-mu)
