import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import logo from '../assets/quizoo-logo.png'
import {
  fetchAllGameAnswers,
  getGame,
  getPlayers,
  loadHostQuestions,
  normalizeText,
  type Player,
} from '../lib/game'

interface QuestionStat {
  prompt: string
  answered: number
  correct: number
  isPoll: boolean
}

export function ResultsPage() {
  const { gameId = '' } = useParams()
  const [players, setPlayers] = useState<Player[]>([])
  const [stats, setStats] = useState<QuestionStat[]>([])
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { game, error } = await getGame(gameId)
      if (!active) return
      if (error || !game) {
        setError(error ?? 'Partida não encontrada.')
        setLoading(false)
        return
      }
      const [questions, roster, answers] = await Promise.all([
        loadHostQuestions(game.quiz_id),
        getPlayers(gameId),
        fetchAllGameAnswers(gameId),
      ])
      if (!active) return

      const sortedPlayers = [...roster].sort((a, b) => b.score - a.score)
      setPlayers(sortedPlayers)
      setTotalPlayers(roster.length)

      const questionStats: QuestionStat[] = questions.map((q) => {
        const correctId = q.type === 'typed' ? null : q.options.find((o) => o.is_correct)?.id
        const acceptedNorms = q.options.filter((o) => o.is_correct).map((o) => normalizeText(o.label))
        const forQ = answers.filter((a) => a.question_id === q.id)
        const byPlayer = new Map<string, { answer_id: string | null; typed_text: string | null }>()
        forQ.forEach((a) => {
          if (!byPlayer.has(a.player_id)) byPlayer.set(a.player_id, { answer_id: a.answer_id, typed_text: a.typed_text })
        })
        let correct = 0
        byPlayer.forEach((ans) => {
          const ok =
            q.type === 'typed' ? acceptedNorms.includes(normalizeText(ans.typed_text ?? '')) : ans.answer_id === correctId
          if (ok) correct++
        })
        return { prompt: q.prompt, answered: byPlayer.size, correct, isPoll: q.type === 'poll' }
      })
      setStats(questionStats)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [gameId])

  return (
    <div className="min-h-screen">
      <nav className="max-w-[820px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/app">
          <img src={logo} alt="Quizoo" className="h-11 w-auto block" />
        </Link>
        <Link to="/app" className="font-display font-semibold text-body hover:text-heading">
          ← Painel
        </Link>
      </nav>

      <main className="max-w-[820px] mx-auto px-4 sm:px-8 pt-4 pb-20">
        <h1 className="font-display font-semibold text-[30px] sm:text-[36px] text-heading">Relatório da partida</h1>
        <p className="text-body text-[15px] mt-1 mb-7">Veja o ranking e onde a turma acertou ou travou.</p>

        {loading ? (
          <p className="text-body font-semibold py-10 text-center">Carregando relatório…</p>
        ) : error ? (
          <p className="text-pink font-semibold">{error}</p>
        ) : (
          <>
            {/* Ranking */}
            <h2 className="font-display font-semibold text-[20px] text-heading mb-3">
              Ranking ({totalPlayers} {totalPlayers === 1 ? 'jogador' : 'jogadores'})
            </h2>
            <div className="flex flex-col gap-2 mb-10">
              {players.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-white border-2 border-border rounded-[14px] px-4 py-3"
                >
                  <span className="font-display font-semibold text-heading">
                    {i + 1}. {p.nickname}
                  </span>
                  <span className="font-display font-semibold text-purple">{p.score} pts</span>
                </div>
              ))}
              {players.length === 0 && <p className="text-muted">Nenhum jogador participou.</p>}
            </div>

            {/* Acerto por pergunta */}
            <h2 className="font-display font-semibold text-[20px] text-heading mb-3">Acerto por pergunta</h2>
            <div className="flex flex-col gap-4">
              {stats.map((s, i) => {
                if (s.isPoll) {
                  return (
                    <div key={i} className="bg-white border-2 border-border rounded-[16px] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-display font-semibold text-heading text-[15px]">
                          {i + 1}. {s.prompt}
                        </p>
                        <span className="text-[12px] font-bold uppercase tracking-wide text-purple-dark bg-lilac px-2 py-0.5 rounded-full shrink-0">
                          Enquete
                        </span>
                      </div>
                      <p className="text-[13px] text-muted mt-1.5">{s.answered} responderam (sem resposta certa)</p>
                    </div>
                  )
                }
                const pct = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0
                const color = pct >= 70 ? '#01cfab' : pct >= 40 ? '#feb703' : '#fe4881'
                return (
                  <div key={i} className="bg-white border-2 border-border rounded-[16px] p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-display font-semibold text-heading text-[15px]">
                        {i + 1}. {s.prompt}
                      </p>
                      <span className="font-display font-semibold shrink-0" style={{ color }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <p className="text-[13px] text-muted mt-1.5">
                      {s.correct} de {s.answered} acertaram
                    </p>
                  </div>
                )
              })}
              {stats.length === 0 && <p className="text-muted">Sem perguntas registradas.</p>}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
