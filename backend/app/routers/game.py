"""
Endpoint inti game (untuk mahasiswa):
- daftar level (dengan status terbuka/terkunci + bintang milik user)
- detail level (materi + soal, TANPA kunci jawaban)
- cek jawaban satu soal
- selesaikan level (simpan bintang, tambah XP/koin, cek lencana)
- leaderboard & statistik diri
"""

import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import game, models, schemas
from ..database import get_db
from ..deps import get_current_user, require_kelas

router = APIRouter(tags=["game"])


# ---------- helper ----------
def _progress_map(db: Session, user_id: int) -> dict[int, models.Progress]:
    rows = db.query(models.Progress).filter(models.Progress.user_id == user_id).all()
    return {p.level_id: p for p in rows}


def _is_unlocked(level, prog_map, levels_by_urutan) -> bool:
    """Level terbuka kalau level dengan urutan sebelumnya sudah dapat bintang."""
    if level.urutan <= 1:
        return True
    prev = levels_by_urutan.get(level.urutan - 1)
    if not prev:
        return True
    p = prog_map.get(prev.id)
    return bool(p and p.stars > 0)


def _check_answer(q: models.Question, jawaban: str) -> bool:
    """Cocokkan jawaban.
    - Soal 'code': `jawaban` = output hasil menjalankan kode (dari Pyodide di
      browser), dibandingkan persis dengan `expected` (peka huruf besar/kecil).
    - Soal lain: dibandingkan dengan daftar `ans` (abaikan spasi & kapital)."""
    norm = (jawaban or "").strip()
    if q.tipe == "code":
        return norm == (q.expected or "").strip()
    accepted = q.ans or []
    low = norm.lower()
    return any(low == str(a).strip().lower() for a in accepted)


def _earn_badge(db: Session, user: models.User, key: str) -> bool:
    badge = db.query(models.Badge).filter(models.Badge.key == key).first()
    if not badge:
        return False
    already = db.query(models.UserBadge).filter_by(
        user_id=user.id, badge_id=badge.id).first()
    if already:
        return False
    db.add(models.UserBadge(user_id=user.id, badge_id=badge.id))
    return True


def _award_badges(db, user, level, stars) -> list[str]:
    total_stars = db.query(func.coalesce(func.sum(models.Progress.stars), 0)) \
        .filter(models.Progress.user_id == user.id).scalar() or 0
    new = []
    checks = [
        (level.urutan == 1, "first"),
        (stars == 3, "perfect"),
        (level.urutan == 5, "boss1"),
        (level.urutan == 8, "loop"),
        (level.urutan == 10, "master"),
        (total_stars >= 15, "stars15"),
        (user.koin >= 500, "rich"),
    ]
    for ok, key in checks:
        if ok and _earn_badge(db, user, key):
            new.append(key)
    return new


MAX_LIVES = 3


def _finalize(db, user, level, stars, score) -> dict:
    """Simpan hasil level (bintang/skor terbaik), beri hadiah sekali di awal,
    cek lencana. Dipakai saat level biasa selesai maupun boss dikalahkan."""
    stars = max(0, min(3, stars))
    prog = db.query(models.Progress).filter_by(
        user_id=user.id, level_id=level.id).first()
    first_time = prog is None
    if prog is None:
        prog = models.Progress(user_id=user.id, level_id=level.id,
                               stars=stars, best_score=score,
                               completed_at=datetime.now())
        db.add(prog)
    else:
        prog.stars = max(prog.stars, stars)
        prog.best_score = max(prog.best_score, score)
        prog.completed_at = datetime.now()

    if first_time:  # hadiah hanya saat pertama kali menyelesaikan
        user.xp += game.XP_REWARD
        user.koin += game.COIN_REWARD + stars * game.COIN_PER_STAR

    db.commit()
    new_badges = _award_badges(db, user, level, stars)
    db.commit()
    db.refresh(user)
    pl, _, _ = game.level_info(user.xp)
    return {"xp": user.xp, "koin": user.koin, "player_level": pl,
            "rank": game.rank_title(pl), "new_badges": new_badges, "stars": stars}


def _attempt_state(a, total) -> dict:
    return {"idx": a.idx, "lives": a.lives, "score": a.score,
            "combo": a.combo, "max_combo": a.max_combo, "total": total}


