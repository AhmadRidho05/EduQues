"""
Mode Tes Harian: tes terjadwal per kelas, dinilai.
- Hanya bisa dikerjakan pada rentang [waktu_mulai, waktu_selesai].
- Soal diambil ACAK dari bank soal kelas (anti-contek), tanpa nyawa.
- Satu kali kerja per mahasiswa; hasil dilihat dosen.
"""

import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_dosen, require_kelas
from .game import _check_answer, _question_public

router = APIRouter(prefix="/tes", tags=["tes"])


def _status(t: models.Tes, now: datetime) -> str:
    if now < t.waktu_mulai:
        return "belum_dibuka"
    if now > t.waktu_selesai:
        return "ditutup"
    return "berlangsung"


def _fmt(dt):
    return dt.strftime("%d %b %Y, %H:%M") if dt else None


def _finalize_expired(db, t, a):
    """Kalau waktu tes sudah lewat tapi attempt belum ditutup (mis. mahasiswa
    keburu tutup browser), kunci otomatis sekarang -> nilai tidak 'None' selamanya."""
    if a and not a.selesai and datetime.now() > t.waktu_selesai:
        a.selesai = True
        a.submitted_at = datetime.now()
        db.commit()
    return a


def _soal_view(db, qid) -> dict:
    """Soal untuk peserta; kalau soal sudah dihapus dosen di tengah tes,
    kembalikan placeholder (bukan crash)."""
    q = db.get(models.Question, qid)
    if not q:
        return {"id": 0, "tipe": "mc", "q": "(soal ini sudah tidak tersedia)",
                "hint": "", "opts": [], "code": None, "starter": None}
    return _question_public(q)


def _attempt_view(db, t, a) -> dict:
    order = a.question_order or []
    return {
        "judul": t.judul, "idx": a.idx, "total": len(order), "selesai": a.selesai,
        "questions": [_soal_view(db, qid) for qid in order],
    }


@router.post("")
def buat_tes(data: schemas.TesCreate, db: Session = Depends(get_db),
             dosen: models.User = Depends(require_dosen),
             kelas_id: int = Depends(require_kelas)):
    if data.waktu_selesai <= data.waktu_mulai:
        raise HTTPException(400, "Waktu selesai harus setelah waktu mulai.")
    t = models.Tes(kelas_id=kelas_id, judul=data.judul,
                   jumlah_soal=max(1, data.jumlah_soal),
                   waktu_mulai=data.waktu_mulai, waktu_selesai=data.waktu_selesai,
                   dibuat_oleh=dosen.id)
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"id": t.id, "judul": t.judul}


@router.get("")
def list_tes(db: Session = Depends(get_db),
             user: models.User = Depends(get_current_user),
             kelas_id: int = Depends(require_kelas)):
    now = datetime.now()
    daftar = (db.query(models.Tes).filter(models.Tes.kelas_id == kelas_id)
              .order_by(models.Tes.waktu_mulai.desc()).all())
    out = []
    for t in daftar:
        item = {"id": t.id, "judul": t.judul, "jumlah_soal": t.jumlah_soal,
                "mulai": _fmt(t.waktu_mulai), "selesai": _fmt(t.waktu_selesai),
                "status": _status(t, now)}
        if user.role == models.ROLE_MAHASISWA:
            a = db.query(models.TesAttempt).filter_by(
                tes_id=t.id, user_id=user.id).first()
            _finalize_expired(db, t, a)  # #11: kunci attempt yang kadaluwarsa
            n = len(a.question_order or []) if a else 0
            item["dikerjakan"] = bool(a and a.selesai)
            item["nilai"] = (round(a.benar_count / n * 100)
                             if a and a.selesai and n else None)
            item["bisa_kerjakan"] = (item["status"] == "berlangsung"
                                     and not item["dikerjakan"])
        else:
            item["peserta_selesai"] = db.query(models.TesAttempt).filter_by(
                tes_id=t.id, selesai=True).count()
            item["jumlah_soal_khusus"] = len(t.questions)
        out.append(item)
    return out


def _pastikan_tes_milik_dosen(db: Session, tid: int, dosen_id: int) -> models.Tes:
    t = db.get(models.Tes, tid)
    if not t:
        raise HTTPException(404, "Tes tidak ditemukan.")
    if t.kelas_id:
        k = db.get(models.Kelas, t.kelas_id)
        if k and k.dosen_id != dosen_id:
            raise HTTPException(403, "Akses ditolak: Tes ini bukan milik kelas Anda.")
    elif t.dibuat_oleh and t.dibuat_oleh != dosen_id:
        raise HTTPException(403, "Akses ditolak: Tes ini bukan milik Anda.")
    return t


