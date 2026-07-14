"""
Isi database dengan data awal: 10 level + bank soal + 8 lencana,
diambil dari kurikulum PyQuest (app/curriculum.py).

Jalankan sekali (dari folder backend/):
    .venv\\Scripts\\python seed.py

Aman dijalankan berulang: kalau data sudah ada, seed dilewati.
"""

from app import models
from app.curriculum import BADGES, LEVELS
from app.database import Base, SessionLocal, engine


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.Level).count() > 0:
            print("[i] Data level sudah ada - seed dilewati "
                  "(hapus pyquest.db kalau mau isi ulang).")
            return

        # ---- Level + soal ----
        for lv in LEVELS:
            level = models.Level(
                urutan=lv["id"],
                nama=lv["nama"],
                emoji=lv.get("emoji", ""),
                materi=lv.get("materi", ""),
                is_boss=lv.get("boss", False),
                pool=lv.get("pool"),
                hp=lv.get("hp"),
                timer=lv.get("timer"),
            )
            db.add(level)
            db.flush()  # supaya level.id terisi sebelum menautkan soal

            for i, qq in enumerate(lv.get("questions", [])):
                ans = qq.get("ans")
                if isinstance(ans, str):       # 'mc' menyimpan 1 jawaban string
                    ans = [ans]                # samakan jadi list agar seragam
                db.add(models.Question(
                    level_id=level.id,
                    urutan=i,
                    tipe=qq["t"],
                    q=qq["q"],
                    hint=qq.get("hint", ""),
                    opts=qq.get("opts"),
                    ans=ans,
                    code=qq.get("code"),
                    starter=qq.get("starter"),
                    expected=qq.get("expected"),
                ))

        # ---- Lencana ----
        for key, (emoji, nama, syarat) in BADGES.items():
            db.add(models.Badge(key=key, emoji=emoji, nama=nama, syarat=syarat))

        db.commit()
        print("[OK] Seed selesai:",
              db.query(models.Level).count(), "level,",
              db.query(models.Question).count(), "soal,",
              db.query(models.Badge).count(), "lencana.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