def _effective_count(lv) -> int:
    """Berapa soal yang benar-benar ditanyakan: 0/berlebih = semua, N = N."""
    total = len(lv.questions)
    n = lv.soal_ditanya or 0
    return n if 0 < n <= total else total


def _question_public(q) -> dict:
    """Soal untuk mahasiswa — TANPA kunci jawaban, pilihan ganda diacak posisinya."""
    opts = list(q.opts) if q.opts else None
    if opts:
        random.shuffle(opts)
    return {"id": q.id, "tipe": q.tipe, "q": q.q, "hint": q.hint,
            "opts": opts, "code": q.code, "starter": q.starter}


def _build_questions(db, order) -> list:
    out = []
    for qid in (order or []):
        q = db.get(models.Question, qid)
        if q:
            out.append(_question_public(q))
    return out


# ---------- endpoints ----------
@router.get("/levels", response_model=list[schemas.LevelOut])
def list_levels(db: Session = Depends(get_db),
                user: models.User = Depends(get_current_user),
                kelas_id: int = Depends(require_kelas)):
    levels = (db.query(models.Level).filter(models.Level.kelas_id == kelas_id)
              .order_by(models.Level.urutan).all())
    prog = _progress_map(db, user.id)
    by_urutan = {lv.urutan: lv for lv in levels}
    return [
        schemas.LevelOut(
            id=lv.id, urutan=lv.urutan, nama=lv.nama, emoji=lv.emoji,
            is_boss=lv.is_boss,
            unlocked=_is_unlocked(lv, prog, by_urutan),
            stars=prog[lv.id].stars if lv.id in prog else 0,
            jumlah_soal=len(lv.questions),
            lives=lv.lives,
            soal_ditanya=lv.soal_ditanya,
        )
        for lv in levels
    ]


@router.get("/levels/{level_id}", response_model=schemas.LevelDetail)
def level_detail(level_id: int, db: Session = Depends(get_db),
                 user: models.User = Depends(get_current_user),
                 kelas_id: int = Depends(require_kelas)):
    lv = db.get(models.Level, level_id)
    if not lv or lv.kelas_id != kelas_id:
        raise HTTPException(404, "Level tidak ditemukan")

    levels = (db.query(models.Level).filter(models.Level.kelas_id == kelas_id)
              .order_by(models.Level.urutan).all())
    by_urutan = {x.urutan: x for x in levels}
    if not _is_unlocked(lv, _progress_map(db, user.id), by_urutan):
        raise HTTPException(403, "Level masih terkunci")

    return schemas.LevelDetail(
        id=lv.id, urutan=lv.urutan, nama=lv.nama, emoji=lv.emoji,
        materi=lv.materi, is_boss=lv.is_boss, lives=lv.lives,
        jumlah_soal=_effective_count(lv),
        hp=lv.hp, timer=lv.timer,
        questions=[schemas.QuestionOut.model_validate(q) for q in lv.questions],
    )


@router.get("/boss/{level_id}")
def boss_battle(level_id: int, db: Session = Depends(get_db),
                user: models.User = Depends(get_current_user),
                kelas_id: int = Depends(require_kelas)):
    """Data pertarungan boss: soal diambil ACAK dari level-level di `pool`
    (kecuali soal tulis-kode, biar cocok untuk soal berwaktu)."""
    lv = db.get(models.Level, level_id)
    if not lv or not lv.is_boss or lv.kelas_id != kelas_id:
        raise HTTPException(404, "Level boss tidak ditemukan")

    levels = (db.query(models.Level).filter(models.Level.kelas_id == kelas_id)
              .order_by(models.Level.urutan).all())
    by_urutan = {x.urutan: x for x in levels}
    if not _is_unlocked(lv, _progress_map(db, user.id), by_urutan):
        raise HTTPException(403, "Level masih terkunci")

    pool = lv.pool or []
    qs = (db.query(models.Question)
          .join(models.Level, models.Question.level_id == models.Level.id)
          .filter(models.Level.kelas_id == kelas_id,
                  models.Level.urutan.in_(pool),
                  models.Question.tipe != "code")
          .all())
    random.shuffle(qs)
    return {
        "id": lv.id, "nama": lv.nama, "emoji": lv.emoji, "materi": lv.materi,
        "hp": lv.hp, "timer": lv.timer,
        "questions": [
            {"id": q.id, "tipe": q.tipe, "q": q.q, "hint": q.hint,
             "opts": q.opts, "code": q.code, "starter": q.starter}
            for q in qs
        ],
    }


