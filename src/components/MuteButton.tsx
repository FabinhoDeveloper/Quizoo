import { useState } from 'react'
import { isMuted, setMuted, startMusic } from '../lib/sound'

export function MuteButton({ className = '' }: { className?: string }) {
  const [muted, setM] = useState(isMuted())
  return (
    <button
      type="button"
      onClick={() => {
        const next = !muted
        setMuted(next)
        setM(next)
        if (!next) startMusic()
      }}
      aria-label={muted ? 'Ativar som' : 'Silenciar'}
      title={muted ? 'Ativar som' : 'Silenciar'}
      className={`w-10 h-10 grid place-items-center rounded-full bg-white border-2 border-border text-[18px] hover:border-purple/50 cursor-pointer ${className}`}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
