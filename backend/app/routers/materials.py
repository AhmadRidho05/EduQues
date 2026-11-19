"""
Endpoint materi belajar.
- Mahasiswa & dosen bisa MELIHAT daftar materi + membuka file PDF.
- Hanya DOSEN yang bisa membuat (teks / upload PDF) dan menghapus.

File PDF disimpan di folder backend/uploads/ (nama diacak biar aman),
info-nya dicatat di database.
"""

import os
import uuid

from fastapi import (APIRouter, Depends, File, Form, HTTPException, UploadFile)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_dosen, require_kelas

# backend/uploads/  (tetap sama di mana pun server dijalankan)
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_MB = 10

router = APIRouter(prefix="/materials", tags=["materi"])


def hapus_file_materi(m: models.Material):
    """Hapus file fisik PDF milik sebuah materi (kalau ada).
    Dipakai saat materi dihapus maupun saat kelasnya dihapus."""
    if m.tipe == "pdf" and m.file_stored:
        p = os.path.join(UPLOAD_DIR, m.file_stored)
        if os.path.exists(p):
            os.remove(p)


def _to_dict(m: models.Material) -> dict:
    return {
        "id": m.id, "judul": m.judul, "tipe": m.tipe,
        "konten": m.konten, "file_asli": m.file_asli,
        "created_at": m.created_at.strftime("%d %b %Y %H:%M") if m.created_at else None,
        "dibuat_oleh": m.pembuat.nama if m.pembuat else "Dosen",
    }


@router.get("")
def list_materials(db: Session = Depends(get_db),
                   user: models.User = Depends(get_current_user),
                   kelas_id: int = Depends(require_kelas)):
    rows = (db.query(models.Material)
            .filter(models.Material.kelas_id == kelas_id)
            .order_by(models.Material.created_at.desc()).all())
    return [_to_dict(m) for m in rows]


@router.post("")
def create_text(data: schemas.MaterialTextIn,
                db: Session = Depends(get_db),
                dosen: models.User = Depends(require_dosen),
                kelas_id: int = Depends(require_kelas)):
    m = models.Material(judul=data.judul, tipe="teks",
                        konten=data.konten, created_by=dosen.id, kelas_id=kelas_id)
    db.add(m)
    db.commit()
    db.refresh(m)
    return _to_dict(m)


@router.post("/upload")
def upload_pdf(judul: str = Form(...),
               file: UploadFile = File(...),
               db: Session = Depends(get_db),
               dosen: models.User = Depends(require_dosen),
               kelas_id: int = Depends(require_kelas)):
    nama = (file.filename or "").lower()
    if not nama.endswith(".pdf") or file.content_type not in (
            "application/pdf", "application/octet-stream"):
        raise HTTPException(400, "File harus berformat PDF.")
    isi = file.file.read()
    if len(isi) > MAX_MB * 1024 * 1024:
        raise HTTPException(400, f"Ukuran file maksimal {MAX_MB} MB.")

    stored = f"{uuid.uuid4().hex}.pdf"
    with open(os.path.join(UPLOAD_DIR, stored), "wb") as f:
        f.write(isi)

    m = models.Material(judul=judul, tipe="pdf", file_stored=stored,
                        file_asli=file.filename, created_by=dosen.id,
                        kelas_id=kelas_id)
    db.add(m)
    db.commit()
    db.refresh(m)
    return _to_dict(m)


@router.get("/{mid}/file")
def download(mid: int, db: Session = Depends(get_db),
             user: models.User = Depends(get_current_user)):
    m = db.get(models.Material, mid)
    if not m or m.tipe != "pdf" or not m.file_stored:
        raise HTTPException(404, "File tidak ditemukan.")
    path = os.path.join(UPLOAD_DIR, m.file_stored)
    if not os.path.exists(path):
        raise HTTPException(404, "File sudah hilang dari server.")
    return FileResponse(path, media_type="application/pdf",
                        filename=m.file_asli or "materi.pdf")


@router.delete("/{mid}")
def delete_material(mid: int, db: Session = Depends(get_db),
                    dosen: models.User = Depends(require_dosen)):
    m = db.get(models.Material, mid)
    if not m:
        raise HTTPException(404, "Materi tidak ditemukan.")
    if m.kelas_id:
        k = db.get(models.Kelas, m.kelas_id)
        if k and k.dosen_id != dosen.id:
            raise HTTPException(403, "Akses ditolak: Materi ini bukan milik kelas Anda.")
    elif m.created_by and m.created_by != dosen.id:
        raise HTTPException(403, "Akses ditolak: Materi ini bukan milik Anda.")
    hapus_file_materi(m)
    db.delete(m)
    db.commit()
    return {"ok": True}
