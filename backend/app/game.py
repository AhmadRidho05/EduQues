"""
Logika gamifikasi — di-port dari PyQuest (utils.py + database.py).
XP menentukan level pemain; level pemain menentukan gelar (rank).
"""

XP_PER_LEVEL = 150

# Hadiah saat pertama kali menyelesaikan sebuah level
XP_REWARD = 50
COIN_REWARD = 20
COIN_PER_STAR = 10


def level_info(xp: int):
    """(level_pemain, xp_dalam_level, kebutuhan_per_level)."""
    xp = max(0, int(xp))
    return xp // XP_PER_LEVEL + 1, xp % XP_PER_LEVEL, XP_PER_LEVEL


def rank_title(player_level: int) -> str:
    """Gelar pemain berdasarkan level."""
    if player_level >= 15:
        return "🐉 Legenda Kode"
    if player_level >= 10:
        return "🧙 Penyihir Python"
    if player_level >= 6:
        return "⚔️ Ksatria Skrip"
    if player_level >= 3:
        return "🛡️ Petualang Kode"
    return "🌱 Pemula Pemberani"
