"""
Entry point FastAPI.

Untuk Fase 1 isinya masih minimal: bikin tabel + 2 endpoint pengecekan
(`/health` dan `/levels`) supaya kita bisa memastikan database & seed jalan.
Login dan API lengkap dibuat di Fase 2.

Jalankan (dari folder backend/):
    .venv\\Scripts\\uvicorn app.main:app --reload
Lalu buka http://127.0.0.1:8000/docs
"""

from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from . import models
from .database import Base, engine, get_db

# Buat semua tabel kalau belum ada (untuk sekarang; nanti diganti Alembic
# saat skema mulai berubah).
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PyQuest Web API", version="0.1.0")


@app.get("/health")
def health():
    """Cek sederhana: server hidup?"""
    return {"status": "ok"}


@app.get("/levels")
def list_levels(db: Session = Depends(get_db)):
    """Daftar level (untuk memastikan seed berhasil)."""
    levels = db.query(models.Level).order_by(models.Level.urutan).all()
    return [
        {
            "id": lv.id,
            "urutan": lv.urutan,
            "nama": lv.nama,
            "emoji": lv.emoji,
            "is_boss": lv.is_boss,
            "jumlah_soal": len(lv.questions),
        }
        for lv in levels
    ]
