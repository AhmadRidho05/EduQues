import { useId } from 'react'

// Logo EduQuest: badge kristal (chevron "naik level") + wordmark gradasi.
export default function Logo({ size = 30, word = true, wordSize = '1.15rem' }) {
  const raw = useId().replace(/[:]/g, '')
  const gv = `gv${raw}`, gf = `gf${raw}`, gb = `gb${raw}`
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.55rem' }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="EduQuest"
           style={{ filter: 'drop-shadow(0 3px 10px rgba(124,107,255,.5))', flexShrink: 0 }}>
        <defs>
          <linearGradient id={gv} x1="6" y1="3" x2="58" y2="61" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA" /><stop offset=".5" stopColor="#7C6BFF" /><stop offset="1" stopColor="#26D6EE" />
          </linearGradient>
          <linearGradient id={gf} x1="32" y1="10" x2="32" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#232a52" /><stop offset="1" stopColor="#131734" />
          </linearGradient>
          <linearGradient id={gb} x1="22" y1="18" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C4B5FD" /><stop offset="1" stopColor="#5EEAD4" />
          </linearGradient>
        </defs>
        <polygon points="32,2.5 57.6,17.3 57.6,46.7 32,61.5 6.4,46.7 6.4,17.3"
                 fill={`url(#${gf})`} stroke={`url(#${gv})`} strokeWidth="2.6" strokeLinejoin="round" />
        <polygon points="32,2.5 57.6,17.3 32,32 6.4,17.3" fill="#ffffff" opacity=".07" />
        <path d="M22.5 30 L32 20.5 L41.5 30" stroke={`url(#${gb})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22.5 41 L32 31.5 L41.5 41" stroke={`url(#${gv})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
        <circle cx="47" cy="15" r="1.9" fill="#FBBF24" />
      </svg>
      {word && (
        <span style={{ fontWeight: 800, fontSize: wordSize, letterSpacing: '-.02em', color: 'var(--text)' }}>
          Edu<span style={{
            background: 'linear-gradient(120deg,#8B5CF6,#7C6BFF 45%,#26D6EE)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>Quest</span>
        </span>
      )}
    </span>
  )
}
