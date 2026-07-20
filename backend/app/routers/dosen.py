"""
Endpoint khusus DOSEN (semua dijaga require_dosen):
- kelola bank soal (CRUD) per level
- pantau progres & nilai mahasiswa
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import game, models, schemas
from ..database import get_db
from ..deps import require_dosen, require_kelas


def _anggota_ids(db, kelas_id):
    """Daftar user_id mahasiswa yang tergabung di kelas ini."""
    return [m.user_id for m in
            db.query(models.KelasMember).filter_by(kelas_id=kelas_id).all()]

# dependencies di level router: SEMUA endpoint di sini butuh peran dosen
router = APIRouter(prefix="/dosen", tags=["dosen"],
                   dependencies=[Depends(require_dosen)])


# ==================== RINGKASAN ====================
@router.get("/overview")
def overview(db: Session = Depends(get_db),
             kelas_id: int = Depends(require_kelas)):
    ids = _anggota_ids(db, kelas_id)
    nlv = db.query(models.Level).filter(models.Level.kelas_id == kelas_id).count()
    nq = (db.query(models.Question)
          .join(models.Level, models.Question.level_id == models.Level.id)
          .filter(models.Level.kelas_id == kelas_id).count())
    return {"num_students": len(ids), "num_levels": nlv, "num_questions": nq}


# ==================== KELOLA SOAL (CRUD) ====================
@router.put("/levels/{level_id}")
def update_level_settings(level_id: int, data: schemas.LevelSettingsIn,
                          db: Session = Depends(get_db)):
    """Ubah pengaturan level — untuk sekarang: jumlah nyawa (1–10)."""
    lv = db.get(models.Level, level_id)
    if not lv:
        raise HTTPException(404, "Level tidak ditemukan")
    lv.lives = max(1, min(10, data.lives))
    lv.soal_ditanya = max(0, min(len(lv.questions), data.soal_ditanya))  # 0 = semua
    if data.nama is not None and data.nama.strip():
        lv.nama = data.nama.strip()
    if data.materi is not None:
        lv.materi = data.materi
    db.commit()
    return {"id": lv.id, "lives": lv.lives, "soal_ditanya": lv.soal_ditanya,
            "nama": lv.nama, "materi": lv.materi}


@router.get("/levels/{level_id}/questions",
            response_model=list[schemas.QuestionAdmin])
def list_questions(level_id: int, db: Session = Depends(get_db)):
    if not db.get(models.Level, level_id):
        raise HTTPException(404, "Level tidak ditemukan")
    return (db.query(models.Question)
            .filter_by(level_id=level_id)
            .order_by(models.Question.urutan).all())


@router.post("/levels/{level_id}/questions",
             response_model=schemas.QuestionAdmin)
def create_question(level_id: int, data: schemas.QuestionIn,
                    db: Session = Depends(get_db)):
    if not db.get(models.Level, level_id):
        raise HTTPException(404, "Level tidak ditemukan")
    urutan = data.urutan
    if not urutan:  # taruh di akhir
        maxu = (db.query(func.coalesce(func.max(models.Question.urutan), -1))
                .filter_by(level_id=level_id).scalar())
        urutan = (maxu if maxu is not None else -1) + 1
    q = models.Question(
        level_id=level_id, urutan=urutan, tipe=data.tipe, q=data.q,
        hint=data.hint or "", opts=data.opts, ans=data.ans,
        code=data.code, starter=data.starter, expected=data.expected)
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.put("/questions/{qid}", response_model=schemas.QuestionAdmin)
def update_question(qid: int, data: schemas.QuestionIn,
                    db: Session = Depends(get_db)):
    q = db.get(models.Question, qid)
    if not q:
        raise HTTPException(404, "Soal tidak ditemukan")
    q.tipe = data.tipe
    q.q = data.q
    q.hint = data.hint or ""
    q.opts = data.opts
    q.ans = data.ans
    q.code = data.code
    q.starter = data.starter
    q.expected = data.expected
    if data.urutan:
        q.urutan = data.urutan
    db.commit()
    db.refresh(q)
    return q


@router.delete("/questions/{qid}")
def delete_question(qid: int, db: Session = Depends(get_db)):
    q = db.get(models.Question, qid)
    if not q:
        raise HTTPException(404, "Soal tidak ditemukan")
    db.delete(q)
    db.commit()
    return {"ok": True}


# ==================== PANTAU MAHASISWA ====================
@router.get("/students")
def list_students(db: Session = Depends(get_db),
                  kelas_id: int = Depends(require_kelas)):
    ids = _anggota_ids(db, kelas_id)
    students = (db.query(models.User)
                .filter(models.User.id.in_(ids or [-1]))
                .order_by(models.User.nama).all())
    out = []
    for s in students:
        rows = db.query(models.Progress).filter_by(user_id=s.id).all()
        pl, _, _ = game.level_info(s.xp)
        out.append({
            "id": s.id, "nama": s.nama, "email": s.email,
            "xp": s.xp, "koin": s.koin,
            "player_level": pl, "rank": game.rank_title(pl),
            "levels_completed": sum(1 for p in rows if p.stars > 0),
            "total_stars": sum(p.stars for p in rows),
        })
    return out


@router.get("/students/{sid}")
def student_detail(sid: int, db: Session = Depends(get_db),
                   kelas_id: int = Depends(require_kelas)):
    if sid not in _anggota_ids(db, kelas_id):
        raise HTTPException(404, "Mahasiswa bukan anggota kelas ini")
    s = db.get(models.User, sid)
    if not s:
        raise HTTPException(404, "Mahasiswa tidak ditemukan")
    prog = {p.level_id: p for p in
            db.query(models.Progress).filter_by(user_id=sid).all()}
    levels = (db.query(models.Level).filter(models.Level.kelas_id == kelas_id)
              .order_by(models.Level.urutan).all())
    pl, _, _ = game.level_info(s.xp)
    return {
        "id": s.id, "nama": s.nama, "email": s.email,
        "xp": s.xp, "koin": s.koin,
        "player_level": pl, "rank": game.rank_title(pl),
        "progress": [
            {
                "level_id": lv.id, "urutan": lv.urutan, "nama": lv.nama,
                "stars": prog[lv.id].stars if lv.id in prog else 0,
                "best_score": prog[lv.id].best_score if lv.id in prog else 0,
                "selesai": lv.id in prog and prog[lv.id].stars > 0,
            }
            for lv in levels
        ],
    }