@router.post("/answer", response_model=schemas.AnswerResult)
def check_answer(data: schemas.AnswerIn, db: Session = Depends(get_db),
                 user: models.User = Depends(get_current_user)):
    q = db.get(models.Question, data.question_id)
    if not q:
        raise HTTPException(404, "Soal tidak ditemukan")

    benar = _check_answer(q, data.jawaban)
    db.add(models.Answer(user_id=user.id, question_id=q.id,
                         jawaban=data.jawaban, benar=benar))
    db.commit()

    jawaban_benar = str(q.ans[0]) if (not benar and q.ans) else None
    return schemas.AnswerResult(benar=benar, jawaban_benar=jawaban_benar)


@router.post("/levels/{level_id}/complete", response_model=schemas.CompleteResult)
def complete_level(level_id: int, data: schemas.CompleteIn,
                   db: Session = Depends(get_db),
                   user: models.User = Depends(get_current_user)):
    lv = db.get(models.Level, level_id)
    if not lv:
        raise HTTPException(404, "Level tidak ditemukan")

    r = _finalize(db, user, lv, data.stars, data.score)
    return schemas.CompleteResult(
        xp=r["xp"], koin=r["koin"], player_level=r["player_level"],
        rank=r["rank"], new_badges=r["new_badges"],
    )


@router.get("/levels/{level_id}/attempt")
def get_attempt(level_id: int, db: Session = Depends(get_db),
                user: models.User = Depends(get_current_user)):
    """Cek apakah ada percobaan yang belum selesai untuk level ini.
    Frontend pakai ini saat membuka level: kalau ada -> lanjutkan."""
    lv = db.get(models.Level, level_id)
    if not lv:
        raise HTTPException(404, "Level tidak ditemukan")
    a = db.query(models.LevelAttempt).filter_by(
        user_id=user.id, level_id=level_id).first()
    if not a:
        return {"active": False, "total": _effective_count(lv)}
    order = a.question_order or []
    return {"active": True, **_attempt_state(a, len(order)),
            "questions": _build_questions(db, order)}


@router.post("/levels/{level_id}/attempt/start")
def start_attempt(level_id: int, db: Session = Depends(get_db),
                  user: models.User = Depends(get_current_user),
                  kelas_id: int = Depends(require_kelas)):
    """Mulai percobaan BARU (nyawa penuh). Menghapus percobaan lama kalau ada.
    Dipakai tombol 'Mulai' dan 'Ulangi'."""
    lv = db.get(models.Level, level_id)
    if not lv or lv.kelas_id != kelas_id:
        raise HTTPException(404, "Level tidak ditemukan")
    levels = (db.query(models.Level).filter(models.Level.kelas_id == kelas_id)
              .order_by(models.Level.urutan).all())
    by_urutan = {x.urutan: x for x in levels}
    if not _is_unlocked(lv, _progress_map(db, user.id), by_urutan):
        raise HTTPException(403, "Level masih terkunci")

    old = db.query(models.LevelAttempt).filter_by(
        user_id=user.id, level_id=level_id).first()
    if old:
        db.delete(old)
        db.commit()

    # Acak urutan soal, lalu ambil sejumlah yang ditanyakan (fitur 1 + 2)
    qs = sorted(lv.questions, key=lambda q: q.urutan)
    random.shuffle(qs)
    order = [q.id for q in qs[:_effective_count(lv)]]

    a = models.LevelAttempt(user_id=user.id, level_id=level_id,
                            idx=0, lives=lv.lives, score=0, combo=0, max_combo=0,
                            question_order=order)
    db.add(a)
    db.commit()
    db.refresh(a)
    return {"active": True, **_attempt_state(a, len(order)),
            "questions": _build_questions(db, order)}


