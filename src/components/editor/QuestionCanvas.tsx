import { useEffect, useRef } from 'react'
import type { Question } from '../../types/quiz'
import { QUESTION_TYPE_META } from '../../types/quiz'
import { useQuizStore } from '../../store/useQuizStore'
import { MediaUploader } from './MediaUploader'
import { AnswerGrid } from './AnswerGrid'

const MAX = 120

export function QuestionCanvas({ question }: { question: Question }) {
  const patchQuestion = useQuizStore((s) => s.patchQuestion)
  const ref = useRef<HTMLTextAreaElement>(null)

  // auto-expande a altura do textarea
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [question.text, question.id])

  const over = question.text.length > MAX
  const isSlide = question.type === 'slide'

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-8">
      <div className="relative">
        <textarea
          ref={ref}
          value={question.text}
          onChange={(e) => patchQuestion(question.id, { text: e.target.value })}
          placeholder={isSlide ? 'Escreva o conteúdo do slide' : 'Escreva sua pergunta aqui'}
          rows={1}
          className="w-full resize-none overflow-hidden bg-transparent text-center font-bold leading-tight tracking-[-0.02em] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
          style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}
        />
        <span
          className="pointer-events-none absolute -bottom-5 right-0 text-[12px] font-medium"
          style={{ color: over ? 'var(--danger)' : 'var(--text-muted)' }}
        >
          {question.text.length}/{MAX}
        </span>
      </div>

      {question.type !== 'word_cloud' && <MediaUploader question={question} />}

      {QUESTION_TYPE_META[question.type].hasAnswers && <AnswerGrid question={question} />}

      {question.type === 'word_cloud' && (
        <p className="text-center text-[14px] text-[var(--text-muted)]">
          Os jogadores enviam palavras que aparecem como uma nuvem em tempo real.
        </p>
      )}
      {isSlide && (
        <p className="text-center text-[14px] text-[var(--text-muted)]">
          Slide informativo: aparece para a turma, sem resposta.
        </p>
      )}
    </div>
  )
}
