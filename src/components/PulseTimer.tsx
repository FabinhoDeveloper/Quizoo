/** Cronômetro circular pulsante, ligado ao tempo escolhido pelo criador. */
export function PulseTimer({ secondsLeft, total, size = 96 }: { secondsLeft: number; total: number; size?: number }) {
  const s = Math.max(0, Math.ceil(secondsLeft))
  const frac = total > 0 ? Math.max(0, Math.min(1, secondsLeft / total)) : 0
  const urgent = s <= 5
  const color = urgent ? '#fe4881' : s <= 10 ? '#feb703' : '#8e46f0'
  const inner = size - 14

  return (
    <div
      className="grid place-items-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${color} ${frac * 360}deg, #eeeaf6 0deg)`,
        animation: `quizoo-pulse ${urgent ? '0.55s' : '1.2s'} ease-in-out infinite`,
        boxShadow: urgent ? `0 0 0 6px ${color}22, 0 0 22px ${color}66` : `0 4px 14px ${color}33`,
        transition: 'box-shadow 0.3s',
      }}
    >
      <div
        className="grid place-items-center bg-cream rounded-full"
        style={{ width: inner, height: inner }}
      >
        <span className="font-display font-semibold leading-none" style={{ color, fontSize: size * 0.36 }}>
          {s}
        </span>
      </div>
    </div>
  )
}
