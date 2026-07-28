import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { RealtimeChannel } from '@supabase/supabase-js'
import logo from '../assets/quizoo-logo.png'
import { answerStyle } from '../lib/answerStyles'
import { closeChannel, getGame, normalizeText, openGameChannel, submitAnswer, type GameRow } from '../lib/game'

export function PlayPage() {
  const { gameId = '' } = useParams()
  const navigate = useNavigate()

  const playerId = (typeof history !== 'undefined' && (history.state?.usr?.playerId as string)) || localStorage.getItem(`quizoo_player_${gameId}`) || ''
  const nickname = localStorage.getItem(`quizoo_nick_${gameId}`) || 'Você'

  const [game, setGame] = useState<GameRow | null>(null)
  const [selected, setSelected] = useState<{ position: number; answerId: string } | null>(() => {
    try {
      const raw = localStorage.getItem(`quizoo_ans_${gameId}`)
      return raw ? (JSON.parse(raw) as { position: number; answerId: string }) : null
    } catch {
      return null
    }
  })
  const [typedInput, setTypedInput] = useState('')
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!playerId) {
      navigate('/join')
      return
    }
    let active = true
    const resync = () => getGame(gameId).then(({ game }) => active && game && setGame(game))
    resync()
    channelRef.current = openGameChannel(gameId, { onGame: (g) => setGame(g) })

    // rede de segurança: se o tempo real cair, ressincroniza sozinho
    const poll = setInterval(resync, 4000)
    const onVisible = () => document.visibilityState === 'visible' && resync()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', resync)

    return () => {
      active = false
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', resync)
      closeChannel(channelRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const payload = game?.current_payload ?? null
  const answeredThis = selected?.position === payload?.position

  function submitChoice(answerId: string, typed?: string) {
    if (!payload || answeredThis) return
    const responseMs = Math.max(0, Date.now() - new Date(payload.startedAt).getTime())
    const choice = { position: payload.position, answerId }
    setSelected(choice)
    try {
      localStorage.setItem(`quizoo_ans_${gameId}`, JSON.stringify(choice))
    } catch {
      /* ignora */
    }
    // Em "digite a resposta" o answer_id vai nulo; o texto vai em typed_text.
    void submitAnswer(gameId, playerId, payload.questionId, typed !== undefined ? null : answerId, responseMs, typed)
  }

  function answer(answerId: string) {
    submitChoice(answerId)
  }

  function answerTyped() {
    const t = typedInput.trim()
    if (t) submitChoice(t, t)
  }

  const status = game?.status ?? 'lobby'

  return (
    <div className="min-h-screen">
      <div className="max-w-[560px] mx-auto px-4 py-6">
        <Link to="/" className="flex justify-center mb-6">
          <img src={logo} alt="Quizoo" className="h-10 w-auto" />
        </Link>

        {status === 'lobby' && (
          <Card>
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="font-display font-semibold text-[24px] text-heading mb-1">Você está no jogo!</h1>
            <p className="text-body">
              Apelido: <strong className="text-purple">{nickname}</strong>
            </p>
            <p className="text-body mt-3">Aguarde o host iniciar a partida…</p>
          </Card>
        )}

        {status === 'question' && payload && (
          <div>
            <div className="text-center mb-4">
              <span className="font-display font-semibold text-body">
                Pergunta {payload.position + 1} / {payload.total}
              </span>
            </div>
            <div className="bg-white border-2 border-border rounded-[20px] p-5 text-center mb-4">
              <h2 className="font-display font-semibold text-[20px] text-heading">{payload.prompt}</h2>
            </div>

            {answeredThis ? (
              <Card>
                <div className="text-4xl mb-2">✅</div>
                <p className="font-display font-semibold text-[18px] text-heading">Resposta enviada!</p>
                <p className="text-body mt-1">Aguarde os outros jogadores…</p>
              </Card>
            ) : payload.type === 'typed' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  answerTyped()
                }}
                className="flex flex-col gap-3"
              >
                <input
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder="Digite sua resposta…"
                  autoFocus
                  className="rounded-[14px] border-2 border-border px-4 py-4 text-[18px] text-heading outline-none focus:border-purple"
                />
                <button
                  type="submit"
                  className="font-display font-semibold rounded-2xl px-8 py-4 text-[18px] text-ink bg-yellow shadow-[0_5px_0_#B98400] hover:translate-y-0.5 cursor-pointer"
                >
                  Enviar resposta
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {payload.options.map((o, i) => {
                  const s = answerStyle(i)
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => answer(o.id)}
                      className="flex items-center gap-3 rounded-[16px] px-5 py-6 text-white text-left hover:brightness-105 active:scale-[0.98] transition cursor-pointer"
                      style={{ background: s.bg }}
                    >
                      <span className="text-[26px]">{s.shape}</span>
                      <span className="font-display font-semibold text-[18px]">{o.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {status === 'reveal' && game?.reveal?.pollCounts && (
          <Card>
            <div className="text-4xl mb-2">📊</div>
            <p className="font-display font-semibold text-[18px] text-heading mb-4">Resultado da enquete</p>
            <div className="flex flex-col gap-2.5 text-left">
              {game.reveal.pollCounts.map((r, i) => {
                const s = answerStyle(i)
                const total = game.reveal!.pollCounts!.reduce((sum, x) => sum + x.count, 0) || 1
                const pct = Math.round((r.count / total) * 100)
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[14px] font-display font-semibold text-heading mb-1">
                      <span>
                        {s.shape} {r.label}
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-3 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.bg }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {status === 'reveal' && game?.reveal && !game.reveal.pollCounts && (
          <RevealCard
            gotIt={
              selected != null &&
              (game.reveal.correctAnswerId != null
                ? selected.answerId === game.reveal.correctAnswerId
                : (game.reveal.acceptedAnswers ?? []).some(
                    (a) => normalizeText(a) === normalizeText(selected.answerId),
                  ))
            }
            answered={selected != null}
            myScore={game.reveal.leaderboard.find((r) => r.playerId === playerId)?.score ?? 0}
            myRank={rankOf(game.reveal.leaderboard, playerId)}
            total={game.reveal.leaderboard.length}
          />
        )}

        {status === 'ended' && game?.reveal && (
          <Card>
            <div className="text-5xl mb-3">🏆</div>
            <h1 className="font-display font-semibold text-[26px] text-heading mb-2">Fim de jogo!</h1>
            <p className="text-body text-[17px]">
              Você ficou em{' '}
              <strong className="text-purple">
                {rankOf(game.reveal.leaderboard, playerId)}º de {game.reveal.leaderboard.length}
              </strong>
            </p>
            <p className="font-display font-semibold text-purple text-[30px] mt-2">
              {game.reveal.leaderboard.find((r) => r.playerId === playerId)?.score ?? 0} pts
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-6 font-display font-semibold rounded-2xl px-7 py-3 text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 cursor-pointer"
            >
              Voltar ao início
            </button>
          </Card>
        )}
      </div>
    </div>
  )
}

function rankOf(board: { playerId: string }[], playerId: string) {
  const i = board.findIndex((r) => r.playerId === playerId)
  return i < 0 ? board.length : i + 1
}

function RevealCard({
  gotIt,
  answered,
  myScore,
  myRank,
  total,
}: {
  gotIt: boolean
  answered: boolean
  myScore: number
  myRank: number
  total: number
}) {
  return (
    <Card>
      {!answered ? (
        <>
          <div className="text-5xl mb-2">⏰</div>
          <p className="font-display font-semibold text-[20px] text-heading">Você não respondeu a tempo</p>
        </>
      ) : gotIt ? (
        <>
          <div className="text-5xl mb-2">🎉</div>
          <p className="font-display font-semibold text-[22px] text-teal">Acertou!</p>
        </>
      ) : (
        <>
          <div className="text-5xl mb-2">😬</div>
          <p className="font-display font-semibold text-[22px] text-pink">Não foi dessa vez</p>
        </>
      )}
      <p className="text-body mt-3">
        {myScore} pts · {myRank}º de {total}
      </p>
    </Card>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border-2 border-border rounded-[22px] p-8 text-center shadow-[0_10px_40px_rgba(90,31,158,0.06)]">
      {children}
    </div>
  )
}
