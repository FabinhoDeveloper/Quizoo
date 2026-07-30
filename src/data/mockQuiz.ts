import type { Answer, Question, QuestionType, Quiz } from '../types/quiz'

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

export function createAnswer(colorIndex: number, text = ''): Answer {
  return { id: uid(), text, image: null, isCorrect: false, colorIndex }
}

/** Cria uma pergunta em branco já adequada ao tipo escolhido. */
export function createQuestion(type: QuestionType = 'quiz'): Question {
  const base: Omit<Question, 'answers'> = {
    id: uid(),
    type,
    text: '',
    media: { type: 'none', url: '', startAt: 0, endAt: 0 },
    timeLimitSec: 20,
    pointsMode: 'standard',
    multipleCorrect: false,
    explanation: '',
  }
  if (type === 'true_false') {
    return {
      ...base,
      answers: [
        { id: uid(), text: 'Verdadeiro', image: null, isCorrect: true, colorIndex: 0 },
        { id: uid(), text: 'Falso', image: null, isCorrect: false, colorIndex: 1 },
      ],
    }
  }
  if (type === 'slide' || type === 'word_cloud') {
    return { ...base, answers: [] }
  }
  if (type === 'typed') {
    return { ...base, answers: [{ ...createAnswer(0), isCorrect: true }] }
  }
  // quiz | poll | puzzle → 4 cards (2 opcionais)
  return { ...base, answers: [0, 1, 2, 3].map((i) => createAnswer(i)) }
}

export function createEmptyQuiz(): Quiz {
  const now = new Date().toISOString()
  return {
    id: uid(),
    title: '',
    description: '',
    coverImage: null,
    theme: { palette: 'default', background: '#F7F8FA' },
    visibility: 'private',
    language: 'pt-BR',
    tags: [],
    createdAt: now,
    updatedAt: now,
    questions: [createQuestion('quiz')],
  }
}

/** Quiz de exemplo (única fonte de dados fake). */
export const mockQuiz: Quiz = (() => {
  const q = createEmptyQuiz()
  q.title = 'Quiz de exemplo — Sistema Solar'
  q.questions = [
    {
      ...createQuestion('quiz'),
      text: 'Qual é o maior planeta do Sistema Solar?',
      explanation: 'Júpiter é o maior planeta, com mais de 1300 vezes o volume da Terra.',
      answers: [
        { id: '1', text: 'Marte', image: null, isCorrect: false, colorIndex: 0 },
        { id: '2', text: 'Júpiter', image: null, isCorrect: true, colorIndex: 1 },
        { id: '3', text: 'Terra', image: null, isCorrect: false, colorIndex: 2 },
        { id: '4', text: 'Vênus', image: null, isCorrect: false, colorIndex: 3 },
      ],
    },
    {
      ...createQuestion('true_false'),
      text: 'O Sol é uma estrela.',
      answers: [
        { id: '5', text: 'Verdadeiro', image: null, isCorrect: true, colorIndex: 0 },
        { id: '6', text: 'Falso', image: null, isCorrect: false, colorIndex: 1 },
      ],
    },
  ]
  return q
})()
