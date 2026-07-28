import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import logo from '../assets/quizoo-logo.png'
import { answerStyle } from '../lib/answerStyles'
import {
  emptyQuestion,
  getQuizForEdit,
  saveQuiz,
  setPublished,
  type QuestionDraft,
} from '../lib/quizzes'

export function EditorPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    let active = true
    getQuizForEdit(id).then((res) => {
      if (!active) return
      if (res.error || !res.quiz) {
        setError(res.error ?? 'Quiz não encontrado.')
        setLoading(false)
        return
      }
      setTitle(res.quiz.title === 'Quiz sem título' ? '' : res.quiz.title)
      setDescription(res.quiz.description ?? '')
      setQuestions(res.questions.length ? res.questions : [emptyQuestion()])
      setIsPublished(res.quiz.is_published)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [id])

  function patchQuestion(qid: string, patch: Partial<QuestionDraft>) {
    setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, ...patch } : q)))
  }

  function patchAnswer(qid: string, aid: string, label: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid ? { ...q, answers: q.answers.map((a) => (a.id === aid ? { ...a, label } : a)) } : q,
      ),
    )
  }

  function setCorrect(qid: string, aid: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid ? { ...q, answers: q.answers.map((a) => ({ ...a, is_correct: a.id === aid })) } : q,
      ),
    )
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion()])
  }

  function removeQuestion(qid: string) {
    setQuestions((qs) => (qs.length > 1 ? qs.filter((q) => q.id !== qid) : qs))
  }

  function validate(): string | null {
    if (!title.trim()) return 'Dê um título ao seu quiz.'
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.prompt.trim()) return `A pergunta ${i + 1} está sem enunciado.`
      const filled = q.answers.filter((a) => a.label.trim() !== '')
      if (filled.length < 2) return `A pergunta ${i + 1} precisa de pelo menos 2 alternativas.`
      if (!filled.some((a) => a.is_correct)) return `Marque a alternativa correta da pergunta ${i + 1}.`
    }
    return null
  }

  async function handleSave() {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setSaving(true)
    const { error } = await saveQuiz(id, { title, description }, questions)
    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    setSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
  }

  async function handleTogglePublish() {
    setPublishing(true)
    const next = !isPublished
    const { error } = await setPublished(id, next)
    setPublishing(false)
    if (error) {
      setError(error)
      return
    }
    setIsPublished(next)
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="font-display font-semibold text-body text-lg">Carregando editor…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Barra superior fixa */}
      <header className="sticky top-0 z-10 bg-cream/90 backdrop-blur border-b-2 border-border">
        <div className="max-w-[880px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/app" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="Quizoo" className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            {savedAt && !saving && <span className="text-[13px] text-teal font-bold hidden sm:inline">Salvo {savedAt}</span>}
            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={publishing}
              title={isPublished ? 'Está na biblioteca pública. Clique para tirar.' : 'Publicar na biblioteca pública'}
              className={`font-display font-semibold rounded-[14px] px-4 py-2.5 text-[15px] border-2 transition-colors disabled:opacity-60 cursor-pointer ${
                isPublished ? 'border-teal text-teal bg-teal-light' : 'border-border text-nav-link bg-white hover:border-purple/50'
              }`}
            >
              {publishing ? '…' : isPublished ? '🌎 Publicado' : 'Publicar'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="font-display font-semibold rounded-[14px] px-5 py-2.5 text-[15px] text-white bg-purple shadow-[0_4px_0_#3A0E86] hover:translate-y-0.5 hover:shadow-[0_2px_0_#3A0E86] transition-[transform,box-shadow] disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[880px] mx-auto px-4 sm:px-6 pt-6">
        {/* Cabeçalho do quiz */}
        <div className="bg-white border-2 border-border rounded-[22px] p-5 sm:p-7 mb-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do quiz"
            className="w-full font-display font-semibold text-[26px] sm:text-[30px] text-heading outline-none placeholder:text-muted-2"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full mt-2 text-[15px] text-body outline-none placeholder:text-muted-2"
          />
        </div>

        {error && (
          <p className="mb-4 text-[14px] text-pink font-semibold bg-pink/10 border border-pink/30 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Perguntas */}
        <div className="flex flex-col gap-5">
          {questions.map((q, qi) => (
            <QuestionCard
              key={q.id}
              index={qi}
              question={q}
              canRemove={questions.length > 1}
              onPatch={(patch) => patchQuestion(q.id, patch)}
              onPatchAnswer={(aid, label) => patchAnswer(q.id, aid, label)}
              onSetCorrect={(aid) => setCorrect(q.id, aid)}
              onRemove={() => removeQuestion(q.id)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="w-full mt-5 font-display font-semibold rounded-[18px] border-2 border-dashed border-purple/40 text-purple py-4 hover:bg-lilac/40 transition-colors cursor-pointer"
        >
          + Adicionar pergunta
        </button>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="font-display font-semibold text-body hover:text-heading cursor-pointer"
          >
            ← Voltar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="font-display font-semibold rounded-2xl px-8 py-3.5 text-[17px] text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 hover:shadow-[0_3px_0_#3A0E86] transition-[transform,box-shadow] disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Salvando…' : 'Salvar quiz'}
          </button>
        </div>
      </main>
    </div>
  )
}

function QuestionCard({
  index,
  question,
  canRemove,
  onPatch,
  onPatchAnswer,
  onSetCorrect,
  onRemove,
}: {
  index: number
  question: QuestionDraft
  canRemove: boolean
  onPatch: (patch: Partial<QuestionDraft>) => void
  onPatchAnswer: (aid: string, label: string) => void
  onSetCorrect: (aid: string) => void
  onRemove: () => void
}) {
  return (
    <div className="bg-white border-2 border-border rounded-[22px] p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="font-display font-semibold text-[15px] text-purple">Pergunta {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[13px] font-bold text-muted hover:text-pink cursor-pointer"
          >
            Remover
          </button>
        )}
      </div>

      <textarea
        value={question.prompt}
        onChange={(e) => onPatch({ prompt: e.target.value })}
        placeholder="Escreva a pergunta…"
        rows={2}
        className="w-full resize-none rounded-[14px] border-2 border-border px-4 py-3 text-[16px] text-heading outline-none focus:border-purple"
      />

      <div className="flex flex-wrap gap-3 mt-3">
        <label className="flex items-center gap-2 text-[13px] font-bold text-nav-link">
          Tempo
          <select
            value={question.time_limit}
            onChange={(e) => onPatch({ time_limit: Number(e.target.value) })}
            className="rounded-[10px] border-2 border-border px-2 py-1.5 text-[14px] text-heading outline-none focus:border-purple"
          >
            {[10, 20, 30, 60, 90].map((s) => (
              <option key={s} value={s}>
                {s}s
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13px] font-bold text-nav-link">
          Pontos
          <select
            value={question.points}
            onChange={(e) => onPatch({ points: Number(e.target.value) })}
            className="rounded-[10px] border-2 border-border px-2 py-1.5 text-[14px] text-heading outline-none focus:border-purple"
          >
            {[500, 1000, 2000].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-[12px] text-muted mt-4 mb-2 font-bold uppercase tracking-wide">
        Toque no ✓ para marcar a correta
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {question.answers.map((a, ai) => {
          const style = answerStyle(ai)
          return (
            <div
              key={a.id}
              className="flex items-center gap-2.5 rounded-[14px] px-3 py-2.5"
              style={{ background: style.bg }}
            >
              <span className="text-white text-[18px] w-5 text-center shrink-0">{style.shape}</span>
              <input
                value={a.label}
                onChange={(e) => onPatchAnswer(a.id, e.target.value)}
                placeholder={`Alternativa ${ai + 1}`}
                className="flex-1 bg-transparent text-white placeholder:text-white/70 font-semibold text-[15px] outline-none min-w-0"
              />
              <button
                type="button"
                onClick={() => onSetCorrect(a.id)}
                aria-label="Marcar como correta"
                className={`shrink-0 w-7 h-7 rounded-full grid place-items-center font-bold transition-colors ${
                  a.is_correct ? 'bg-white text-teal' : 'bg-white/25 text-white hover:bg-white/40'
                }`}
              >
                ✓
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
