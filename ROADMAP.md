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

## ✅ Fase 1 — Database & Model
- [x] Bikin virtual environment Python di `backend/`
- [x] Install FastAPI + SQLAlchemy + Alembic
- [x] Rancang tabel: `users`, `levels`, `questions`, `progress`, `badges`, `user_badges`, `answers`
- [x] Setup SQLAlchemy models + koneksi SQLite
- [x] Seed: pindahkan 10 level + bank soal dari `content.py` PyQuest (10 level, 48 soal, 8 lencana ✔️)
- [ ] *(Alembic terpasang tapi belum diaktifkan — nanti dipakai saat skema berubah; sekarang pakai `create_all`)*

## ✅ Fase 2 — Backend: Login & API Dasar
- [x] Register + login (hash PBKDF2-SHA256, token JWT)
- [x] Bedakan peran dosen vs mahasiswa
- [x] Endpoint: /levels, /levels/{id}, /answer, /levels/{id}/complete, /leaderboard, /me/stats, /badges
- [x] Tes lewat curl (register/login/proteksi 401 lolos)

## ✅ Fase 3 — Frontend: Fondasi
- [x] Setup React + Vite + Tailwind + React Router
- [x] Halaman login/register + simpan token (localStorage) + interceptor axios
- [x] Protected route (redirect ke /login kalau belum masuk)
- [x] Layout + tema gelap/terang (toggle tersimpan)

## ✅ Fase 4 — Sisi Mahasiswa: Peta & Soal
- [x] Peta petualangan (10 node, buka bertahap, bintang per level)
- [x] Halaman level: materi + soal (pilihan ganda, tebak output, lengkapi kode)
- [x] Nyawa ❤️, skor, kirim jawaban ke backend, hadiah XP/koin/lencana, unlock berikutnya
- [ ] *(Soal 'code' ditunda ke Fase 6; boss battle ke Fase 8)*

## ✅ Fase 5 — Gamifikasi
- [x] XP, koin, level pemain, gelar (di /me/stats + bar atas + reward)
- [x] Lencana + leaderboard + combo 🔥 (bonus skor beruntun)
- [x] Halaman Profil (XP progress bar + koleksi 8 lencana)

## ✅ Fase 6 — Pyodide: Kode Python di Browser
- [x] Integrasi Pyodide (CDN, dimuat sekali, `src/pyodide.js`)
- [x] Soal "tulis kode": jalankan di browser → output dikirim ke backend → cek vs `expected`
- [x] Lab Kode (editor bebas, /lab)
- [x] Terverifikasi: Lab jalanin loop + `2**10=1024`; backend cek 'Bandung'→benar, 'Jakarta'→salah
- Catatan: kunci jawaban 'code' tetap di server (anti-nyontek); soal 'code' kini aktif di semua level

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