@router.get("/{tid}/questions", response_model=list[schemas.QuestionAdmin])
def list_soal_tes(tid: int, db: Session = Depends(get_db),
                  dosen: models.User = Depends(require_dosen)):
    """Daftar soal yang melekat khusus pada tes ini."""
    _pastikan_tes_milik_dosen(db, tid, dosen.id)
    return (db.query(models.Question)
            .filter_by(tes_id=tid)
            .order_by(models.Question.urutan).all())


@router.post("/{tid}/questions", response_model=schemas.QuestionAdmin)
def tambah_soal_tes(tid: int, data: schemas.QuestionIn,
                    db: Session = Depends(get_db),
                    dosen: models.User = Depends(require_dosen)):
    """Tambah soal baru yang eksklusif hanya untuk tes ini."""
    _pastikan_tes_milik_dosen(db, tid, dosen.id)
    urutan = data.urutan
    if not urutan:
        maxu = (db.query(func.coalesce(func.max(models.Question.urutan), -1))
                .filter_by(tes_id=tid).scalar())
        urutan = (maxu if maxu is not None else -1) + 1
    q = models.Question(
        tes_id=tid, level_id=None, urutan=urutan, tipe=data.tipe, q=data.q,
        hint=data.hint or "", opts=data.opts, ans=data.ans,
        code=data.code, starter=data.starter, expected=data.expected)
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.post("/{tid}/tarik-peta")
def tarik_soal_peta(tid: int, data: schemas.TarikSoalIn,
                    db: Session = Depends(get_db),
                    dosen: models.User = Depends(require_dosen)):
    """Salin/tarik soal dari bab-bab peta pilihan dosen ke dalam tes ini."""
    _pastikan_tes_milik_dosen(db, tid, dosen.id)
    if not data.level_ids:
        raise HTTPException(400, "Pilih minimal satu bab peta.")
    
    soal_peta = (db.query(models.Question)
                 .filter(models.Question.level_id.in_(data.level_ids),
                         models.Question.tipe != "code")
                 .order_by(models.Question.level_id, models.Question.urutan).all())
    
    if not soal_peta:
        raise HTTPException(400, "Bab yang dipilih belum memiliki soal yang bisa ditarik.")
    
    maxu = (db.query(func.coalesce(func.max(models.Question.urutan), -1))
            .filter_by(tes_id=tid).scalar())
    cur_u = (maxu if maxu is not None else -1) + 1
    
    tertarik = 0
    for sq in soal_peta:
        baru = models.Question(
            tes_id=tid, level_id=None, urutan=cur_u, tipe=sq.tipe, q=sq.q,
            hint=sq.hint or "", opts=sq.opts, ans=sq.ans,
            code=sq.code, starter=sq.starter, expected=sq.expected
        )
        db.add(baru)
        cur_u += 1
        tertarik += 1
        
    db.commit()
    return {"ok": True, "jumlah_ditarik": tertarik}


@router.delete("/questions/{qid}")
def hapus_soal_tes(qid: int, db: Session = Depends(get_db),
                   dosen: models.User = Depends(require_dosen)):
    """Hapus satu soal dari tes ini."""
    q = db.get(models.Question, qid)
    if not q or not q.tes_id:
        raise HTTPException(404, "Soal tes tidak ditemukan.")
    _pastikan_tes_milik_dosen(db, q.tes_id, dosen.id)
    db.delete(q)
    db.commit()
    return {"ok": True}


@router.delete("/{tid}")
def hapus_tes(tid: int, db: Session = Depends(get_db),
              dosen: models.User = Depends(require_dosen)):
    t = _pastikan_tes_milik_dosen(db, tid, dosen.id)
    db.query(models.TesAttempt).filter_by(tes_id=tid).delete()
    db.delete(t)
    db.commit()
    return {"ok": True}


