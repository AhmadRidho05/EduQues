"""
Endpoint Kelas (Tahap 1: fondasi).
- Dosen: buat kelas (dapat kode unik), lihat kelas miliknya, hapus kelas.
- Mahasiswa: gabung kelas pakai kode, lihat kelas yang diikuti, keluar kelas.

(Penyaringan konten per kelas menyusul di Tahap 2.)
"""

import random
import string

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_dosen

router = APIRouter(prefix="/kelas", tags=["kelas"])


def _kode_baru(db: Session) -> str:
    """Buat kode kelas 6 karakter yang belum dipakai."""
    for _ in range(30):
        kode = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not db.query(models.Kelas).filter_by(kode=kode).first():
            return kode
    raise HTTPException(500, "Gagal membuat kode unik, coba lagi.")


def _to_dict(db: Session, k: models.Kelas, user: models.User) -> dict:
    jml = db.query(models.KelasMember).filter_by(kelas_id=k.id).count()
    return {
        "id": k.id, "kode": k.kode, "matkul": k.matkul,
        "kampus": k.kampus, "prodi": k.prodi, "semester": k.semester,
        "kelas_label": k.kelas_label,
        "dosen": k.dosen.nama if k.dosen else "",
        "jumlah_anggota": jml,
        "milik_saya": k.dosen_id == user.id,
    }


@router.post("")
def buat_kelas(data: schemas.KelasCreate, db: Session = Depends(get_db),
               dosen: models.User = Depends(require_dosen)):
    k = models.Kelas(
        kode=_kode_baru(db), matkul=data.matkul, kampus=data.kampus,
        prodi=data.prodi, semester=data.semester,
        kelas_label=data.kelas_label, dosen_id=dosen.id)
    db.add(k)
    db.commit()
    db.refresh(k)
    return _to_dict(db, k, dosen)


@router.get("/saya")
def kelas_saya(db: Session = Depends(get_db),
               user: models.User = Depends(get_current_user)):
    """Dosen: kelas yang dia buat. Mahasiswa: kelas yang dia ikuti."""
    if user.role == models.ROLE_DOSEN:
        rows = (db.query(models.Kelas).filter_by(dosen_id=user.id)
                .order_by(models.Kelas.created_at.desc()).all())
    else:
        rows = (db.query(models.Kelas)
                .join(models.KelasMember, models.KelasMember.kelas_id == models.Kelas.id)
                .filter(models.KelasMember.user_id == user.id)
                .order_by(models.Kelas.created_at.desc()).all())
    return [_to_dict(db, k, user) for k in rows]


@router.post("/gabung")
def gabung(data: schemas.GabungIn, db: Session = Depends(get_db),
           user: models.User = Depends(get_current_user)):
    if user.role != models.ROLE_MAHASISWA:
        raise HTTPException(403, "Hanya mahasiswa yang bisa gabung kelas.")
    k = db.query(models.Kelas).filter_by(kode=data.kode.strip().upper()).first()
    if not k:
        raise HTTPException(404, "Kode kelas tidak ditemukan.")
    sudah = db.query(models.KelasMember).filter_by(
        kelas_id=k.id, user_id=user.id).first()
    if sudah:
        raise HTTPException(400, "Kamu sudah gabung kelas ini.")
    db.add(models.KelasMember(kelas_id=k.id, user_id=user.id))
    db.commit()
    return _to_dict(db, k, user)


@router.delete("/{kid}")
def hapus_atau_keluar(kid: int, db: Session = Depends(get_db),
                      user: models.User = Depends(get_current_user)):
    k = db.get(models.Kelas, kid)
    if not k:
        raise HTTPException(404, "Kelas tidak ditemukan.")
    # Dosen pemilik -> hapus kelas beserta keanggotaannya
    if user.role == models.ROLE_DOSEN and k.dosen_id == user.id:
        db.query(models.KelasMember).filter_by(kelas_id=kid).delete()
        db.delete(k)
        db.commit()
        return {"ok": True, "aksi": "hapus"}
    # Mahasiswa -> keluar dari kelas
    m = db.query(models.KelasMember).filter_by(kelas_id=kid, user_id=user.id).first()
    if m:
        db.delete(m)
        db.commit()
    return {"ok": True, "aksi": "keluar"}
