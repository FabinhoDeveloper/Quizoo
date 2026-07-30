import { useEffect, useState } from 'react'
import { Triangle, Diamond, Circle, Square } from 'lucide-react'
import { useQuizStore } from '../../store/useQuizStore'
import { Dialog } from './primitives'

const SHAPES = [Triangle, Diamond, Circle, Square]
const COLORS = ['var(--answer-1)', 'var(--answer-2)', 'var(--answer-3)', 'var(--answer-4)']

// Simula a tela do jogador com o timer rodando, para conferir legibilidade.
export function PreviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const questions = useQuizStore((s) => s.quiz.questions)
  const activeId = useQuizStore((s) => s.activeId)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (open) setIdx(Math.max(0, questions.findIndex((q) => q.id === activeId)))
  }, [open, activeId, questions])

  const q = questions[idx]
  const total = q?.timeLimitSec ?? 20
  const [left, setLeft] = useState(total)

  useEffect(() => {
    if (!open || !q) return
    setLeft(total)
    if (q.timeLimitSec === null) return
    const t = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [open, idx, q, total])

  if (!q) return null
  const answers = q.answers.filter((a) => a.text.trim())

  return (
    <Dialog open={open} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[var(--text-muted)]">
            Pré-visualização · {idx + 1}/{questions.length}
          </span>
          {q.timeLimitSec !== null && (
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--primary)] text-[18px] font-bold text-white">
              {left}
            </span>
          )}
        </div>

        <div className="grid min-h-[130px] place-items-center rounded-[14px] bg-[var(--surface-2)] p-6 text-center">
          <h2 className="text-[24px] font-bold text-[var(--text)]">{q.text || 'Sem pergunta'}</h2>
        </div>
        {q.media.type === 'image' && (
          <img src={q.media.url} alt="" className="mx-auto mt-3 max-h-[220px] rounded-[12px] object-contain" />
        )}

        {answers.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {answers.map((a) => {
              const Shape = SHAPES[a.colorIndex % 4]
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-[12px] px-4 py-4 text-white" style={{ background: COLORS[a.colorIndex % 4] }}>
                  <Shape size={20} fill="currentColor" strokeWidth={0} />
                  <span className="text-[17px] font-semibold">{a.text}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-2">
          <button type="button" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="rounded-[10px] px-4 py-2 text-[14px] font-semibold text-[var(--text-muted)] disabled:opacity-40">
            ← Anterior
          </button>
          <button type="button" onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))} disabled={idx >= questions.length - 1} className="rounded-[10px] bg-[var(--primary)] px-5 py-2 text-[14px] font-semibold text-white disabled:opacity-40">
            Próxima →
          </button>
        </div>
      </div>
    </Dialog>
  )
}
