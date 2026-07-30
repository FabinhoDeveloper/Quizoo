import { create } from 'zustand'
import { createAnswer, createEmptyQuiz, createQuestion } from '../data/mockQuiz'
import { loadQuiz, saveQuiz } from '../services/quizService'
import type { Answer, PointsMode, Question, QuestionType, Quiz } from '../types/quiz'
import { QUESTION_TYPE_META } from '../types/quiz'

const MAX_HISTORY = 30
const clone = <T>(v: T): T => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)))

type SaveState = 'idle' | 'saving' | 'saved'

interface QuizStore {
  quiz: Quiz
  activeId: string
  selectedIds: string[]
  saveState: SaveState
  dark: boolean
  past: Quiz[]
  future: Quiz[]

  // navegação / seleção
  setActive: (id: string) => void
  toggleSelect: (id: string, additive: boolean) => void
  clearSelection: () => void

  // meta do quiz
  setTitle: (title: string) => void
  patchQuiz: (patch: Partial<Quiz>) => void

  // perguntas
  addQuestion: (type?: QuestionType) => void
  duplicateQuestion: (id: string) => void
  removeQuestion: (id: string) => void
  removeSelected: () => void
  reorder: (activeId: string, overId: string) => void
  moveQuestion: (id: string, dir: -1 | 1) => void
  patchQuestion: (id: string, patch: Partial<Question>) => void
  setType: (id: string, type: QuestionType) => void
  addQuestions: (qs: Question[]) => void

  // respostas
  patchAnswer: (qid: string, aid: string, patch: Partial<Answer>) => void
  toggleCorrect: (qid: string, aid: string) => void
  addAnswer: (qid: string) => void
  setPoints: (qid: string, mode: PointsMode) => void

  // histórico
  undo: () => void
  redo: () => void

  // sistema
  toggleDark: () => void
  load: (id?: string) => Promise<void>
  save: () => Promise<void>
}

function adaptAnswers(q: Question, type: QuestionType): Answer[] {
  const meta = QUESTION_TYPE_META[type]
  if (!meta.hasAnswers) return []
  if (type === 'true_false') {
    return [
      { id: crypto.randomUUID(), text: 'Verdadeiro', image: null, isCorrect: true, colorIndex: 0 },
      { id: crypto.randomUUID(), text: 'Falso', image: null, isCorrect: false, colorIndex: 1 },
    ]
  }
  const labels = q.answers.map((a) => a.text)
  if (type === 'typed') {
    const kept = labels.filter((l) => l.trim())
    return (kept.length ? kept : ['']).map((t, i) => ({ ...createAnswer(i, t), isCorrect: true }))
  }
  const base = (labels.length ? labels : ['', '', '', '']).slice(0, 4)
  while (base.length < 4) base.push('')
  return base.map((t, i) => ({ ...createAnswer(i, t), isCorrect: type === 'quiz' ? i === 0 : false }))
}

