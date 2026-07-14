"""
Konfigurasi aplikasi. Nilai bisa ditimpa lewat file .env atau environment.

Contoh .env:
    DATABASE_URL=sqlite:///./pyquest.db
    SECRET_KEY=kunci-rahasia-yang-panjang
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Development pakai SQLite (satu file). Saat deploy ganti ke PostgreSQL:
    #   postgresql+psycopg://user:pass@host:5432/nama_db
    DATABASE_URL: str = "sqlite:///./pyquest.db"

    # Dipakai untuk menandatangani token login (Fase 2). Wajib diganti di produksi.
    # Minimal 32 karakter (rekomendasi HMAC-SHA256).
    SECRET_KEY: str = "dev-secret-pyquest-ganti-di-produksi-dengan-kunci-acak-panjang"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
