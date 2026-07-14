# Backend — PyQuest Web (FastAPI)

Otak aplikasi: menyimpan data, autentikasi dosen/mahasiswa, dan logika game.

> Masih kosong — akan diisi mulai **Fase 1** (database & model) dan **Fase 2** (login & API).

## Rencana isi
```
backend/
├── app/
│   ├── main.py        # entry point FastAPI
│   ├── database.py    # koneksi SQLAlchemy (SQLite → Postgres)
│   ├── models.py      # tabel: users, levels, questions, ...
│   ├── schemas.py     # validasi request/response (Pydantic)
│   ├── auth.py        # login, JWT, peran
│   └── routers/       # endpoint per fitur
├── seed.py            # isi data awal (kurikulum dari PyQuest)
└── requirements.txt
```
