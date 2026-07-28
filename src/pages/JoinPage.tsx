import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import logo from '../assets/quizoo-logo.png'
import { joinGame } from '../lib/game'
import { PRESET_AVATARS, avatarBg, randomAvatar } from '../lib/avatars'

export function JoinPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [pin, setPin] = useState(() => (params.get('pin') ?? '').replace(/\D/g, '').slice(0, 6))
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState<string>(() => randomAvatar())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (pin.length < 6) return setError('Digite o PIN de 6 dígitos.')
    if (!nickname.trim()) return setError('Escolha um apelido.')

    setBusy(true)
    const { gameId, playerId, error } = await joinGame(pin, nickname, avatar)
    setBusy(false)
    if (error || !gameId) {
      setError(error ?? 'Não foi possível entrar.')
      return
    }
    localStorage.setItem(`quizoo_player_${gameId}`, playerId)
    localStorage.setItem(`quizoo_nick_${gameId}`, nickname.trim())
    localStorage.setItem(`quizoo_avatar_${gameId}`, avatar)
    navigate(`/play/${gameId}`, { state: { playerId } })
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 py-12">
      <div className="w-full max-w-[400px]">
        <Link to="/" className="flex justify-center mb-8">
          <img src={logo} alt="Quizoo" className="h-14 w-auto" />
        </Link>

        <form
          onSubmit={handleSubmit}
          className="bg-white border-2 border-border rounded-[26px] px-9 py-10 shadow-[0_10px_40px_rgba(90,31,158,0.08)]"
        >
          <h1 className="font-display font-semibold text-[26px] text-heading text-center mb-6">Entrar em um jogo</h1>

          <div className="flex flex-col gap-4">
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="PIN do jogo"
              inputMode="numeric"
              className="rounded-[14px] border-2 border-border px-4 py-4 text-center text-[26px] tracking-[0.3em] font-display font-semibold text-heading outline-none focus:border-purple"
            />
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="Seu apelido"
              className="rounded-[14px] border-2 border-border px-4 py-3 text-[15px] text-heading outline-none focus:border-purple"
            />

            <div>
              <p className="text-[13px] font-display font-semibold text-body mb-2">Escolha seu avatar</p>
              <div className="grid grid-cols-8 gap-1.5">
                {PRESET_AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
                    className={`aspect-square rounded-full grid place-items-center text-[20px] border-2 transition ${
                      avatar === a ? 'border-purple scale-110' : 'border-transparent hover:border-border'
                    }`}
                    style={{ background: avatarBg(a) }}
                    aria-label={`Avatar ${a}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-[14px] text-pink font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="font-display font-semibold rounded-2xl px-[34px] py-[15px] text-[18px] text-ink bg-yellow shadow-[0_5px_0_#B98400] hover:translate-y-0.5 hover:shadow-[0_3px_0_#B98400] transition-[transform,box-shadow] disabled:opacity-60 cursor-pointer"
            >
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
          </div>
        </form>

        <p className="text-center text-[14px] text-muted mt-6">
          <Link to="/login" className="hover:text-purple font-semibold">
            Quer criar quizzes? Entrar como criador →
          </Link>
        </p>
      </div>
    </div>
  )
}
