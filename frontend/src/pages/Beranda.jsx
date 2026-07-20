import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const C = {
  bg: '#0A0C18', card: '#141830', line: '#282e4d',
  text: '#ECEDFF', muted: '#9096c2',
  violet: '#8B5CF6', cyan: '#26D6EE', gold: '#FBBF24',
  grad: 'linear-gradient(120deg,#8B5CF6,#7C6BFF 45%,#26D6EE)',
}

function Fitur({ emoji, judul, desc }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: '1.4rem' }}>
      <div style={{ fontSize: '1.8rem' }}>{emoji}</div>
      <div style={{ fontWeight: 700, margin: '.5rem 0 .3rem' }}>{judul}</div>
      <div style={{ color: C.muted, fontSize: '.88rem', lineHeight: 1.55 }}>{desc}</div>
    </div>
  )
}

export default function Beranda() {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh',
                  fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
      <style>{`
        @keyframes bgGlow{0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)}50%{opacity:.65;transform:translate(-50%,-50%) scale(1.15)}}
        @keyframes floatIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .grad{background:${C.grad};-webkit-background-clip:text;background-clip:text;color:transparent}
        .cta{display:inline-flex;align-items:center;gap:.5rem;font-weight:700;border-radius:12px;
             padding:.85rem 1.6rem;font-size:1rem;text-decoration:none;transition:transform .08s,filter .15s}
        .cta:hover{filter:brightness(1.08)} .cta:active{transform:translateY(1px)}
        .cta-primary{background:${C.grad};color:#0A0C18}
        .cta-ghost{border:1px solid ${C.line};color:${C.text}}
        .cta-ghost:hover{border-color:${C.violet}}
        .reveal{animation:floatIn .6s ease both}
        @media(prefers-reduced-motion:reduce){.reveal,.glowb{animation:none}}
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    maxWidth: 1080, margin: '0 auto', padding: '1.1rem 1.4rem' }}>
        <Logo size={32} wordSize="1.2rem" />
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <Link to="/login" className="cta cta-ghost" style={{ padding: '.55rem 1.1rem', fontSize: '.9rem' }}>Masuk</Link>
          <Link to="/register" className="cta cta-primary" style={{ padding: '.55rem 1.1rem', fontSize: '.9rem' }}>Daftar</Link>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ position: 'relative', overflow: 'hidden', textAlign: 'center',
                       padding: '4.5rem 1.4rem 4rem' }}>
        <div className="glowb" style={{ position: 'absolute', top: '30%', left: '50%', width: 420, height: 200,
          transform: 'translate(-50%,-50%)', background: C.violet, filter: 'blur(90px)',
          borderRadius: '50%', opacity: .5, animation: 'bgGlow 6s ease-in-out infinite', pointerEvents: 'none' }} />
        <div className="reveal" style={{ position: 'relative', maxWidth: 720, margin: '0 auto',
                                         display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.4rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem',
            letterSpacing: '.14em', textTransform: 'uppercase', color: C.cyan, fontWeight: 700,
            border: `1px solid ${C.line}`, borderRadius: 999, padding: '.35rem .9rem' }}>
            ⚡ Platform belajar gamified
          </span>
          <h1 style={{ fontSize: 'clamp(2.4rem,7vw,3.8rem)', fontWeight: 800, lineHeight: 1.08,
                       letterSpacing: '-.03em', margin: 0, textWrap: 'balance' }}>
            Belajar rasa <span className="grad">petualangan</span>.
          </h1>
          <p style={{ color: C.muted, fontSize: '1.1rem', lineHeight: 1.6, margin: 0, maxWidth: 560 }}>
            Taklukkan peta level, kalahkan boss, kumpulkan XP — sambil belajar & ikut tes harian.
            Satu platform buat <b style={{ color: C.text }}>semua mata kuliah</b>, dikelola dosenmu sendiri.
          </p>
          <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '.3rem' }}>
            <Link to="/register" className="cta cta-primary">Mulai Bertualang →</Link>
            <Link to="/login" className="cta cta-ghost">Aku sudah punya akun</Link>
          </div>
        </div>
      </header>

      {/* FITUR */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '1rem 1.4rem 3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
          <Fitur emoji="🗺️" judul="Mode Latihan" desc="Peta petualangan berlevel, boss battle, nyawa, combo, XP, koin, dan lencana. Belajar jadi nagih." />
          <Fitur emoji="📝" judul="Tes Harian" desc="Dosen jadwalkan tes terjadwal & dinilai. Soal acak tiap mahasiswa — anti-contek." />
          <Fitur emoji="🐍" judul="Kode di Browser" desc="Tulis & jalankan kode Python sungguhan langsung di browser lewat Lab Kode. Tanpa install." />
          <Fitur emoji="🏫" judul="Multi-Kelas" desc="Tiap dosen punya kelasnya sendiri. Gabung pakai kode, konten tiap kelas terpisah rapi." />
          <Fitur emoji="📚" judul="Materi" desc="Dosen kirim materi teks atau upload PDF — langsung bisa dibaca mahasiswa di kelasnya." />
          <Fitur emoji="📊" judul="Pantau Nilai" desc="Dosen lihat progres & nilai tiap mahasiswa. Mahasiswa lihat peringkat di papan skor." />
        </div>
      </section>

      {/* DUA PERAN */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '1rem 1.4rem 3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem' }}>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '1.8rem' }}>
            <div style={{ fontSize: '2rem' }}>🎓</div>
            <h3 style={{ margin: '.5rem 0' }}>Buat Mahasiswa</h3>
            <p style={{ color: C.muted, lineHeight: 1.6, marginTop: 0 }}>
              Gabung kelas pakai kode dari dosen, main petualangannya, kerjakan tes, dan pantau nilaimu — belajar sambil seru-seruan.
            </p>
            <Link to="/register" className="grad" style={{ fontWeight: 700, textDecoration: 'none' }}>Daftar sebagai mahasiswa →</Link>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '1.8rem' }}>
            <div style={{ fontSize: '2rem' }}>👨‍🏫</div>
            <h3 style={{ margin: '.5rem 0' }}>Buat Dosen</h3>
            <p style={{ color: C.muted, lineHeight: 1.6, marginTop: 0 }}>
              Bikin kelasmu, susun bank soal, kirim materi, jadwalkan tes, dan pantau nilai mahasiswa — semua dari satu dashboard.
            </p>
            <Link to="/register" className="grad" style={{ fontWeight: 700, textDecoration: 'none' }}>Daftar sebagai dosen →</Link>
          </div>
        </div>
      </section>

      {/* CTA AKHIR */}
      <section style={{ textAlign: 'center', padding: '2rem 1.4rem 4rem' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', background: 'linear-gradient(180deg,rgba(139,92,246,.14),rgba(38,214,238,.05))',
          border: `1px solid ${C.line}`, borderRadius: 22, padding: '2.6rem 1.6rem' }}>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 .5rem', letterSpacing: '-.02em' }}>Siap naik level? 🚀</h2>
          <p style={{ color: C.muted, margin: '0 0 1.4rem' }}>Gratis, langsung main. Tinggal daftar.</p>
          <Link to="/register" className="cta cta-primary">Daftar Sekarang</Link>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '1.6rem 1.4rem', textAlign: 'center',
                       color: C.muted, fontSize: '.85rem' }}>
        <Logo size={22} wordSize="1rem" /> <span style={{ marginLeft: '.5rem' }}>· Belajar rasa petualangan</span>
      </footer>
    </div>
  )
}
