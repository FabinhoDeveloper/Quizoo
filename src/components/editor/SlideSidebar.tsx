import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Library } from 'lucide-react'
import { useQuizStore } from '../../store/useQuizStore'
import { SlideCard } from './SlideCard'

export function SlideSidebar() {
  const questions = useQuizStore((s) => s.quiz.questions)
  const activeId = useQuizStore((s) => s.activeId)
  const selectedIds = useQuizStore((s) => s.selectedIds)
  const setActive = useQuizStore((s) => s.setActive)
  const toggleSelect = useQuizStore((s) => s.toggleSelect)
  const reorder = useQuizStore((s) => s.reorder)
  const addQuestion = useQuizStore((s) => s.addQuestion)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function onDragEnd(e: DragEndEvent) {
    if (e.over && e.active.id !== e.over.id) reorder(String(e.active.id), String(e.over.id))
  }

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-2)]/50">
      <div className="flex-1 overflow-y-auto p-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {questions.map((q, i) => (
                <SlideCard
                  key={q.id}
                  question={q}
                  index={i}
                  active={q.id === activeId}
                  selected={selectedIds.includes(q.id)}
                  onSelect={(e) => (e.shiftKey || e.ctrlKey || e.metaKey ? toggleSelect(q.id, true) : setActive(q.id))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--border)] p-3">
        <button
          type="button"
          onClick={() => addQuestion('quiz')}
          className="flex items-center justify-center gap-1.5 rounded-[10px] bg-[var(--primary)] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[var(--primary-hover)]"
        >
          <Plus size={16} /> Adicionar pergunta
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <Library size={15} /> Banco de perguntas
        </button>
      </div>
    </aside>
  )
}
