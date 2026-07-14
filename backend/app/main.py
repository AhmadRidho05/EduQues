"""
Entry point FastAPI — merangkai semua router + izinkan akses dari frontend.

Jalankan (dari folder backend/):
    .venv\\Scripts\\uvicorn app.main:app --reload
Dokumentasi interaktif: http://127.0.0.1:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth, game

# Buat tabel kalau belum ada (nanti diganti Alembic saat skema berubah).
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PyQuest Web API", version="0.2.0")

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
