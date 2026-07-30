import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle, Copy, MoreVertical, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import type { Question } from '../../types/quiz'
import { QUESTION_TYPE_META } from '../../types/quiz'
import { validateQuestion } from '../../lib/validation'
import { useQuizStore } from '../../store/useQuizStore'
import { Menu, MenuItem } from './primitives'

export function SlideCard({
  question,
  index,
  active,
  selected,
  onSelect,
}: {
  question: Question
  index: number
  active: boolean
  selected: boolean
  onSelect: (e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id })
  const duplicate = useQuizStore((s) => s.duplicateQuestion)
  const remove = useQuizStore((s) => s.removeQuestion)
  const move = useQuizStore((s) => s.moveQuestion)

  const incomplete = validateQuestion(question).length > 0
  const badge = QUESTION_TYPE_META[question.type].label

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-stretch gap-2"
    >
      <div className="flex flex-col items-center pt-2 text-[13px] font-semibold text-[var(--text-muted)]">{index + 1}</div>
      <button
        type="button"
        onClick={onSelect}
        {...attributes}
        {...listeners}
        className="group relative flex-1 cursor-grab rounded-[12px] border-2 bg-[var(--surface)] p-2.5 text-left transition-colors duration-150 active:cursor-grabbing"
        style={{
          borderColor: active ? 'var(--primary)' : selected ? 'var(--primary)' : 'var(--border)',
          boxShadow: active ? 'var(--shadow-sm)' : 'none',
          background: selected ? 'var(--primary-soft)' : 'var(--surface)',
        }}
      >
        <div className="mb-1 flex items-center gap-1.5">
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {badge}
          </span>
          {incomplete && <AlertTriangle size={13} className="text-[var(--warning)]" />}
        </div>
        <p className="line-clamp-2 min-h-[32px] text-[13px] font-medium text-[var(--text)]">
          {question.text || <span className="text-[var(--text-muted)]">Sem pergunta ainda</span>}
        </p>
        {question.media.type === 'image' && (
          <img src={question.media.url} alt="" className="mt-1.5 h-12 w-full rounded-[8px] object-cover" />
        )}

        <span className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <Menu
            trigger={
              <span className="grid h-7 w-7 place-items-center rounded-[8px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                <MoreVertical size={15} />
              </span>
            }
          >
            {(close) => (
              <>
                <MenuItem onClick={() => { duplicate(question.id); close() }}>
                  <Copy size={15} /> Duplicar
                </MenuItem>
                <MenuItem onClick={() => { move(question.id, -1); close() }}>
                  <ArrowUp size={15} /> Mover para cima
                </MenuItem>
                <MenuItem onClick={() => { move(question.id, 1); close() }}>
                  <ArrowDown size={15} /> Mover para baixo
                </MenuItem>
                <MenuItem danger onClick={() => { remove(question.id); close() }}>
                  <Trash2 size={15} /> Excluir
                </MenuItem>
              </>
            )}
          </Menu>
        </span>
      </button>
    </div>
  )
}
