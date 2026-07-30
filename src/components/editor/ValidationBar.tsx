import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useQuizStore } from '../../store/useQuizStore'
import { validateQuiz } from '../../lib/validation'

export function ValidationBar() {
  const quiz = useQuizStore((s) => s.quiz)
  const setActive = useQuizStore((s) => s.setActive)
  const v = validateQuiz(quiz)

  const firstPending = v.perQuestion.find((q) => !q.ok)

  if (v.canPublish) {
    return (
      <div className="flex items-center justify-center gap-2 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--success)]">
        <CheckCircle2 size={16} /> Tudo pronto para publicar
      </div>
    )
  }

  const total = quiz.questions.length
  return (
    <div className="flex items-center justify-center gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px]">
      <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--warning)]">
        <AlertTriangle size={16} />
        {v.titleMissing && 'Falta o título · '}
        {v.incomplete} de {total} {total === 1 ? 'pergunta incompleta' : 'perguntas incompletas'}
      </span>
      {firstPending && (
        <button
          type="button"
          onClick={() => setActive(firstPending.questionId)}
          className="font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] underline-offset-2 hover:underline"
        >
          Ir para a pendência →
        </button>
      )}
    </div>
  )
}
