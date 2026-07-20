"""
Model tabel database (SQLAlchemy 2.0 style).

Setiap class = satu tabel. `Mapped[...]` menandai kolom & tipenya.
Relasi antar tabel dipasang dengan relationship() + ForeignKey().
"""

from datetime import datetime

from sqlalchemy import (JSON, Boolean, DateTime, ForeignKey, Integer, String,
                        Text, UniqueConstraint)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# Nilai peran & tipe soal (dipakai sebagai konstanta biar tidak salah ketik)
ROLE_DOSEN = "dosen"
ROLE_MAHASISWA = "mahasiswa"

KOIN_AWAL = 100  # modal koin awal tiap mahasiswa (untuk beli petunjuk)


class User(Base):
    """Akun pengguna: bisa dosen atau mahasiswa."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    nama: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default=ROLE_MAHASISWA)

    # Data gamifikasi (hanya relevan untuk mahasiswa)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    koin: Mapped[int] = mapped_column(Integer, default=KOIN_AWAL)
    lab_runs: Mapped[int] = mapped_column(Integer, default=0)
    theme: Mapped[str] = mapped_column(String(10), default="dark")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    progress: Mapped[list["Progress"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")
    badges: Mapped[list["UserBadge"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")
    answers: Mapped[list["Answer"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")


class Level(Base):
    """Satu level di peta petualangan. Level boss tidak punya soal sendiri,
    tapi mengambil soal acak dari level lain (kolom `pool`)."""
    __tablename__ = "levels"

    id: Mapped[int] = mapped_column(primary_key=True)
    urutan: Mapped[int] = mapped_column(Integer, unique=True)  # posisi di peta (1..10)
    nama: Mapped[str] = mapped_column(String(80))
    emoji: Mapped[str] = mapped_column(String(10), default="")
    materi: Mapped[str] = mapped_column(Text, default="")
    lives: Mapped[int] = mapped_column(Integer, default=3)   # nyawa pemain (diatur dosen)
    soal_ditanya: Mapped[int] = mapped_column(Integer, default=0)  # 0 = semua; N = ambil N acak

    # Khusus level boss
    is_boss: Mapped[bool] = mapped_column(Boolean, default=False)
    pool: Mapped[list | None] = mapped_column(JSON, nullable=True)    # id level sumber soal
    hp: Mapped[int | None] = mapped_column(Integer, nullable=True)     # nyawa monster
    timer: Mapped[int | None] = mapped_column(Integer, nullable=True)  # detik per soal

    # Siapa dosen pembuatnya (kosong = bawaan seed)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    questions: Mapped[list["Question"]] = relationship(
        back_populates="level", cascade="all, delete-orphan",
        order_by="Question.urutan")


class Question(Base):
    """Bank soal. Kolom yang dipakai berbeda tergantung `tipe`:
      mc    -> q, opts, ans
      out   -> q, code, ans
      blank -> q, code, ans
      code  -> q, starter, expected
    """
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    level_id: Mapped[int] = mapped_column(ForeignKey("levels.id"))
    urutan: Mapped[int] = mapped_column(Integer, default=0)
    tipe: Mapped[str] = mapped_column(String(10))  # 'mc' | 'out' | 'blank' | 'code'

    q: Mapped[str] = mapped_column(Text)            # pertanyaan
    hint: Mapped[str] = mapped_column(Text, default="")
    opts: Mapped[list | None] = mapped_column(JSON, nullable=True)      # mc: pilihan
    ans: Mapped[list | None] = mapped_column(JSON, nullable=True)       # jawaban diterima
    code: Mapped[str | None] = mapped_column(Text, nullable=True)       # out/blank: kode
    starter: Mapped[str | None] = mapped_column(Text, nullable=True)    # code: kode awal
    expected: Mapped[str | None] = mapped_column(Text, nullable=True)   # code: output target

    level: Mapped["Level"] = relationship(back_populates="questions")


class Progress(Base):
    """Kemajuan seorang mahasiswa pada satu level."""
    __tablename__ = "progress"
    __table_args__ = (UniqueConstraint("user_id", "level_id", name="uq_user_level"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    level_id: Mapped[int] = mapped_column(ForeignKey("levels.id"))
    stars: Mapped[int] = mapped_column(Integer, default=0)       # 0-3 bintang
    best_score: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="progress")
    level: Mapped["Level"] = relationship()


class Badge(Base):
    """Daftar induk lencana yang tersedia (di-seed dari PyQuest)."""
    __tablename__ = "badges"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(30), unique=True)  # 'first', 'perfect', ...
    emoji: Mapped[str] = mapped_column(String(10), default="")
    nama: Mapped[str] = mapped_column(String(80))
    syarat: Mapped[str] = mapped_column(String(200), default="")


class UserBadge(Base):
    """Lencana yang sudah diraih seorang mahasiswa."""
    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    badge_id: Mapped[int] = mapped_column(ForeignKey("badges.id"))
    earned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    user: Mapped["User"] = relationship(back_populates="badges")
    badge: Mapped["Badge"] = relationship()


class Answer(Base):
    """Catatan jawaban mahasiswa atas sebuah soal — dipakai dosen untuk menilai."""
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    jawaban: Mapped[str] = mapped_column(Text, default="")
    benar: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    user: Mapped["User"] = relationship(back_populates="answers")
    question: Mapped["Question"] = relationship()


class LevelAttempt(Base):
    """Status percobaan level yang SEDANG berlangsung (disimpan di server
    agar tidak bisa di-reset dengan cara keluar/refresh). Satu percobaan
    aktif per (mahasiswa, level). Dihapus saat level selesai atau nyawa habis."""
    __tablename__ = "level_attempts"
    __table_args__ = (UniqueConstraint("user_id", "level_id", name="uq_level_attempt"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    level_id: Mapped[int] = mapped_column(ForeignKey("levels.id"))
    idx: Mapped[int] = mapped_column(Integer, default=0)        # soal ke-berapa sekarang
    lives: Mapped[int] = mapped_column(Integer, default=3)      # nyawa tersisa
    question_order: Mapped[list | None] = mapped_column(JSON, nullable=True)  # urutan acak id soal
    score: Mapped[int] = mapped_column(Integer, default=0)
    combo: Mapped[int] = mapped_column(Integer, default=0)
    max_combo: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship()
    level: Mapped["Level"] = relationship()


class Material(Base):
    """Materi yang diunggah/ditulis dosen untuk dibaca mahasiswa.
    Bisa berupa teks (ditulis langsung) atau file PDF (diunggah)."""
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    judul: Mapped[str] = mapped_column(String(150))
    tipe: Mapped[str] = mapped_column(String(10))              # 'teks' | 'pdf'
    konten: Mapped[str | None] = mapped_column(Text, nullable=True)         # untuk teks
    file_stored: Mapped[str | None] = mapped_column(String(200), nullable=True)  # nama file di disk
    file_asli: Mapped[str | None] = mapped_column(String(200), nullable=True)    # nama asli file
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    pembuat: Mapped["User"] = relationship()
