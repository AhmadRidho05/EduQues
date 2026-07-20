// Confetti sederhana tanpa library — hamburan kertas warna dari atas layar.
const WARNA = ['#8B5CF6', '#FBBF24', '#22C55E', '#EF4444', '#38BDF8', '#F472B6']

export function burstConfetti(jumlah = 44) {
  const box = document.createElement('div')
  box.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden'
  document.body.appendChild(box)

  for (let i = 0; i < jumlah; i++) {
    const p = document.createElement('span')
    const c = WARNA[i % WARNA.length]
    const size = 7 + Math.random() * 7
    p.style.cssText =
      `position:absolute;top:-16px;left:${Math.random() * 100}%;` +
      `width:${size}px;height:${size}px;background:${c};border-radius:2px`
    box.appendChild(p)

    const dx = (Math.random() - 0.5) * 160
    const dur = 1400 + Math.random() * 1400
    p.animate(
      [
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${dx}px, ${window.innerHeight + 60}px) rotate(${Math.random() * 720}deg)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${dx}px, ${window.innerHeight + 90}px)`, opacity: 0 },
      ],
      { duration: dur, easing: 'cubic-bezier(.15,.5,.4,1)' }
    )
  }
  setTimeout(() => box.remove(), 3000)
}
