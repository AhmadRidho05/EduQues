"""
Endpoint autentikasi: daftar, login, dan lihat profil sendiri.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _norm(jawaban: str) -> str:
    """Samakan bentuk jawaban keamanan (abaikan spasi & huruf besar/kecil)."""
    return (jawaban or "").strip().lower()


@router.post("/register", response_model=schemas.Token)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Buat akun baru lalu langsung berikan token (auto-login)."""
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    role = data.role if data.role in (models.ROLE_DOSEN, models.ROLE_MAHASISWA) \
        else models.ROLE_MAHASISWA
    user = models.User(
        nama=data.nama,
        email=data.email,
        password_hash=hash_password(data.password),
        role=role,
        security_q=(data.security_q or "").strip() or None,
        security_a=(hash_password(_norm(data.security_a))
                    if data.security_a.strip() else None),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login dengan email (di field 'username') + password."""
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email atau password salah")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    """Profil pengguna yang sedang login."""
    return user


# ==================== LUPA PASSWORD ====================
@router.post("/lupa/pertanyaan")
def lupa_pertanyaan(data: schemas.LupaPertanyaanIn, db: Session = Depends(get_db)):
    """Langkah 1: tampilkan pertanyaan keamanan milik email tersebut."""
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(404, "Email tidak terdaftar.")
    if not user.security_q or not user.security_a:
        raise HTTPException(
            400, "Akun ini belum mengatur pertanyaan keamanan. "
                 "Minta dosen/admin untuk mereset password kamu.")
    return {"nama": user.nama, "pertanyaan": user.security_q}


@router.post("/lupa/reset")
def lupa_reset(data: schemas.LupaResetIn, db: Session = Depends(get_db)):
    """Langkah 2: cek jawaban, lalu pasang password baru."""
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not user.security_a:
        raise HTTPException(404, "Akun tidak ditemukan.")
    if not verify_password(_norm(data.jawaban), user.security_a):
        raise HTTPException(400, "Jawaban salah. Coba ingat-ingat lagi.")
    if len(data.password_baru) < 6:
        raise HTTPException(400, "Password baru minimal 6 karakter.")
    user.password_hash = hash_password(data.password_baru)
    db.commit()
    return {"ok": True, "pesan": "Password berhasil diganti. Silakan masuk."}


@router.post("/keamanan")
def set_keamanan(data: schemas.KeamananIn, db: Session = Depends(get_db),
                 user: models.User = Depends(get_current_user)):
    """Atur/ubah pertanyaan keamanan sendiri (dipakai di halaman Profil)."""
    if not data.pertanyaan.strip() or not data.jawaban.strip():
        raise HTTPException(400, "Pertanyaan dan jawaban wajib diisi.")
    user.security_q = data.pertanyaan.strip()
    user.security_a = hash_password(_norm(data.jawaban))
    db.commit()
    return {"ok": True, "pertanyaan": user.security_q}
