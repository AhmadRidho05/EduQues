"""
Dependency FastAPI untuk autentikasi & otorisasi.

`get_current_user` membaca token dari header Authorization, memvalidasinya,
lalu mengambil user dari database. Endpoint yang butuh login tinggal
menambahkan `user = Depends(get_current_user)`.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from . import models
from .database import get_db
from .security import decode_token

# tokenUrl menunjuk ke endpoint login (dipakai tombol "Authorize" di /docs)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau kedaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise cred_exc
    user = db.get(models.User, int(payload["sub"]))
    if user is None:
        raise cred_exc
    return user


def require_dosen(user: models.User = Depends(get_current_user)) -> models.User:
    """Batasi akses hanya untuk dosen (dipakai di Fase 7)."""
    if user.role != models.ROLE_DOSEN:
        raise HTTPException(status_code=403, detail="Akses khusus dosen")
    return user


def require_kelas(user: models.User = Depends(get_current_user)) -> int:
    """Pastikan user sudah 'masuk' ke sebuah kelas. Mengembalikan kelas_id aktif.
    Semua konten (level/soal/materi) disaring berdasarkan kelas ini."""
    if not user.current_kelas_id:
        raise HTTPException(status_code=409,
                            detail="Belum memilih kelas. Buka menu Kelas dulu.")
    return user.current_kelas_id
