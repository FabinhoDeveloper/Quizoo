import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { RealtimeChannel } from '@supabase/supabase-js'
import logo from '../assets/quizoo-logo.png'
import { answerStyle } from '../lib/answerStyles'
import { closeChannel, getGame, openGameChannel, submitAnswer, type GameRow } from '../lib/game'

export function PlayPage() {
  const { gameId = '' } = useParams()
  const navigate = useNavigate()

  const playerId = (typeof history !== 'undefined' && (history.state?.usr?.playerId as string)) || localStorage.getItem(`quizoo_player_${gameId}`) || ''
  const nickname = localStorage.getItem(`quizoo_nick_${gameId}`) || 'Você'

  const [game, setGame] = useState<GameRow | null>(null)
  const [selected, setSelected] = useState<{ position: number; answerId: string } | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!playerId) {
      navigate('/join')
      return
    }
    let active = true
    getGame(gameId).then(({ game }) => {
      if (active && game) setGame(game)
    })
    channelRef.current = openGameChannel(gameId, {
      onGame: (g) => setGame(g),
    })
    return () => {
      active = false
      closeChannel(channelRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const payload = game?.current_payload ?? null
  const answeredThis = selected?.position === payload?.position

  function answer(answerId: string) {
    if (!payload || answeredThis) return
    const responseMs = Math.max(0, Date.now() - new Date(payload.startedAt).getTime())
    setSelected({ position: payload.position, answerId })
    void submitAnswer(gameId, playerId, payload.questionId, answerId, responseMs)
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

        {status === 'reveal' && game?.reveal && (
          <RevealCard
            gotIt={selected != null && selected.answerId === game.reveal.correctAnswerId}
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
