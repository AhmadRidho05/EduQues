"""
Skema Pydantic: bentuk data yang masuk (request) & keluar (response) API.
FastAPI memakai ini untuk validasi otomatis + dokumentasi di /docs.
"""

from pydantic import BaseModel, ConfigDict, EmailStr


# ==================== AUTH ====================
class UserCreate(BaseModel):
    nama: str
    email: EmailStr
    password: str
    role: str = "mahasiswa"  # 'mahasiswa' | 'dosen'


class UserOut(BaseModel):
    id: int
    nama: str
    email: EmailStr
    role: str
    xp: int
    koin: int
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ==================== LEVEL & SOAL ====================
class QuestionOut(BaseModel):
    """Soal yang dikirim ke frontend. Sengaja TIDAK menyertakan kunci
    jawaban (`ans`/`expected`) supaya tidak bisa dicontek dari browser."""
    id: int
    tipe: str
    q: str
    hint: str
    opts: list | None = None
    code: str | None = None
    starter: str | None = None
    model_config = ConfigDict(from_attributes=True)


class LevelOut(BaseModel):
    id: int
    urutan: int
    nama: str
    emoji: str
    is_boss: bool
    unlocked: bool
    stars: int
    jumlah_soal: int


class LevelDetail(BaseModel):
    id: int
    urutan: int
    nama: str
    emoji: str
    materi: str
    is_boss: bool
    hp: int | None = None
    timer: int | None = None
    questions: list[QuestionOut]


# ==================== JAWABAN & PROGRES ====================
class AnswerIn(BaseModel):
    question_id: int
    jawaban: str


class AnswerResult(BaseModel):
    benar: bool
    jawaban_benar: str | None = None  # ditampilkan setelah dijawab (untuk belajar)


class CompleteIn(BaseModel):
    stars: int
    score: int


class CompleteResult(BaseModel):
    xp: int
    koin: int
    player_level: int
    rank: str
    new_badges: list[str]


class LeaderboardRow(BaseModel):
    nama: str
    xp: int
    player_level: int
    rank: str
