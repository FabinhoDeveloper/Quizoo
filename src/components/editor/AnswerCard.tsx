import { Check, ImagePlus, Triangle, Diamond, Circle, Square } from 'lucide-react'
import type { Answer } from '../../types/quiz'

const SHAPES = [Triangle, Diamond, Circle, Square]
const COLOR_VARS = ['var(--answer-1)', 'var(--answer-2)', 'var(--answer-3)', 'var(--answer-4)']

export function AnswerCard({
  answer,
  index,
  showCorrect,
  optional,
  onChangeText,
  onToggleCorrect,
  onPickImage,
}: {
  answer: Answer
  index: number
  showCorrect: boolean
  optional: boolean
  onChangeText: (v: string) => void
  onToggleCorrect: () => void
  onPickImage: () => void
}) {
  const color = COLOR_VARS[answer.colorIndex % 4]
  const Shape = SHAPES[answer.colorIndex % 4]
  const empty = !answer.text.trim() && !answer.image

  return (
    <div
      className="flex items-center gap-3 rounded-[12px] border-2 px-3.5 py-3 transition-all duration-150"
      style={{
        borderColor: answer.isCorrect ? 'var(--success)' : 'var(--border)',
        background: 'var(--surface)',
        opacity: optional && empty ? 0.6 : 1,
      }}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-white" style={{ background: color }}>
        <Shape size={18} fill="currentColor" strokeWidth={0} />
      </span>

      {answer.image && (
        <img src={answer.image} alt="" className="h-9 w-9 rounded-[8px] object-cover shrink-0" />
      )}

      <input
        value={answer.text}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={optional ? 'Adicionar resposta (opcional)' : `Resposta ${index + 1}`}
        aria-label={`Resposta ${index + 1}`}
        className="flex-1 min-w-0 bg-transparent text-[18px] font-semibold text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-medium outline-none"
      />

      <button
        type="button"
        onClick={onPickImage}
        aria-label="Imagem na resposta"
        title="Imagem na resposta"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
      >
        <ImagePlus size={16} />
      </button>

      {showCorrect && (
        <button
          type="button"
          onClick={onToggleCorrect}
          aria-label={answer.isCorrect ? 'Correta (clique para desmarcar)' : 'Marcar como correta'}
          aria-pressed={answer.isCorrect}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150"
          style={{
            borderColor: answer.isCorrect ? 'var(--success)' : 'var(--border)',
            background: answer.isCorrect ? 'var(--success)' : 'transparent',
            color: answer.isCorrect ? '#fff' : 'var(--text-muted)',
          }}
        >
          <Check size={16} strokeWidth={3} />
        </button>
      )}
    </div>
  )
}
