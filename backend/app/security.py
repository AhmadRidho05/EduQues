"""
Keamanan: hashing password + token JWT.

- Password di-hash pakai PBKDF2-SHA256 + salt (standard library, tanpa
  dependency C). Password asli TIDAK pernah disimpan.
- Token JWT dipakai untuk membuktikan "aku sudah login" di tiap request.
"""

import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt

from .config import settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # token berlaku 1 hari
PBKDF2_ITER = 200_000                  # jumlah putaran (makin banyak makin aman/lambat)


# ---------- Password ----------
def hash_password(password: str) -> str:
    """Ubah password jadi hash aman: pbkdf2_sha256$iter$salt$hash."""
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITER)
    return (f"pbkdf2_sha256${PBKDF2_ITER}$"
            f"{base64.b64encode(salt).decode()}$"
            f"{base64.b64encode(dk).decode()}")


def verify_password(password: str, stored: str) -> bool:
    """Cek password cocok dengan hash tersimpan (tahan timing-attack)."""
    try:
        _algo, iters, salt_b64, hash_b64 = stored.split("$")
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(iters))
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


# ---------- Token JWT ----------
def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Kembalikan isi token kalau valid, atau None kalau rusak/kedaluwarsa."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None
