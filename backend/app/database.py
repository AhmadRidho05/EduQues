"""
Koneksi database (SQLAlchemy).

- `engine`       : jembatan ke database (SQLite sekarang, Postgres nanti).
- `SessionLocal` : pabrik "session" — satu percakapan dengan database.
- `Base`         : induk semua model tabel.
- `get_db()`     : dependency FastAPI, membuka session per request lalu menutupnya.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

# SQLite butuh opsi khusus agar bisa dipakai lintas thread (server web multi-thread).
connect_args = (
    {"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Induk semua model. Tabel didaftarkan lewat pewarisan class ini."""
    pass


def get_db():
    """Buka session database untuk satu request, tutup otomatis setelah selesai."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
