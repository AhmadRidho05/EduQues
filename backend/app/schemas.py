"""
Skema Pydantic: bentuk data yang masuk (request) & keluar (response) API.
FastAPI memakai ini untuk validasi otomatis + dokumentasi di /docs.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


# ==================== AUTH ====================
class UserCreate(BaseModel):
    nama: str
    email: EmailStr
    password: str
    role: str = "mahasiswa"  # 'mahasiswa' | 'dosen'


class LupaResetIn(BaseModel):
    """Lupa password: cukup email + kata sandi baru."""
    email: EmailStr
    password_baru: str


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
    lives: int = 3
    soal_ditanya: int = 0


class LevelDetail(BaseModel):
    id: int
    urutan: int
    nama: str
    emoji: str
    materi: str
    is_boss: bool
    lives: int = 3
    jumlah_soal: int = 0        # jumlah soal yang akan ditanyakan (setelah acak/ambil-N)
    hp: int | None = None
    timer: int | None = None
    questions: list[QuestionOut]


# ==================== JAWABAN & PROGRES ====================
class AnswerIn(BaseModel):
    question_id: int
    jawaban: str


class AttemptAnswerIn(BaseModel):
    """Jawaban untuk soal yang sedang aktif dalam sebuah percobaan level.
    Tidak perlu question_id — server tahu soal ke-berapa dari data percobaan."""
    jawaban: str


class BossAnswerIn(BaseModel):
    """Jawaban pertarungan boss (server-authoritative).
    `habis=True` dikirim saat waktu per-soal habis (dihitung salah tanpa cek)."""
    jawaban: str = ""
    habis: bool = False


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


# ==================== DOSEN (kelola soal) ====================
class QuestionAdmin(BaseModel):
    """Soal versi dosen — LENGKAP dengan kunci jawaban (ans/expected)."""
    id: int
    level_id: int | None = None
    tes_id: int | None = None
    urutan: int
    tipe: str
    q: str
    hint: str = ""
    opts: list | None = None
    ans: list | None = None
    code: str | None = None
    starter: str | None = None
    expected: str | None = None
    model_config = ConfigDict(from_attributes=True)


class LevelSettingsIn(BaseModel):
    """Pengaturan level yang bisa diubah dosen: jumlah nyawa & jumlah soal
    yang ditanyakan (0 = semua soal, N = ambil N acak dari bank)."""
    lives: int
    soal_ditanya: int = 0
    nama: str | None = None     # ganti judul bab (opsional)
    materi: str | None = None   # ganti materi bab (opsional)


class MaterialTextIn(BaseModel):
    """Materi berupa teks yang ditulis dosen."""
    judul: str
    konten: str


class KelasCreate(BaseModel):
    """Data untuk dosen membuat kelas baru."""
    matkul: str
    kampus: str = ""
    prodi: str = ""
    semester: str = ""
    kelas_label: str = ""
    # True = isi dengan contoh kurikulum Python (PyQuest). Default: kelas kosong.
    pakai_template: bool = False


class GabungIn(BaseModel):
    """Mahasiswa gabung kelas dengan kode."""
    kode: str


class TesCreate(BaseModel):
    """Dosen membuat tes terjadwal."""
    judul: str
    jumlah_soal: int = 10
    waktu_mulai: datetime
    waktu_selesai: datetime


class TesJawabIn(BaseModel):
    jawaban: str


class QuestionIn(BaseModel):
    """Data untuk membuat/mengubah soal."""
    tipe: str  # 'mc' | 'out' | 'blank' | 'code'
    q: str
    hint: str = ""
    opts: list | None = None
    ans: list | None = None
    code: str | None = None
    starter: str | None = None
    expected: str | None = None
    urutan: int = 0


class TarikSoalIn(BaseModel):
    """Pilihan level/bab peta yang ingin disalin soal-soalnya ke tes."""
    level_ids: list[int]
