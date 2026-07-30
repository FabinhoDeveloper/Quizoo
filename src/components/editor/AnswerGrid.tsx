import { useRef, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Question } from '../../types/quiz'
import { QUESTION_TYPE_META } from '../../types/quiz'
import { useQuizStore } from '../../store/useQuizStore'
import { uploadMedia } from '../../services/quizService'
import { validateQuestion } from '../../lib/validation'
import { AnswerCard } from './AnswerCard'

export function AnswerGrid({ question }: { question: Question }) {
  const patchAnswer = useQuizStore((s) => s.patchAnswer)
  const toggleCorrect = useQuizStore((s) => s.toggleCorrect)
  const addAnswer = useQuizStore((s) => s.addAnswer)
  const fileRef = useRef<HTMLInputElement>(null)
  const [target, setTarget] = useState<string | null>(null)

  const meta = QUESTION_TYPE_META[question.type]
  if (!meta.hasAnswers) return null

  const noCorrectMarked = meta.hasCorrect && !question.answers.some((a) => a.isCorrect && a.text.trim())
  const showCorrect = question.type === 'quiz' || question.type === 'true_false'

  async function onFile(file: File | undefined) {
    if (!file || !target) return
    const { url } = await uploadMedia(file)
    patchAnswer(question.id, target, { image: url })
    setTarget(null)
  }

  // Digite a resposta: lista de respostas aceitas (todas corretas)
  if (question.type === 'typed') {
    return (
      <div className="mx-auto w-full max-w-[560px]">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">
          Respostas aceitas
        </p>
        <div className="flex flex-col gap-2">
          {question.answers.map((a, i) => (
            <div
              key={a.id}
              className="flex items-center gap-2.5 rounded-[10px] border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            >
              <Check size={16} className="shrink-0 text-[var(--success)]" strokeWidth={3} />
              <input
                value={a.text}
                onChange={(e) => patchAnswer(question.id, a.id, { text: e.target.value, isCorrect: true })}
                placeholder={`Resposta aceita ${i + 1}`}
                className="flex-1 bg-transparent text-[16px] font-medium text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
              />
              {question.answers.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    patchAnswer(question.id, a.id, { text: '' }) /* simplificado: limpa (remoção real via store futura) */
                  }
                  aria-label="Limpar"
                  className="grid h-7 w-7 place-items-center rounded-[8px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addAnswer(question.id)}
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]"
        >
          <Plus size={15} /> adicionar resposta aceita
        </button>
      </div>
    )
  }

  const optionalFrom = question.type === 'quiz' || question.type === 'poll' ? 2 : 99

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]).catch(() => toast.error('Falha ao enviar imagem'))
          e.target.value = ''
        }}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.answers.map((a, i) => (
          <AnswerCard
            key={a.id}
            answer={a}
            index={i}
            showCorrect={showCorrect}
            optional={i >= optionalFrom}
            onChangeText={(v) => patchAnswer(question.id, a.id, { text: v })}
            onToggleCorrect={() => toggleCorrect(question.id, a.id)}
            onPickImage={() => {
              setTarget(a.id)
              fileRef.current?.click()
            }}
          />
        ))}
      </div>
      {noCorrectMarked && showCorrect && validateQuestion(question).length > 0 && (
        <p className="mt-3 text-center text-[13px] font-medium text-[var(--warning)]">
          Marque ao menos uma resposta correta
        </p>
      )}
    </div>
  )
}
