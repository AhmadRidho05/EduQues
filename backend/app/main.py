"""
Entry point FastAPI — merangkai semua router + izinkan akses dari frontend.

Jalankan (dari folder backend/):
    .venv\\Scripts\\uvicorn app.main:app --reload
Dokumentasi interaktif: http://127.0.0.1:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import inspect, text

from .database import Base, engine
from .routers import auth, dosen, game, kelas, materials, tes

# Buat tabel kalau belum ada (nanti diganti Alembic saat skema berubah).
Base.metadata.create_all(bind=engine)

# Auto-migration untuk membuat level_id nullable & memastikan kolom tes_id ada
def _migrate_questions_table():
    try:
        insp = inspect(engine)
        cols = {c["name"]: c for c in insp.get_columns("questions")}
        # Jika level_id masih NOT NULL (bawaan SQLite lama), migrasi agar nullable
        if "level_id" in cols and not cols["level_id"].get("nullable", True):
            with engine.begin() as conn:
                conn.execute(text("PRAGMA foreign_keys = OFF"))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS questions_temp (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        level_id INTEGER REFERENCES levels(id),
                        tes_id INTEGER REFERENCES tes(id),
                        urutan INTEGER DEFAULT 0,
                        tipe VARCHAR(10),
                        q TEXT,
                        hint TEXT DEFAULT '',
                        opts JSON,
                        ans JSON,
                        code TEXT,
                        starter TEXT,
                        expected TEXT
                    )
                """))
                has_tes = "tes_id" in cols
                tes_col = "tes_id" if has_tes else "NULL as tes_id"
                conn.execute(text(f"""
                    INSERT INTO questions_temp (id, level_id, tes_id, urutan, tipe, q, hint, opts, ans, code, starter, expected)
                    SELECT id, level_id, {tes_col}, urutan, tipe, q, hint, opts, ans, code, starter, expected
                    FROM questions
                """))
                conn.execute(text("DROP TABLE questions"))
                conn.execute(text("ALTER TABLE questions_temp RENAME TO questions"))
                conn.execute(text("PRAGMA foreign_keys = ON"))
        elif "tes_id" not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE questions ADD COLUMN tes_id INTEGER REFERENCES tes(id)"))
    except Exception as e:
        print("Auto-migration notice:", e)

_migrate_questions_table()

app = FastAPI(title="EduQuest API", version="1.0.0")

# Izinkan frontend (Vite dev server) memanggil API ini.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(game.router)
app.include_router(dosen.router)
app.include_router(materials.router)
app.include_router(kelas.router)
app.include_router(tes.router)
