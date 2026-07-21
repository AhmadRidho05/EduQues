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
from . import materials

router = APIRouter(prefix="/kelas", tags=["kelas"])


def _kode_baru(db: Session) -> str:
    """Buat kode kelas 6 karakter yang belum dipakai."""
    for _ in range(30):
        kode = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not db.query(models.Kelas).filter_by(kode=kode).first():
            return kode
    raise HTTPException(500, "Gagal membuat kode unik, coba lagi.")


def clone_template_levels(db: Session, kelas_id: int, dosen_id: int):
    """Salin level template (kelas_id NULL) + soal-soalnya ke kelas baru,
    supaya tiap kelas langsung punya kurikulum 10 level untuk diedit dosen."""
    templates = (db.query(models.Level)
                 .filter(models.Level.kelas_id.is_(None))
                 .order_by(models.Level.urutan).all())
    for lv in templates:
        baru = models.Level(
            urutan=lv.urutan, nama=lv.nama, emoji=lv.emoji, materi=lv.materi,
            lives=lv.lives, soal_ditanya=lv.soal_ditanya, is_boss=lv.is_boss,
            pool=lv.pool, hp=lv.hp, timer=lv.timer,
            created_by=dosen_id, kelas_id=kelas_id)
        db.add(baru)
        db.flush()  # dapatkan baru.id
        for q in lv.questions:
            db.add(models.Question(
                level_id=baru.id, urutan=q.urutan, tipe=q.tipe, q=q.q,
                hint=q.hint, opts=q.opts, ans=q.ans, code=q.code,
                starter=q.starter, expected=q.expected))
    db.commit()


EMOJI_BAB = ["📘", "📗", "📙", "📕", "📓", "📔", "📒", "📚", "🗂️", "🏆"]


def buat_level_kosong(db: Session, kelas_id: int, dosen_id: int):
    """Buat 10 bab KOSONG (tanpa soal) untuk kelas baru — dosen mengisinya
    sendiri sesuai mata pelajarannya. Bab 5 & 10 jadi ujian (boss)."""
    for i in range(1, 11):
        boss = i in (5, 10)
        db.add(models.Level(
            urutan=i,
            nama=(f"Ujian Bab {i}" if boss else f"Bab {i}"),
            emoji=EMOJI_BAB[i - 1],
            materi="",
            lives=3, soal_ditanya=0,
            is_boss=boss,
            pool=([1, 2, 3, 4] if i == 5 else ([6, 7, 8, 9] if i == 10 else None)),
            hp=(8 if i == 5 else (10 if i == 10 else None)),
            timer=(20 if i == 5 else (15 if i == 10 else None)),
            created_by=dosen_id, kelas_id=kelas_id))
    db.commit()


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
    # Default: 10 bab KOSONG (dosen isi sendiri). Opsional: contoh kurikulum Python.
    if data.pakai_template:
        clone_template_levels(db, k.id, dosen.id)
    else:
        buat_level_kosong(db, k.id, dosen.id)
    return _to_dict(db, k, dosen)


@router.post("/{kid}/masuk")
def masuk_kelas(kid: int, db: Session = Depends(get_db),
                user: models.User = Depends(get_current_user)):
    """Set kelas ini sebagai kelas aktif. Semua konten lalu disaring ke kelas ini."""
    k = db.get(models.Kelas, kid)
    if not k:
        raise HTTPException(404, "Kelas tidak ditemukan.")
    if user.role == models.ROLE_DOSEN:
        if k.dosen_id != user.id:
            raise HTTPException(403, "Ini bukan kelasmu.")
    else:
        anggota = db.query(models.KelasMember).filter_by(
            kelas_id=kid, user_id=user.id).first()
        if not anggota:
            raise HTTPException(403, "Kamu belum gabung kelas ini.")
    user.current_kelas_id = kid
    db.commit()
    return {"ok": True, "kelas": _to_dict(db, k, user)}


@router.get("/aktif")
def kelas_aktif(db: Session = Depends(get_db),
                user: models.User = Depends(get_current_user)):
    """Kelas yang sedang aktif (dibuka) user, atau null."""
    if not user.current_kelas_id:
        return {"aktif": False}
    k = db.get(models.Kelas, user.current_kelas_id)
    if not k:
        return {"aktif": False}
    return {"aktif": True, **_to_dict(db, k, user)}


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
    # Dosen pemilik -> hapus kelas BESERTA semua data turunannya (#8).
    # Tanpa ini, level/soal/materi/progress/attempt/tes jadi "yatim":
    # menumpuk diam-diam di SQLite, dan bikin IntegrityError 500 di PostgreSQL.
    if user.role == models.ROLE_DOSEN and k.dosen_id == user.id:
        level_ids = [r[0] for r in
                     db.query(models.Level.id).filter_by(kelas_id=kid).all()]
        q_ids = ([r[0] for r in db.query(models.Question.id)
                  .filter(models.Question.level_id.in_(level_ids)).all()]
                 if level_ids else [])
        tes_ids = [r[0] for r in
                   db.query(models.Tes.id).filter_by(kelas_id=kid).all()]

        # 1) data mahasiswa yang menaut ke soal/level kelas ini
        if q_ids:
            db.query(models.Answer).filter(
                models.Answer.question_id.in_(q_ids)).delete(synchronize_session=False)
        if level_ids:
            db.query(models.Progress).filter(
                models.Progress.level_id.in_(level_ids)).delete(synchronize_session=False)
            db.query(models.LevelAttempt).filter(
                models.LevelAttempt.level_id.in_(level_ids)).delete(synchronize_session=False)
        # 2) tes + attempt-nya
        if tes_ids:
            db.query(models.TesAttempt).filter(
                models.TesAttempt.tes_id.in_(tes_ids)).delete(synchronize_session=False)
            db.query(models.Tes).filter_by(kelas_id=kid).delete(synchronize_session=False)
        # 3) materi + file PDF fisiknya
        for m in db.query(models.Material).filter_by(kelas_id=kid).all():
            materials.hapus_file_materi(m)
        db.query(models.Material).filter_by(kelas_id=kid).delete(synchronize_session=False)
        # 4) soal lalu level
        if q_ids:
            db.query(models.Question).filter(
                models.Question.id.in_(q_ids)).delete(synchronize_session=False)
        db.query(models.Level).filter_by(kelas_id=kid).delete(synchronize_session=False)
        # 5) keanggotaan + reset "kelas aktif" yang menunjuk kelas ini
        db.query(models.KelasMember).filter_by(kelas_id=kid).delete(synchronize_session=False)
        db.query(models.User).filter(models.User.current_kelas_id == kid).update(
            {"current_kelas_id": None}, synchronize_session=False)
        db.delete(k)
        db.commit()
        return {"ok": True, "aksi": "hapus"}
    # Mahasiswa -> keluar dari kelas
    m = db.query(models.KelasMember).filter_by(kelas_id=kid, user_id=user.id).first()
    if m:
        db.delete(m)
    if user.current_kelas_id == kid:
        user.current_kelas_id = None
    db.commit()
    return {"ok": True, "aksi": "keluar"}
