import { createQuestion } from '../data/mockQuiz'
import type { Question } from '../types/quiz'

// Serviço de IA isolado. Hoje é um MOCK; troque por uma chamada real
// (ex.: /api/generate-quiz) mantendo a mesma assinatura.

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface AiGenerateParams {
  topic: string
  count: number
  language?: string
}

/** Gera perguntas completas (mock) a partir de um tema. */
export async function generateQuestions({ topic, count }: AiGenerateParams): Promise<Question[]> {
  await delay(1200) // simula o tempo da IA
  const n = Math.min(20, Math.max(1, count))
  return Array.from({ length: n }, (_, i) => {
    const q = createQuestion('quiz')
    q.text = `(${i + 1}) Pergunta gerada sobre "${topic}"`
    q.explanation = 'Explicação de exemplo gerada pela IA (mock).'
    q.answers = q.answers.map((a, idx) => ({
      ...a,
      text: `Alternativa ${idx + 1}`,
      isCorrect: idx === 0,
    }))
    return q
  })
}
