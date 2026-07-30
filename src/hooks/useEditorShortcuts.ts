import { useEffect } from 'react'
import { useQuizStore } from '../store/useQuizStore'

const isTyping = (el: EventTarget | null) => {
  const t = el as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
}

/** Atalhos de teclado do editor. `onHelp` abre o modal de atalhos. */
export function useEditorShortcuts(onHelp: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useQuizStore.getState()
      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key === 's') {
        e.preventDefault()
        void s.save()
        return
      }
      if (mod && e.key === 'Enter') {
        e.preventDefault()
        s.addQuestion('quiz')
        return
      }
      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        s.duplicateQuestion(s.activeId)
        return
      }
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
        return
      }
      if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        const q = s.quiz.questions.find((x) => x.id === s.activeId)
        const a = q?.answers[Number(e.key) - 1]
        if (q && a) {
          e.preventDefault()
          s.toggleCorrect(q.id, a.id)
        }
        return
      }
      if (e.key === '?' && !isTyping(e.target)) {
        e.preventDefault()
        onHelp()
        return
      }
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !isTyping(e.target)) {
        const idx = s.quiz.questions.findIndex((q) => q.id === s.activeId)
        const next = e.key === 'ArrowUp' ? idx - 1 : idx + 1
        const target = s.quiz.questions[next]
        if (target) {
          e.preventDefault()
          s.setActive(target.id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onHelp])
}