export const useQuizStore = create<QuizStore>((set, get) => {
  const initial = createEmptyQuiz()

  // aplica uma mutação registrando o passo no histórico (para undo/redo)
  const commit = (mutator: (draft: Quiz) => void) => {
    const { quiz, past } = get()
    const snapshot = clone(quiz)
    const draft = clone(quiz)
    mutator(draft)
    draft.updatedAt = new Date().toISOString()
    set({
      quiz: draft,
      past: [...past, snapshot].slice(-MAX_HISTORY),
      future: [],
      saveState: 'saving',
    })
  }

  return {
    quiz: initial,
    activeId: initial.questions[0]?.id ?? '',
    selectedIds: [],
    saveState: 'idle',
    dark: typeof localStorage !== 'undefined' && localStorage.getItem('quizoo_creator_dark') === '1',
    past: [],
    future: [],

    setActive: (id) => set({ activeId: id, selectedIds: [] }),
    toggleSelect: (id, additive) =>
      set((s) => {
        if (!additive) return { selectedIds: [id], activeId: id }
        const has = s.selectedIds.includes(id)
        return { selectedIds: has ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id] }
      }),
    clearSelection: () => set({ selectedIds: [] }),

    setTitle: (title) => commit((d) => (d.title = title.slice(0, 120))),
    patchQuiz: (patch) => commit((d) => Object.assign(d, patch)),

    addQuestion: (type = 'quiz') => {
      const q = createQuestion(type)
      commit((d) => {
        const i = d.questions.findIndex((x) => x.id === get().activeId)
        d.questions.splice(i >= 0 ? i + 1 : d.questions.length, 0, q)
      })
      set({ activeId: q.id, selectedIds: [] })
    },

    duplicateQuestion: (id) => {
      const copyId = crypto.randomUUID()
      commit((d) => {
        const i = d.questions.findIndex((x) => x.id === id)
        if (i < 0) return
        const copy = clone(d.questions[i])
        copy.id = copyId
        copy.answers = copy.answers.map((a) => ({ ...a, id: crypto.randomUUID() }))
        d.questions.splice(i + 1, 0, copy)
      })
      set({ activeId: copyId })
    },

    removeQuestion: (id) =>
      commit((d) => {
        if (d.questions.length <= 1) return
        const i = d.questions.findIndex((x) => x.id === id)
        d.questions = d.questions.filter((x) => x.id !== id)
        const next = d.questions[Math.max(0, i - 1)]
        if (get().activeId === id && next) set({ activeId: next.id })
      }),

    removeSelected: () =>
      commit((d) => {
        const sel = new Set(get().selectedIds)
        const remaining = d.questions.filter((q) => !sel.has(q.id))
        if (remaining.length === 0) return
        d.questions = remaining
        set({ selectedIds: [], activeId: remaining[0].id })
      }),

    reorder: (activeId, overId) =>
      commit((d) => {
        const from = d.questions.findIndex((q) => q.id === activeId)
        const to = d.questions.findIndex((q) => q.id === overId)
        if (from < 0 || to < 0) return
        const [moved] = d.questions.splice(from, 1)
        d.questions.splice(to, 0, moved)
      }),

    moveQuestion: (id, dir) =>
      commit((d) => {
        const i = d.questions.findIndex((q) => q.id === id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= d.questions.length) return
        ;[d.questions[i], d.questions[j]] = [d.questions[j], d.questions[i]]
      }),

    patchQuestion: (id, patch) =>
      commit((d) => {
        const q = d.questions.find((x) => x.id === id)
        if (q) Object.assign(q, patch)
      }),

    setType: (id, type) =>
      commit((d) => {
        const q = d.questions.find((x) => x.id === id)
        if (!q || q.type === type) return
        q.type = type
        q.multipleCorrect = false
        q.answers = adaptAnswers(q, type)
      }),

    addQuestions: (qs) => {
      if (qs.length === 0) return
      commit((d) => d.questions.push(...qs))
      set({ activeId: qs[qs.length - 1].id })
    },

    patchAnswer: (qid, aid, patch) =>
      commit((d) => {
        const a = d.questions.find((x) => x.id === qid)?.answers.find((x) => x.id === aid)
        if (a) Object.assign(a, patch)
      }),

    toggleCorrect: (qid, aid) =>
      commit((d) => {
        const q = d.questions.find((x) => x.id === qid)
        if (!q) return
        if (q.multipleCorrect) {
          const a = q.answers.find((x) => x.id === aid)
          if (a) a.isCorrect = !a.isCorrect
        } else {
          q.answers.forEach((a) => (a.isCorrect = a.id === aid))
        }
      }),

    addAnswer: (qid) =>
      commit((d) => {
        const q = d.questions.find((x) => x.id === qid)
        if (q && q.answers.length < 6) q.answers.push(createAnswer(q.answers.length % 4))
      }),

    setPoints: (qid, mode) =>
      commit((d) => {
        const q = d.questions.find((x) => x.id === qid)
        if (q) q.pointsMode = mode
      }),

    undo: () =>
      set((s) => {
        if (s.past.length === 0) return s
        const previous = s.past[s.past.length - 1]
        return {
          quiz: previous,
          past: s.past.slice(0, -1),
          future: [clone(s.quiz), ...s.future].slice(0, MAX_HISTORY),
          saveState: 'saving',
        }
      }),

    redo: () =>
      set((s) => {
        if (s.future.length === 0) return s
        const next = s.future[0]
        return {
          quiz: next,
          past: [...s.past, clone(s.quiz)].slice(-MAX_HISTORY),
          future: s.future.slice(1),
          saveState: 'saving',
        }
      }),

    toggleDark: () =>
      set((s) => {
        const dark = !s.dark
        if (typeof localStorage !== 'undefined') localStorage.setItem('quizoo_creator_dark', dark ? '1' : '0')
        return { dark }
      }),

    load: async (id) => {
      if (id) {
        const loaded = await loadQuiz(id)
        if (loaded) {
          set({ quiz: loaded, activeId: loaded.questions[0]?.id ?? '', past: [], future: [], saveState: 'idle' })
          return
        }
      }
      const fresh = createEmptyQuiz()
      set({ quiz: fresh, activeId: fresh.questions[0].id, past: [], future: [], saveState: 'idle' })
    },

    save: async () => {
      set({ saveState: 'saving' })
      const { quiz } = get()
      const { updatedAt } = await saveQuiz(quiz)
      set((s) => ({ quiz: { ...s.quiz, updatedAt }, saveState: 'saved' }))
    },
  }
})
