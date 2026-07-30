import { useEffect, useRef } from 'react'
import { useQuizStore } from '../store/useQuizStore'

/** Salva sozinho 800ms após a última alteração (debounce). */
export function useAutosave(delay = 800) {
  const updatedAt = useQuizStore((s) => s.quiz.updatedAt)
  const save = useQuizStore((s) => s.save)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => {
      void save()
    }, delay)
    return () => clearTimeout(t)
  }, [updatedAt, delay, save])
}