@router.post("/{tid}/mulai")
def mulai_tes(tid: int, db: Session = Depends(get_db),
              user: models.User = Depends(get_current_user),
              kelas_id: int = Depends(require_kelas)):
    t = db.get(models.Tes, tid)
    if not t or t.kelas_id != kelas_id:
        raise HTTPException(404, "Tes tidak ditemukan.")
    if _status(t, datetime.now()) != "berlangsung":
        raise HTTPException(403, "Tes tidak sedang dibuka.")
    a = db.query(models.TesAttempt).filter_by(tes_id=tid, user_id=user.id).first()
    if a and a.selesai:
        raise HTTPException(400, "Kamu sudah mengerjakan tes ini.")
    if not a:
        # Prioritas 1: Jika tes memiliki soal khusus yang dibuat/ditarik dosen
        soal_khusus = [q for q in t.questions if q.tipe != "code"]
        if soal_khusus:
            qs = list(soal_khusus)
        else:
            # Prioritas 2 (Fallback): Ambil dari bank soal level kelas
            qs = (db.query(models.Question)
                  .join(models.Level, models.Question.level_id == models.Level.id)
                  .filter(models.Level.kelas_id == kelas_id,
                          models.Question.tipe != "code").all())
        random.shuffle(qs)
        order = [q.id for q in qs[:t.jumlah_soal]]
        if not order:  # #9: bank soal masih kosong -> jangan simpan attempt macet
            raise HTTPException(
                400, "Bank soal tes ini masih kosong. Hubungi dosenmu untuk mengisi soal dulu.")
        a = models.TesAttempt(tes_id=tid, user_id=user.id,
                              question_order=order, idx=0, benar_count=0)
        db.add(a)
        try:
            db.commit()
            db.refresh(a)
        except IntegrityError:  # #12: dua klik 'mulai' bersamaan -> pakai yang sudah ada
            db.rollback()
            a = db.query(models.TesAttempt).filter_by(
                tes_id=tid, user_id=user.id).first()
            if not a:
                raise HTTPException(500, "Gagal memulai tes, coba lagi.")
    return _attempt_view(db, t, a)


@router.get("/{tid}/attempt")
def get_tes_attempt(tid: int, db: Session = Depends(get_db),
                    user: models.User = Depends(get_current_user)):
    t = db.get(models.Tes, tid)
    if not t:
        raise HTTPException(404, "Tes tidak ditemukan.")
    a = db.query(models.TesAttempt).filter_by(tes_id=tid, user_id=user.id).first()
    if not a:
        return {"ada": False}
    _finalize_expired(db, t, a)  # #11
    return {"ada": True, **_attempt_view(db, t, a)}


@router.post("/{tid}/jawab")
def jawab_tes(tid: int, data: schemas.TesJawabIn, db: Session = Depends(get_db),
              user: models.User = Depends(get_current_user)):
    t = db.get(models.Tes, tid)
    if not t:
        raise HTTPException(404, "Tes tidak ditemukan.")
    a = db.query(models.TesAttempt).filter_by(tes_id=tid, user_id=user.id).first()
    if not a or a.selesai:
        raise HTTPException(400, "Tes belum dimulai atau sudah selesai.")
    if datetime.now() > t.waktu_selesai:  # waktu habis -> auto submit
        a.selesai = True
        a.submitted_at = datetime.now()
        db.commit()
        raise HTTPException(403, "Waktu tes sudah habis.")

    order = a.question_order or []
    total = len(order)
    if a.idx >= total:
        raise HTTPException(400, "Semua soal sudah dijawab.")

    q = db.get(models.Question, order[a.idx])
    if q is None:  # #10: soal dihapus dosen di tengah tes -> lewati, jangan crash
        a.idx += 1
        benar = False
    else:
        benar = _check_answer(q, data.jawaban)
        db.add(models.Answer(user_id=user.id, question_id=q.id,
                             jawaban=data.jawaban, benar=benar))
        if benar:
            a.benar_count += 1
        a.idx += 1

    status, nilai = "lanjut", None
    if a.idx >= total:
        a.selesai = True
        a.submitted_at = datetime.now()
        status = "selesai"
        nilai = round(a.benar_count / total * 100) if total else 0
    db.commit()
    # Anti-curang: jangan bocorkan benar/salah sebelum tes selesai total
    return {
        "idx": a.idx, "total": total, "status": status,
        "benar_count": a.benar_count if status == "selesai" else None,
        "nilai": nilai if status == "selesai" else None,
    }


@router.get("/{tid}/hasil")
def hasil_tes(tid: int, db: Session = Depends(get_db),
              dosen: models.User = Depends(require_dosen)):
    t = db.get(models.Tes, tid)
    if not t:
        raise HTTPException(404, "Tes tidak ditemukan.")
    rows = []
    for a in db.query(models.TesAttempt).filter_by(tes_id=tid).all():
        _finalize_expired(db, t, a)  # #11
        total = len(a.question_order or [])
        rows.append({
            "nama": a.user.nama if a.user else "?",
            "benar": a.benar_count, "total": total,
            "nilai": round(a.benar_count / total * 100) if total else 0,
            "selesai": a.selesai,
        })
    rows.sort(key=lambda r: -r["nilai"])
    return {"judul": t.judul, "hasil": rows}