@router.post("/levels/{level_id}/attempt/answer")
def attempt_answer(level_id: int, data: schemas.AttemptAnswerIn,
                   db: Session = Depends(get_db),
                   user: models.User = Depends(get_current_user)):
    """Jawab soal yang SEDANG aktif. Server yang menentukan soal ke-berapa
    (dari data percobaan), memperbarui nyawa/idx/skor, dan menyimpannya —
    jadi keluar/refresh tidak me-reset kemajuan."""
    lv = db.get(models.Level, level_id)
    if not lv:
        raise HTTPException(404, "Level tidak ditemukan")
    a = db.query(models.LevelAttempt).filter_by(
        user_id=user.id, level_id=level_id).first()
    if not a:
        raise HTTPException(400, "Belum ada percobaan aktif. Mulai dulu.")

    order = a.question_order or []
    total = len(order)
    if a.idx >= total:
        raise HTTPException(400, "Semua soal sudah dijawab")

    q = db.get(models.Question, order[a.idx])
    if not q:
        raise HTTPException(404, "Soal tidak ditemukan")
    benar = _check_answer(q, data.jawaban)
    db.add(models.Answer(user_id=user.id, question_id=q.id,
                         jawaban=data.jawaban, benar=benar))

    gain = 0
    if benar:
        a.combo += 1
        a.max_combo = max(a.max_combo, a.combo)
        gain = 100 + max(0, a.combo - 1) * 25
        a.score += gain
    else:
        a.combo = 0
        a.lives -= 1
    a.idx += 1

    # Ambil nilai sekarang sebelum percobaan mungkin dihapus
    lives, idx, score, combo, max_combo = a.lives, a.idx, a.score, a.combo, a.max_combo
    jawaban_benar = str(q.ans[0]) if (not benar and q.ans) else None

    status, reward = "active", None
    if lives <= 0:                       # nyawa habis -> gagal, percobaan dihapus
        status = "failed"
        db.delete(a)
        db.commit()
    elif idx >= total:                   # semua soal beres -> selesai
        status = "completed"
        reward = _finalize(db, user, lv, max(1, lives), score)
        reward["score"] = score
        reward["max_combo"] = max_combo
        db.delete(a)
        db.commit()
    else:
        db.commit()

    return {
        "benar": benar, "jawaban_benar": jawaban_benar, "gain": gain,
        "lives": max(0, lives), "idx": idx, "score": score, "combo": combo,
        "total": total, "status": status, "reward": reward,
    }


@router.get("/leaderboard", response_model=list[schemas.LeaderboardRow])
def leaderboard(db: Session = Depends(get_db),
                user: models.User = Depends(get_current_user)):
    top = db.query(models.User).filter(
        models.User.role == models.ROLE_MAHASISWA) \
        .order_by(models.User.xp.desc()).limit(20).all()
    rows = []
    for u in top:
        pl, _, _ = game.level_info(u.xp)
        rows.append(schemas.LeaderboardRow(
            nama=u.nama, xp=u.xp, player_level=pl, rank=game.rank_title(pl)))
    return rows


@router.get("/me/stats")
def my_stats(db: Session = Depends(get_db),
             user: models.User = Depends(get_current_user)):
    pl, in_level, need = game.level_info(user.xp)
    total_stars = db.query(func.coalesce(func.sum(models.Progress.stars), 0)) \
        .filter(models.Progress.user_id == user.id).scalar() or 0
    earned = db.query(models.Badge).join(
        models.UserBadge, models.UserBadge.badge_id == models.Badge.id) \
        .filter(models.UserBadge.user_id == user.id).all()
    return {
        "nama": user.nama,
        "xp": user.xp,
        "koin": user.koin,
        "player_level": pl,
        "xp_in_level": in_level,
        "xp_need": need,
        "rank": game.rank_title(pl),
        "total_stars": int(total_stars),
        "badges": [{"key": b.key, "emoji": b.emoji, "nama": b.nama}
                   for b in earned],
    }


@router.get("/badges")
def all_badges(db: Session = Depends(get_db),
               user: models.User = Depends(get_current_user)):
    """Semua definisi lencana + status sudah diraih (untuk halaman profil)."""
    earned = {ub.badge_id for ub in
              db.query(models.UserBadge).filter_by(user_id=user.id).all()}
    return [
        {"key": b.key, "emoji": b.emoji, "nama": b.nama,
         "syarat": b.syarat, "earned": b.id in earned}
        for b in db.query(models.Badge).all()
    ]
