/**
 * Ikon SVG inline bergaya garis (mirip Lucide/Phosphor) — ditulis sendiri
 * supaya tidak menambah dependensi. Semua ikon memakai viewBox 24x24,
 * mewarisi warna teks lewat `currentColor`, dan tebal garisnya seragam.
 *
 * Pemakaian:  <Icon name="peta" />   <Icon name="api" size={18} />
 */
const P = {
  // --- navigasi mahasiswa ---
  peta: ['M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z', 'M9 4v14', 'M15 6v14'],
  tes: ['M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z',
        'M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2',
        'm9 13 2 2 4-4'],
  materi: ['M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z', 'M8 7h7', 'M8 11h5'],
  lab: ['M9 3h6', 'M10 3v6.5L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.5V3',
        'M7.5 14h9'],
  skor: ['M8 4h8v5a4 4 0 0 1-8 0V4Z', 'M8 6H5v1a3 3 0 0 0 3 3', 'M16 6h3v1a3 3 0 0 1-3 3',
         'M12 13v4', 'M9 21h6', 'M10 17h4v4h-4z'],
  // --- navigasi dosen ---
  dasbor: ['M4 4h7v7H4z', 'M13 4h7v4h-7z', 'M13 10h7v10h-7z', 'M4 13h7v7H4z'],
  soal: ['M4 5a2 2 0 0 1 2-2h8l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z',
         'M14 3v5h5', 'M9.5 12a1.8 1.8 0 1 1 2.5 1.7c-.6.3-1 .8-1 1.5', 'M11 18h.01'],
  jadwal: ['M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z',
           'M4 9h16', 'M8 3v4', 'M16 3v4', 'm9 14 2 2 4-4'],
  unggah: ['M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3', 'M12 3v12', 'm7.5 7.5 4.5-4.5 4.5 4.5'],
  mahasiswa: ['M15 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20', 'M8.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7',
              'M17 14.5a4 4 0 0 1 5 3.9V20', 'M15.5 4a3.5 3.5 0 0 1 0 6.8'],
  // --- umum ---
  profil: ['M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
  kelas: ['m2 8 10-4 10 4-10 4Z', 'M6 11v4.5c0 1.4 2.8 2.8 6 2.8s6-1.4 6-2.8V11', 'M21 8.5V14'],
  terang: ['M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10', 'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4',
           'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'],
  gelap: ['M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z'],
  keluar: ['M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3', 'M16 17l5-5-5-5', 'M21 12H9'],
  koin: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18', 'M12 7v10', 'M14.5 9.5a2.6 2.6 0 0 0-5 .8c0 2.6 5 1.4 5 4a2.6 2.6 0 0 1-5 .7'],
  bintang: ['m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z'],
  kilat: ['m13 2-9 12h7l-1 8 9-12h-7z'],
  lencana: ['M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12', 'm8.5 13.5-1.5 8 5-3 5 3-1.5-8'],
  api: ['M12 21c3.9 0 6.5-2.5 6.5-6 0-4.5-4-5.5-4-9.5C11 7 12 9 9.5 11 8.5 9.5 8 8.5 8 7c-1.6 1.6-2.5 3.7-2.5 6 0 3.5 2.6 8 6.5 8Z'],
  tambah: ['M12 5v14', 'M5 12h14'],
  hapus: ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13', 'M9 7V4h6v3'],
  ubah: ['m4 20 4.5-1L20 7.5 16.5 4 5 15.5Z', 'M15 5.5 18.5 9'],
  cek: ['m5 13 4 4L19 7'],
  silang: ['M6 6l12 12', 'M18 6 6 18'],
  kanan: ['m9 6 6 6-6 6'],
  kiri: ['m15 6-6 6 6 6'],
  ulang: ['M20 11a8 8 0 1 0-2.3 6.3', 'M20 5v6h-6'],
  cari: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16', 'm21 21-4.3-4.3'],
  info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18', 'M12 11v5', 'M12 8h.01'],
  kunci: ['M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z',
          'M8 10V7a4 4 0 0 1 8 0v3'],
  nyawa: ['M12 20s-7-4.4-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6C19 15.6 12 20 12 20Z'],
  waktu: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18', 'M12 7v5l3 2'],
  dokumen: ['M6 3h8l5 5v13H6z', 'M14 3v5h5', 'M9 13h6', 'M9 17h4'],
}

export default function Icon({ name, size = 18, stroke = 1.8, style, className }) {
  const d = P[name]
  if (!d) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" style={{ flexShrink: 0, ...style }} className={className}>
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}
