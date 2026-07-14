"""
Konten game PyQuest: 10 level petualangan belajar dasar Python.

Jenis soal:
  'mc'    = pilihan ganda            (opts + ans)
  'out'   = tebak output kode        (code + ans, jawaban diketik)
  'blank' = lengkapi kode yang kosong (code + ans, jawaban diketik)
  'code'  = tulis kode sungguhan!     (starter + expected, dijalankan Python)

Level boss ('boss': True) mengambil soal acak dari level 'pool',
dengan batas waktu per soal dan HP monster yang harus dihabiskan.
"""

LEVELS = [
    # ================= LEVEL 1 =================
    {
        'id': 1, 'nama': 'Desa Variabel', 'emoji': '🌱',
        'materi': (
            "Variabel adalah 'kotak' untuk menyimpan data.\n"
            "print() dipakai untuk menampilkan sesuatu ke layar.\n\n"
            "    nama = \"Budi\"      # variabel berisi teks\n"
            "    umur = 20          # variabel berisi angka\n"
            "    print(nama)        # tampilkan isi variabel\n"
            "    # ini komentar, tidak dijalankan"
        ),
        'questions': [
            {'t': 'mc', 'q': "Perintah untuk menampilkan teks ke layar?",
             'opts': ['print', 'echo', 'show', 'tampil'], 'ans': 'print',
             'hint': "Sudah ada di materi — p _ _ _ t"},
            {'t': 'mc', 'q': "Cara yang BENAR membuat variabel nama berisi teks Budi?",
             'opts': ['nama = "Budi"', 'var nama = "Budi"',
                      'nama == "Budi"', 'buat nama = "Budi"'],
             'ans': 'nama = "Budi"',
             'hint': "Python tidak butuh kata 'var'. Satu tanda = untuk mengisi."},
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'x = 5\ny = 2\nprint(x + y)', 'ans': ['7'],
             'hint': "Jumlahkan isi kedua variabel."},
            {'t': 'blank', 'q': "Lengkapi bagian ____ agar teks tampil di layar:",
             'code': '____("Halo Dunia")', 'ans': ['print'],
             'hint': "Fungsi andalan untuk menampilkan."},
            {'t': 'mc', 'q': "Simbol untuk menulis komentar satu baris di Python?",
             'opts': ['#', '//', '<!--', '**'], 'ans': '#',
             'hint': "Bukan seperti di C atau HTML."},
            {'t': 'code',
             'q': "Misi: buat variabel bernama kota berisi teks Bandung, "
                  "lalu tampilkan dengan print.",
             'starter': '# 1. buat variabel kota\n\n# 2. tampilkan dengan print\n',
             'expected': 'Bandung',
             'hint': 'kota = "Bandung" lalu print(kota)'},
        ],
    },
    # ================= LEVEL 2 =================
    {
        'id': 2, 'nama': 'Hutan Tipe Data', 'emoji': '🔢',
        'materi': (
            "Setiap data punya tipe:\n"
            "  int   = bilangan bulat     -> 10\n"
            "  float = bilangan desimal   -> 3.14\n"
            "  str   = teks (string)      -> \"halo\"\n"
            "  bool  = benar/salah        -> True / False\n\n"
            "    umur = int(\"20\")    # ubah teks jadi angka\n"
            "    print(type(3.14))   # cek tipe data"
        ),
        'questions': [
            {'t': 'mc', 'q': "Apa tipe data dari 3.14?",
             'opts': ['float', 'int', 'str', 'bool'], 'ans': 'float',
             'hint': "Ada koma desimalnya."},
            {'t': 'mc', 'q': 'Apa tipe data dari "123" (pakai tanda kutip)?',
             'opts': ['str', 'int', 'float', 'angka'], 'ans': 'str',
             'hint': "Tanda kutip = teks, walau isinya angka."},
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'print(int("5") + 5)', 'ans': ['10'],
             'hint': 'int("5") mengubah teks menjadi angka 5.'},
            {'t': 'blank', 'q': "Lengkapi agar teks berubah menjadi angka bulat:",
             'code': 'umur = ____("20")', 'ans': ['int'],
             'hint': "Tiga huruf, kependekan dari integer."},
            {'t': 'out', 'q': "Apa output kode ini? (// = pembagian bulat)",
             'code': 'print(7 // 2)', 'ans': ['3'],
             'hint': "Hasil bagi dibulatkan ke bawah, sisa dibuang."},
            {'t': 'code',
             'q': 'Misi: ubah teks "100" menjadi angka, tambahkan 25, '
                  'lalu print hasilnya.',
             'starter': 'teks = "100"\n# ubah jadi angka, tambah 25, lalu print\n',
             'expected': '125',
             'hint': 'print(int(teks) + 25)'},
        ],
    },
    # ================= LEVEL 3 =================
    {
        'id': 3, 'nama': 'Gunung Operator', 'emoji': '➕',
        'materi': (
            "Operator matematika:\n"
            "  +  -  *  /   -> tambah, kurang, kali, bagi\n"
            "  ** -> pangkat        (2 ** 3 = 8)\n"
            "  %  -> sisa bagi      (10 % 3 = 1)\n"
            "  // -> pembagian bulat (7 // 2 = 3)\n\n"
            "Operator perbandingan menghasilkan True/False:\n"
            "  >  <  >=  <=  ==  !="
        ),
        'questions': [
            {'t': 'mc', 'q': "Operator untuk mencari SISA pembagian?",
             'opts': ['%', '/', '//', 'mod'], 'ans': '%',
             'hint': "Disebut juga modulo."},
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'print(2 ** 3)', 'ans': ['8'],
             'hint': "** artinya pangkat."},
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'print(10 % 3)', 'ans': ['1'],
             'hint': "10 dibagi 3 = 3 sisa berapa?"},
            {'t': 'blank', 'q': "Isi operator agar hasilnya 15:",
             'code': 'print(5 ____ 3)', 'ans': ['*'],
             'hint': "5 apa 3 yang hasilnya 15?"},
            {'t': 'out', 'q': "Apa output kode ini? (jawab True atau False)",
             'code': 'print(5 > 3)', 'ans': ['True', 'true'],
             'hint': "Apakah 5 lebih besar dari 3?"},
            {'t': 'code',
             'q': "Misi: hitung luas persegi panjang dengan panjang 8 dan "
                  "lebar 5, lalu print hasilnya.",
             'starter': 'panjang = 8\nlebar = 5\n# hitung luas lalu print\n',
             'expected': '40',
             'hint': 'print(panjang * lebar)'},
        ],
    },
    # ================= LEVEL 4 =================
    {
        'id': 4, 'nama': 'Sungai String', 'emoji': '🔤',
        'materi': (
            "String (teks) punya banyak kemampuan:\n"
            "    kata = \"python\"\n"
            "    print(kata.upper())   # PYTHON\n"
            "    print(len(kata))      # 6 (panjang teks)\n"
            "    print(kata[0])        # p (huruf pertama, index 0)\n"
            "    print(\"Halo\" + \" Kamu\") # gabung teks\n"
            "    print(\"ha\" * 3)        # hahaha"
        ),
        'questions': [
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'nama = "python"\nprint(nama.upper())', 'ans': ['PYTHON'],
             'hint': "upper() membuat semua huruf menjadi kapital."},
            {'t': 'mc', 'q': 'Berapa hasil len("koding")?',
             'opts': ['6', '5', '7', 'error'], 'ans': '6',
             'hint': "Hitung jumlah hurufnya."},
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'kata = "belajar"\nprint(kata[0])', 'ans': ['b'],
             'hint': "Index dimulai dari 0."},
            {'t': 'blank', 'q': "Isi operator untuk MENGGABUNGKAN dua teks:",
             'code': 'print("Halo" ____ " Dunia")', 'ans': ['+'],
             'hint': "Operator yang sama dengan penjumlahan."},
            {'t': 'mc', 'q': 'Apa hasil dari "ha" * 3?',
             'opts': ['hahaha', 'ha3', 'ha ha ha', 'error'], 'ans': 'hahaha',
             'hint': "String bisa diulang dengan perkalian."},
            {'t': 'code',
             'q': 'Misi: buat variabel berisi teks "python", lalu print '
                  'versi HURUF BESAR-nya.',
             'starter': 'bahasa = "python"\n# print versi huruf besar\n',
             'expected': 'PYTHON',
             'hint': 'print(bahasa.upper())'},
        ],
    },
    # ================= LEVEL 5: BOSS =================
    {
        'id': 5, 'nama': 'BOSS: Monster Bug', 'emoji': '👹',
        'boss': True, 'pool': [1, 2, 3, 4], 'hp': 8, 'timer': 20,
        'materi': (
            "GRRRR! Monster Bug menghadang jalanmu!\n\n"
            "Jawab soal dengan BENAR untuk menyerangnya (-1 HP).\n"
            "Jawaban salah atau kehabisan waktu = kamu kehilangan 1 nyawa.\n\n"
            "Soal diambil acak dari Level 1-4. Waktu 20 detik per soal.\n"
            "Kalahkan dia sebelum nyawamu habis!"
        ),
    },
    # ================= LEVEL 6 =================
    {
        'id': 6, 'nama': 'Lembah List', 'emoji': '📋',
        'materi': (
            "List menyimpan banyak data sekaligus:\n"
            "    buah = [\"apel\", \"jeruk\", \"mangga\"]\n"
            "    print(buah[0])      # apel  (index mulai 0)\n"
            "    print(len(buah))    # 3\n"
            "    buah.append(\"duku\") # tambah di akhir\n"
            "    angka = [1, 2, 3]\n"
            "    print(sum(angka))   # 6 (jumlahkan isi)"
        ),
        'questions': [
            {'t': 'mc', 'q': "Cara yang BENAR membuat list berisi dua buah?",
             'opts': ['buah = ["apel", "jeruk"]', 'buah = ("apel": "jeruk")',
                      'buah = {"apel" + "jeruk"}', 'list buah = apel, jeruk'],
             'ans': 'buah = ["apel", "jeruk"]',
             'hint': "List memakai kurung siku [ ]."},
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'angka = [1, 2, 3]\nprint(len(angka))', 'ans': ['3'],
             'hint': "len() menghitung banyaknya isi."},
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'buah = ["apel", "jeruk", "mangga"]\nprint(buah[1])',
             'ans': ['jeruk'],
             'hint': "Ingat, index dimulai dari 0!"},
            {'t': 'blank', 'q': "Lengkapi agar 4 masuk ke akhir list:",
             'code': 'angka = [1, 2, 3]\nangka.____(4)', 'ans': ['append'],
             'hint': "Artinya 'menambahkan di belakang'."},
            {'t': 'mc', 'q': "Index untuk mengambil elemen PERTAMA sebuah list?",
             'opts': ['0', '1', '-1', 'first'], 'ans': '0',
             'hint': "Python mulai menghitung dari..."},
            {'t': 'code',
             'q': "Misi: buat list berisi angka 1, 2, 3 lalu print "
                  "jumlah totalnya dengan sum().",
             'starter': '# buat list lalu print sum-nya\n',
             'expected': '6',
             'hint': 'angka = [1, 2, 3] lalu print(sum(angka))'},
        ],
    },
    # ================= LEVEL 7 =================
    {
        'id': 7, 'nama': 'Gerbang Percabangan', 'emoji': '🔀',
        'materi': (
            "if/else membuat program bisa MEMILIH:\n"
            "    nilai = 80\n"
            "    if nilai >= 75:\n"
            "        print(\"lulus\")\n"
            "    else:\n"
            "        print(\"remedial\")\n\n"
            "Ingat: == untuk membandingkan, = untuk mengisi variabel.\n"
            "Jangan lupa titik dua (:) dan indentasi (menjorok)!"
        ),
        'questions': [
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'x = 10\nif x > 5:\n    print("besar")\nelse:\n    print("kecil")',
             'ans': ['besar'],
             'hint': "Apakah 10 > 5?"},
            {'t': 'mc', 'q': "Operator untuk mengecek 'apakah sama dengan'?",
             'opts': ['==', '=', '!=', '==='], 'ans': '==',
             'hint': "Satu = untuk mengisi, dua = untuk membandingkan."},
            {'t': 'blank', 'q': "Isi operator agar lulus saat nilai 75 KE ATAS:",
             'code': 'if nilai ____ 75:\n    print("lulus")', 'ans': ['>='],
             'hint': "Lebih besar ATAU sama dengan."},
            {'t': 'mc', 'q': "Kata kunci yang dijalankan saat kondisi if SALAH?",
             'opts': ['else', 'otherwise', 'not', 'salah'], 'ans': 'else',
             'hint': "Bahasa Inggris dari 'selain itu'."},
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'umur = 15\nif umur >= 17:\n    print("boleh")\nelse:\n    print("belum")',
             'ans': ['belum'],
             'hint': "15 belum mencapai 17."},
            {'t': 'code',
             'q': "Misi: variabel umur berisi 20. Jika umur >= 17 print "
                  "boleh, selain itu print belum.",
             'starter': 'umur = 20\n# tulis if/else di sini\n',
             'expected': 'boleh',
             'hint': "if umur >= 17: (baris baru, menjorok) print(\"boleh\")"},
        ],
    },
    # ================= LEVEL 8 =================
    {
        'id': 8, 'nama': 'Pusaran Perulangan', 'emoji': '🔁',
        'materi': (
            "Loop mengulang perintah tanpa capek:\n"
            "    for i in range(3):\n"
            "        print(i)        # 0, 1, 2\n\n"
            "    range(5)      -> 0,1,2,3,4 (5 tidak ikut!)\n"
            "    range(1, 4)   -> 1,2,3\n"
            "    break         -> menghentikan loop lebih awal"
        ),
        'questions': [
            {'t': 'out', 'q': 'Berapa KALI kata "hai" dicetak? (jawab angka)',
             'code': 'for i in range(4):\n    print("hai")', 'ans': ['4'],
             'hint': "range(4) menghasilkan 4 angka: 0,1,2,3."},
            {'t': 'mc', 'q': "range(5) menghasilkan deretan angka...",
             'opts': ['0,1,2,3,4', '1,2,3,4,5', '0,1,2,3,4,5', '5,4,3,2,1'],
             'ans': '0,1,2,3,4',
             'hint': "Mulai dari 0, angka batas tidak ikut."},
            {'t': 'blank', 'q': "Lengkapi kata kunci perulangannya:",
             'code': '____ i in range(10):\n    print(i)', 'ans': ['for'],
             'hint': "Loop 'untuk setiap'..."},
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'total = 0\nfor i in range(1, 4):\n    total = total + i\nprint(total)',
             'ans': ['6'],
             'hint': "1 + 2 + 3 = ?"},
            {'t': 'mc', 'q': "Perintah untuk MENGHENTIKAN loop lebih awal?",
             'opts': ['break', 'stop', 'exit', 'end'], 'ans': 'break',
             'hint': "Artinya 'memutus'."},
            {'t': 'code',
             'q': "Misi: gunakan for untuk mencetak angka 1 sampai 5 "
                  "(satu angka per baris).",
             'starter': '# gunakan for + range\n',
             'expected': '1\n2\n3\n4\n5',
             'hint': 'for i in range(1, 6): print(i)'},
        ],
    },
    # ================= LEVEL 9 =================
    {
        'id': 9, 'nama': 'Kastil Fungsi', 'emoji': '🧰',
        'materi': (
            "Fungsi = kumpulan perintah yang bisa dipanggil berulang:\n"
            "    def sapa(nama):          # def = membuat fungsi\n"
            "        print(\"Halo\", nama)\n\n"
            "    def tambah(a, b):\n"
            "        return a + b         # return = mengembalikan nilai\n\n"
            "    sapa(\"Budi\")             # memanggil fungsi\n"
            "    print(tambah(2, 3))      # 5"
        ),
        'questions': [
            {'t': 'mc', 'q': "Kata kunci untuk MEMBUAT fungsi?",
             'opts': ['def', 'function', 'fungsi', 'make'], 'ans': 'def',
             'hint': "Kependekan dari 'define'."},
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'def sapa():\n    print("halo")\n\nsapa()', 'ans': ['halo'],
             'hint': "Fungsi dipanggil satu kali di baris terakhir."},
            {'t': 'blank', 'q': "Lengkapi agar fungsi MENGEMBALIKAN hasil:",
             'code': 'def tambah(a, b):\n    ____ a + b', 'ans': ['return'],
             'hint': "Artinya 'kembalikan'."},
            {'t': 'out', 'q': "Apa output kode ini?",
             'code': 'def kali2(x):\n    return x * 2\n\nprint(kali2(6))',
             'ans': ['12'],
             'hint': "6 dikali 2."},
            {'t': 'mc', 'q': "a dan b pada def tambah(a, b) disebut...",
             'opts': ['parameter', 'variabel global', 'komentar', 'modul'],
             'ans': 'parameter',
             'hint': "Tempat menampung nilai yang dikirim ke fungsi."},
            {'t': 'code',
             'q': "Misi: buat fungsi kuadrat(x) yang mengembalikan x kali x, "
                  "lalu print kuadrat(7).",
             'starter': '# def kuadrat(x): ...\n\n# lalu print(kuadrat(7))\n',
             'expected': '49',
             'hint': 'def kuadrat(x): return x * x'},
        ],
    },
    # ================= LEVEL 10: BOSS FINAL =================
    {
        'id': 10, 'nama': 'RAJA BUG', 'emoji': '🐉',
        'boss': True, 'pool': [6, 7, 8, 9], 'hp': 10, 'timer': 15,
        'materi': (
            "Inilah dia... RAJA BUG, penguasa segala error!\n\n"
            "10 HP. Waktu hanya 15 detik per soal.\n"
            "Soal diambil acak dari Level 6-9 (list, if/else, loop, fungsi).\n\n"
            "Kalahkan dia dan jadilah MASTER PYTHON! 🏆"
        ),
    },
]

# ==================== LENCANA ====================
BADGES = {
    'first':   ('🥾', 'Langkah Pertama', 'Selesaikan Level 1'),
    'perfect': ('💎', 'Tanpa Cela', 'Selesaikan level dengan 3 bintang'),
    'boss1':   ('⚔️', 'Pemburu Bug', 'Kalahkan Monster Bug (Level 5)'),
    'loop':    ('🌀', 'Ahli Loop', 'Selesaikan Pusaran Perulangan'),
    'stars15': ('🌟', 'Kolektor Bintang', 'Kumpulkan 15 bintang'),
    'rich':    ('💰', 'Sultan Koin', 'Miliki 500 koin'),
    'lab':     ('🧪', 'Ilmuwan Kode', 'Jalankan kode di Lab 5 kali'),
    'master':  ('🏆', 'Master Python', 'Kalahkan RAJA BUG (Level 10)'),
}
