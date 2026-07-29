import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import logo from '../assets/quizoo-logo.png'
import { answerStyle } from '../lib/answerStyles'
import { normalizeText } from '../lib/game'
import { getQuizForEdit, type QuestionDraft } from '../lib/quizzes'
import { themeBg } from '../lib/themes'
import confetti from 'canvas-confetti'

// Modo estudo: o aluno joga sozinho, no próprio ritmo, com correção
// imediata e explicação. Sem host, sem PIN, sem tempo.
export function SoloPage() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [theme, setTheme] = useState('default')
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [idx, setIdx] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [picked, setPicked] = useState<string[]>([]) // ids escolhidos (ou texto digitado)
  const [typed, setTyped] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let active = true
    getQuizForEdit(quizId).then((res) => {
      if (!active) return
      if (res.error || !res.quiz) {
        setError(res.error ?? 'Quiz não encontrado.')
        setLoading(false)
        return
      }
      const qs = res.questions.filter((q) => q.prompt.trim())
      setTitle(res.quiz.title)
      setTheme(res.quiz.theme ?? 'default')
      setQuestions(qs)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [quizId])

  const q = questions[idx]
  const correctIds = useMemo(() => (q ? q.answers.filter((a) => a.is_correct).map((a) => a.id) : []), [q])

  function isCorrectNow(): boolean {
    if (!q) return false
    if (q.type === 'poll') return false
    if (q.type === 'typed') {
      const accepted = q.answers.filter((a) => a.is_correct).map((a) => normalizeText(a.label))
      return accepted.includes(normalizeText(typed))
    }
    const pickedSorted = [...picked].sort().join(',')
    const correctSorted = [...correctIds].sort().join(',')
    return pickedSorted === correctSorted
  }

  function submit() {
    if (answered || !q) return
    if (q.type === 'typed' && !typed.trim()) return
    if (q.type !== 'typed' && picked.length === 0) return
    setAnswered(true)
    if (isCorrectNow()) setCorrectCount((c) => c + 1)
  }

  function pickSingle(id: string) {
    if (answered) return
    setPicked([id])
    // resposta única / V-F: confirma na hora
    setAnswered(true)
    if (id && correctIds.length === 1 && correctIds[0] === id) setCorrectCount((c) => c + 1)
  }

  function toggleMulti(id: string) {
    if (answered) return
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  function next() {
    if (idx + 1 >= questions.length) {
      setDone(true)
      const pct = questions.length ? correctCount / questions.length : 0
      if (pct >= 0.6) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#8e46f0', '#feb703', '#01cfab', '#fe4881'] })
      }
      return
    }
    setIdx((i) => i + 1)
    setAnswered(false)
    setPicked([])
    setTyped('')
  }

  if (loading) return <Center bg={themeBg(theme)}>Carregando…</Center>
  if (error) return <Center bg={themeBg(theme)}>{error}</Center>
  if (questions.length === 0) return <Center bg={themeBg(theme)}>Este quiz ainda não tem perguntas.</Center>

  if (done) {
    const pct = Math.round((correctCount / questions.length) * 100)
    return (
      <div className="min-h-screen" style={{ background: themeBg(theme) }}>
        <div className="max-w-[560px] mx-auto px-4 py-10 text-center">
          <img src={logo} alt="Quizoo" className="h-11 w-auto mx-auto mb-6" />
          <div className="text-6xl mb-3">{pct >= 60 ? '🎉' : '💪'}</div>
          <h1 className="font-display font-semibold text-[30px] text-heading mb-2">
            Você acertou {correctCount} de {questions.length}
          </h1>
          <p className="font-display font-semibold text-purple text-[40px] mb-8">{pct}%</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setIdx(0)
                setAnswered(false)
                setPicked([])
                setTyped('')
                setCorrectCount(0)
                setDone(false)
              }}
              className="font-display font-semibold rounded-2xl px-7 py-3 text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 cursor-pointer"
            >
              Praticar de novo
            </button>
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="font-display font-semibold rounded-2xl px-7 py-3 text-purple bg-lilac hover:bg-[#e2d2ff] cursor-pointer"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: themeBg(theme) }}>
      <div className="max-w-[620px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-2 gap-3">
          <Link to="/" className="shrink-0">
            <img src={logo} alt="Quizoo" className="h-9 w-auto" />
          </Link>
          <span className="font-display font-semibold text-body text-[15px] shrink-0">
            {idx + 1} / {questions.length} · ✅ {correctCount}
          </span>
        </div>
        {title && <p className="font-display font-semibold text-purple text-[14px] mb-3 truncate">{title}</p>}

        <div className="bg-white border-2 border-border rounded-[20px] p-5 sm:p-6 text-center mb-4">
          <span className="text-[12px] font-bold uppercase tracking-wide text-purple-dark bg-lilac px-2 py-0.5 rounded-full">
            Modo estudo
          </span>
          <h2 className="font-display font-semibold text-[22px] text-heading mt-3">{q.prompt}</h2>
          {q.image_url && (
            <img src={q.image_url} alt="" className="mx-auto mt-4 rounded-[14px] max-h-[240px] w-auto object-contain" />
          )}
        </div>

        {/* Digite a resposta */}
        {q.type === 'typed' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            className="flex flex-col gap-3"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={answered}
              placeholder="Digite sua resposta…"
              autoFocus
              className="rounded-[14px] border-2 border-border px-4 py-4 text-[18px] text-heading outline-none focus:border-purple disabled:opacity-70"
            />
            {!answered && (
              <button
                type="submit"
                className="font-display font-semibold rounded-2xl px-8 py-4 text-[18px] text-ink bg-yellow shadow-[0_5px_0_#B98400] hover:translate-y-0.5 cursor-pointer"
              >
                Responder
              </button>
            )}
          </form>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.answers
                .filter((a) => a.label.trim())
                .map((a, i) => {
                  const s = answerStyle(i)
                  const chosen = picked.includes(a.id)
                  const showCorrect = answered && a.is_correct
                  const showWrong = answered && chosen && !a.is_correct
                  return (
                    <button
                      key={a.id}
                      type="button"
                      disabled={answered}
                      onClick={() => (q.multiple ? toggleMulti(a.id) : pickSingle(a.id))}
                      className={`flex items-center justify-between gap-3 rounded-[16px] px-5 py-5 text-white text-left transition ${
                        answered && !a.is_correct && !chosen ? 'opacity-40' : ''
                      } ${chosen && !answered ? 'ring-4 ring-white/90' : ''} ${!answered ? 'hover:brightness-105 cursor-pointer' : 'cursor-default'}`}
                      style={{ background: s.bg }}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-[24px]">{s.shape}</span>
                        <span className="font-display font-semibold text-[17px]">{a.label}</span>
                      </span>
                      {showCorrect && <span className="bg-white text-teal w-7 h-7 rounded-full grid place-items-center font-bold">✓</span>}
                      {showWrong && <span className="bg-white text-pink w-7 h-7 rounded-full grid place-items-center font-bold">✕</span>}
                    </button>
                  )
                })}
            </div>
            {q.multiple && !answered && (
              <button
                type="button"
                onClick={submit}
                disabled={picked.length === 0}
                className="w-full mt-3 font-display font-semibold rounded-2xl px-8 py-4 text-[18px] text-ink bg-yellow shadow-[0_5px_0_#B98400] hover:translate-y-0.5 disabled:opacity-50 cursor-pointer"
              >
                Confirmar {picked.length > 0 ? `(${picked.length})` : ''}
              </button>
            )}
          </>
        )}

        {/* Feedback após responder */}
        {answered && (
          <div className="mt-4">
            {q.type !== 'poll' && (
              <div
                className={`rounded-[16px] px-5 py-4 font-display font-semibold text-[18px] ${
                  isCorrectNow() ? 'bg-teal-light text-teal' : 'bg-pink/10 text-pink'
                }`}
              >
                {isCorrectNow() ? '🎉 Acertou!' : '😬 Não foi dessa vez'}
              </div>
            )}
            {q.explanation && (
              <div className="mt-3 bg-blue-light/60 border-2 border-blue/30 rounded-[16px] px-5 py-4">
                <p className="font-display font-semibold text-[14px] text-blue mb-1">💡 Por quê?</p>
                <p className="text-[15px] text-heading">{q.explanation}</p>
              </div>
            )}
            <button
              type="button"
              onClick={next}
              className="w-full mt-4 font-display font-semibold rounded-2xl px-8 py-4 text-[18px] text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 cursor-pointer"
            >
              {idx + 1 >= questions.length ? 'Ver resultado 🏁' : 'Próxima →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Center({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div className="min-h-screen grid place-items-center px-6" style={{ background: bg }}>
      <p className="font-display font-semibold text-body text-lg text-center">{children}</p>
    </div>
  )
}
