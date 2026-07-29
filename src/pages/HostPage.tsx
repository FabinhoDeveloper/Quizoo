import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { answerStyle } from '../lib/answerStyles'
import { PulseTimer } from '../components/PulseTimer'
import { MuteButton } from '../components/MuteButton'
import { Avatar } from '../components/Avatar'
import { Podium } from '../components/Podium'
import { GameQr } from '../components/GameQr'
import { themeBg } from '../lib/themes'
import { musicVariantFor, playFanfare, playTick, primeAudio, setMusicVariant, startMusic, stopMusic } from '../lib/sound'
import {
  awardPoints,
  closeChannel,
  fetchQuestionAnswers,
  getGame,
  getPlayers,
  hostEnd,
  hostReveal,
  hostShowQuestion,
  loadHostQuestions,
  normalizeText,
  openGameChannel,
  persistScores,
  shuffleArray,
  type HostQuestion,
  type LeaderRow,
  type Player,
} from '../lib/game'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Phase = 'loading' | 'lobby' | 'question' | 'reveal' | 'ended'

export function HostPage() {
  const { gameId = '' } = useParams()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('loading')
  const [pin, setPin] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [index, setIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([])
  const [pollResult, setPollResult] = useState<{ label: string; count: number }[]>([])
  const [theme, setTheme] = useState('default')
  const [error, setError] = useState<string | null>(null)

  const questionsRef = useRef<HostQuestion[]>([])
  const scoresRef = useRef<Map<string, LeaderRow>>(new Map())
  const streaksRef = useRef<Map<string, number>>(new Map())
  const answeredRef = useRef<Set<string>>(new Set())
  const playersRef = useRef<Player[]>([])
  const indexRef = useRef(0)
  const phaseRef = useRef<Phase>('loading')
  const startRef = useRef(0)
  const lastTickRef = useRef(99)
  const channelRef = useRef<RealtimeChannel | null>(null)

  function setPhaseSafe(p: Phase) {
    phaseRef.current = p
    setPhase(p)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      const { game, error } = await getGame(gameId)
      if (!active) return
      if (error || !game) {
        setError(error ?? 'Jogo não encontrado.')
        setPhaseSafe('lobby')
        return
      }
      setPin(game.pin)
      setTheme(game.theme ?? 'default')
      questionsRef.current = await loadHostQuestions(game.quiz_id)
      const roster = await getPlayers(gameId)
      if (!active) return
      playersRef.current = roster
      setPlayers(roster)
      roster.forEach((p) => scoresRef.current.set(p.id, { playerId: p.id, nickname: p.nickname, score: 0, avatar: p.avatar }))

      channelRef.current = openGameChannel(gameId, {
        onPlayerJoin: (p) => {
          if (!scoresRef.current.has(p.id)) {
            scoresRef.current.set(p.id, { playerId: p.id, nickname: p.nickname, score: 0, avatar: p.avatar })
            playersRef.current = [...playersRef.current, p]
            setPlayers([...playersRef.current])
          }
        },
        onAnswer: (a) => {
          if (phaseRef.current !== 'question') return
          if (answeredRef.current.has(a.player_id)) return
          answeredRef.current.add(a.player_id)
          setAnsweredCount(answeredRef.current.size)
          if (playersRef.current.length > 0 && answeredRef.current.size >= playersRef.current.length) {
            void reveal()
          }
        },
      })
      setPhaseSafe('lobby')
    })()
    return () => {
      active = false
      closeChannel(channelRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  // rede de segurança: enquanto no lobby, atualiza a lista de jogadores por polling
  useEffect(() => {
    if (phase !== 'lobby') return
    const id = setInterval(async () => {
      const roster = await getPlayers(gameId)
      playersRef.current = roster
      setPlayers(roster)
      roster.forEach((p) => {
        if (!scoresRef.current.has(p.id))
          scoresRef.current.set(p.id, { playerId: p.id, nickname: p.nickname, score: 0 })
      })
    }, 2000)
    return () => clearInterval(id)
  }, [phase, gameId])

  // timer da pergunta
  useEffect(() => {
    if (phase !== 'question') return
    const q = questionsRef.current[indexRef.current]
    lastTickRef.current = 99
    const id = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const left = Math.ceil(q.time_limit - elapsed)
      if (left <= 0) {
        clearInterval(id)
        void reveal()
      } else {
        setTimeLeft(left)
        if (left <= 5 && left !== lastTickRef.current) {
          lastTickRef.current = left
          playTick(true)
        }
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index])

  // pódio: confete + fanfarra
  useEffect(() => {
    if (phase !== 'ended') return
    stopMusic()
    playFanfare()
    const end = Date.now() + 2500
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#8e46f0', '#feb703', '#01cfab', '#fe4881'] })
      confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#8e46f0', '#feb703', '#01cfab', '#fe4881'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [phase])

  // para a música ao sair
  useEffect(() => () => stopMusic(), [])

  async function showQuestion(i: number) {
    const q = questionsRef.current[i]
    // Embaralha as alternativas AGORA (aleatório de verdade). O host mostra
    // essa ordem e envia a mesma no payload, então jogadores veem igual.
    if (q.type !== 'typed') q.options = shuffleArray(q.options)
    answeredRef.current = new Set()
    setAnsweredCount(0)
    const startedAt = Date.now()
    startRef.current = startedAt
    setTimeLeft(q.time_limit)
    indexRef.current = i
    setIndex(i)
    setPhaseSafe('question')
    await hostShowQuestion(gameId, q, i, questionsRef.current.length, new Date(startedAt).toISOString())
  }

  async function reveal() {
    if (phaseRef.current !== 'question') return
    setPhaseSafe('reveal')
    const q = questionsRef.current[indexRef.current]
    const isMulti = q.type === 'multiple' && !!q.multiple
    const correctId = q.type === 'typed' ? null : q.options.find((o) => o.is_correct)?.id ?? null
    const correctIds = q.options.filter((o) => o.is_correct).map((o) => o.id)
    const correctKey = [...correctIds].sort().join(',')
    // Em "digite a resposta", TODA alternativa marcada is_correct é uma resposta aceita.
    const acceptedLabels = q.options.filter((o) => o.is_correct).map((o) => o.label)
    const acceptedNorms = acceptedLabels.map((l) => normalizeText(l))
    const answers = await fetchQuestionAnswers(gameId, q.id)
    const seen = new Set<string>()
    const votes = new Map<string, number>() // answer_id -> votos (enquete)
    answers.forEach((a) => {
      if (seen.has(a.player_id)) return // conta só a 1ª resposta de cada jogador
      seen.add(a.player_id)
      if (a.answer_id) votes.set(a.answer_id, (votes.get(a.answer_id) ?? 0) + 1)
      const row = scoresRef.current.get(a.player_id)
      if (!row) return
      // Enquete não tem resposta certa: 0 pontos.
      if (q.type === 'poll') return
      const correct = isMulti
        ? (a.typed_text ?? '')
            .split(',')
            .filter(Boolean)
            .sort()
            .join(',') === correctKey
        : q.type === 'typed'
          ? acceptedNorms.includes(normalizeText(a.typed_text ?? ''))
          : a.answer_id === correctId
      const base = awardPoints(correct, q.points, a.response_ms ?? q.time_limit * 1000, q.time_limit * 1000)
      // Sequência de acertos: a partir do 3º acerto seguido, ganha bônus (até +500).
      const prevStreak = streaksRef.current.get(a.player_id) ?? 0
      const streak = correct ? prevStreak + 1 : 0
      streaksRef.current.set(a.player_id, streak)
      const streakBonus = correct && streak >= 3 ? Math.min(500, (streak - 2) * 100) : 0
      row.score += base + streakBonus
    })
    // Quem não respondeu perde a sequência (exceto em enquete).
    if (q.type !== 'poll') {
      scoresRef.current.forEach((_, pid) => {
        if (!seen.has(pid)) streaksRef.current.set(pid, 0)
      })
    }
    const board = [...scoresRef.current.values()].sort((a, b) => b.score - a.score)
    setLeaderboard(board)
    await persistScores(board)
    const pollCounts =
      q.type === 'poll' ? q.options.map((o) => ({ label: o.label, count: votes.get(o.id) ?? 0 })) : undefined
    setPollResult(pollCounts ?? [])
    await hostReveal(gameId, correctId, board, {
      acceptedAnswers: q.type === 'typed' ? acceptedLabels : undefined,
      correctAnswerIds: isMulti ? correctIds : undefined,
      explanation: q.type === 'poll' ? null : q.explanation ?? null,
      pollCounts,
    })
  }

  async function next() {
    const nextIndex = indexRef.current + 1
    if (nextIndex < questionsRef.current.length) {
      await showQuestion(nextIndex)
    } else {
      const board = [...scoresRef.current.values()].sort((a, b) => b.score - a.score)
      setLeaderboard(board)
      setPhaseSafe('ended')
      await hostEnd(gameId, board)
    }
  }

  // ---------- render ----------
  if (phase === 'loading') {
    return <Centered>Preparando o jogo…</Centered>
  }

  const q = questionsRef.current[index]
  const isLast = index >= questionsRef.current.length - 1

  return (
    <div className="min-h-screen" style={{ background: themeBg(theme) }}>
      <MuteButton className="fixed top-4 right-4 z-50 shadow-md" />
      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-6">
        {error && <p className="text-pink font-semibold mb-4">{error}</p>}

        {phase === 'lobby' && (
          <div className="text-center">
            <p className="font-display font-semibold text-purple text-[15px] uppercase tracking-wide mb-2">
              Entre em quizoo.com.br e use o PIN
            </p>
            <div className="flex flex-wrap items-center justify-center gap-5 mb-6">
              <div className="inline-block bg-white border-4 border-ink rounded-[24px] px-8 sm:px-14 py-6 shadow-[0_10px_0_#3A0E86]">
                <div className="text-[13px] font-bold text-muted tracking-[0.2em]">GAME PIN</div>
                <div className="font-display font-semibold text-[52px] sm:text-[72px] tracking-[0.15em] text-heading leading-none">
                  {pin}
                </div>
              </div>
              {pin && <GameQr pin={pin} />}
            </div>

            <p className="font-display font-semibold text-[20px] text-heading mb-4">
              {players.length} {players.length === 1 ? 'jogador' : 'jogadores'} na sala
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8 min-h-[40px]">
              {players.map((p) => (
                <span
                  key={p.id}
                  className="flex items-center gap-2 bg-lilac text-purple-dark font-bold text-[15px] pl-1.5 pr-4 py-1.5 rounded-full quizoo-pop"
                >
                  <Avatar avatar={p.avatar} name={p.nickname} size={30} />
                  {p.nickname}
                </span>
              ))}
              {players.length === 0 && <span className="text-muted">Aguardando jogadores entrarem…</span>}
            </div>

            <button
              type="button"
              onClick={() => {
                primeAudio()
                setMusicVariant(musicVariantFor(gameId))
                startMusic()
                void showQuestion(0)
              }}
              disabled={questionsRef.current.length === 0}
              className="font-display font-semibold rounded-2xl px-10 py-4 text-[20px] text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 disabled:opacity-60 cursor-pointer"
            >
              Iniciar jogo →
            </button>
          </div>
        )}

        {phase === 'question' && q && (
          <div key={index} className="quizoo-slidein">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-semibold text-body">
                Pergunta {index + 1} / {questionsRef.current.length}
              </span>
              <PulseTimer secondsLeft={timeLeft} total={q.time_limit} size={72} />
            </div>
            <div className="bg-white border-2 border-border rounded-[22px] p-6 sm:p-10 text-center mb-5">
              <h2 className="font-display font-semibold text-[26px] sm:text-[34px] text-heading">{q.prompt}</h2>
              {q.image_url && (
                <img
                  src={q.image_url}
                  alt=""
                  className="mx-auto mt-5 rounded-[16px] max-h-[300px] w-auto object-contain"
                />
              )}
            </div>
            {q.type === 'typed' ? (
              <div className="bg-white border-2 border-dashed border-purple/40 rounded-[16px] px-5 py-8 text-center">
                <div className="text-4xl mb-2">⌨️</div>
                <p className="font-display font-semibold text-body text-[17px]">
                  Os alunos estão digitando a resposta no celular…
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((o, i) => {
                  const s = answerStyle(i)
                  return (
                    <div
                      key={o.id}
                      className="flex items-center gap-3 rounded-[16px] px-5 py-5 text-white"
                      style={{ background: s.bg }}
                    >
                      <span className="text-[24px]">{s.shape}</span>
                      <span className="font-display font-semibold text-[19px]">{o.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
            <p className="text-center font-display font-semibold text-body mt-6">
              {answeredCount} de {players.length} responderam
            </p>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => reveal()}
                className="font-display font-semibold rounded-[14px] px-6 py-3 text-purple bg-lilac hover:bg-[#e2d2ff] cursor-pointer"
              >
                Revelar agora
              </button>
            </div>
          </div>
        )}

        {phase === 'reveal' && q && (
          <div>
            <h2 className="font-display font-semibold text-[24px] text-heading text-center mb-4">
              {q.type === 'poll'
                ? 'Resultado da enquete'
                : q.type === 'typed'
                  ? 'Respostas aceitas'
                  : q.multiple
                    ? 'Respostas certas'
                    : 'Resposta certa'}
            </h2>
            {q.type === 'poll' ? (
              <div className="flex flex-col gap-3 mb-8 max-w-[520px] mx-auto">
                {pollResult.map((r, i) => {
                  const s = answerStyle(i)
                  const total = pollResult.reduce((sum, x) => sum + x.count, 0) || 1
                  const pct = Math.round((r.count / total) * 100)
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-[15px] font-display font-semibold text-heading mb-1">
                        <span>
                          {s.shape} {r.label}
                        </span>
                        <span>
                          {r.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-3.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.bg }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : q.type === 'typed' ? (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {q.options
                  .filter((o) => o.is_correct)
                  .map((o) => (
                    <span
                      key={o.id}
                      className="bg-teal-light text-teal font-display font-semibold text-[17px] px-5 py-3 rounded-[14px] border-2 border-teal"
                    >
                      ✓ {o.label}
                    </span>
                  ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {q.options.map((o, i) => {
                  const s = answerStyle(i)
                  const correct = o.is_correct
                  return (
                    <div
                      key={o.id}
                      className={`flex items-center justify-between gap-3 rounded-[16px] px-5 py-4 text-white transition-opacity ${
                        correct ? '' : 'opacity-40'
                      }`}
                      style={{ background: s.bg }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[22px]">{s.shape}</span>
                        <span className="font-display font-semibold text-[18px]">{o.label}</span>
                      </div>
                      {correct && (
                        <span className="bg-white text-teal w-7 h-7 rounded-full grid place-items-center font-bold">✓</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {q.explanation && q.type !== 'poll' && (
              <div className="max-w-[620px] mx-auto mb-6 bg-blue-light/60 border-2 border-blue/30 rounded-[16px] px-5 py-4 text-left">
                <p className="font-display font-semibold text-[14px] text-blue mb-1">💡 Por quê?</p>
                <p className="text-[15px] text-heading">{q.explanation}</p>
              </div>
            )}

            <Leaderboard rows={leaderboard} />

            <div className="text-center mt-8">
              <button
                type="button"
                onClick={() => next()}
                className="font-display font-semibold rounded-2xl px-10 py-4 text-[19px] text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 cursor-pointer"
              >
                {isLast ? 'Ver pódio 🏆' : 'Próxima pergunta →'}
              </button>
            </div>
          </div>
        )}

        {phase === 'ended' && (
          <div className="text-center">
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="font-display font-semibold text-[34px] text-heading mb-8">Pódio final</h2>
            <Podium rows={leaderboard} />
            <div className="max-w-[440px] mx-auto mt-8">
              <Leaderboard rows={leaderboard.slice(3)} startRank={4} />
            </div>
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => navigate(`/results/${gameId}`)}
                className="font-display font-semibold rounded-2xl px-7 py-3.5 text-purple bg-lilac hover:bg-[#e2d2ff] cursor-pointer"
              >
                📊 Ver relatório
              </button>
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="font-display font-semibold rounded-2xl px-8 py-3.5 text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 cursor-pointer"
              >
                Voltar ao painel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Leaderboard({ rows, startRank = 1 }: { rows: LeaderRow[]; startRank?: number }) {
  if (rows.length === 0) return null
  return (
    <div className="max-w-[440px] mx-auto flex flex-col gap-2">
      {rows.map((r, i) => (
        <div
          key={r.playerId}
          className="flex items-center justify-between bg-white border-2 border-border rounded-[14px] px-4 py-2.5"
        >
          <span className="flex items-center gap-2.5 font-display font-semibold text-heading">
            <span className="text-muted w-5 text-right">{startRank + i}</span>
            <Avatar avatar={r.avatar} name={r.nickname} size={32} />
            {r.nickname}
          </span>
          <span className="font-display font-semibold text-purple">{r.score}</span>
        </div>
      ))}
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center">
      <p className="font-display font-semibold text-body text-lg">{children}</p>
    </div>
  )
}
