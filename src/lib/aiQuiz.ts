import type { QuestionDraft } from './quizzes'

export type Difficulty = 'facil' | 'medio' | 'dificil'

interface ApiQuestion {
  prompt: string
  options: string[]
  correctIndex: number
}

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

/** Chama a IA (função serverless) para gerar perguntas a partir do material. */
export async function generateQuizFromMaterial(
  material: string,
  difficulty: Difficulty,
  count: number,
): Promise<{ title: string; questions: QuestionDraft[]; error: string | null }> {
  let res: Response
  try {
    res = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material, difficulty, count }),
    })
  } catch {
    return { title: '', questions: [], error: 'Não foi possível falar com o servidor de IA.' }
  }

  const data = (await res.json().catch(() => ({}))) as {
    title?: string
    questions?: ApiQuestion[]
    error?: string
  }
  if (!res.ok) {
    return { title: '', questions: [], error: data.error ?? 'Erro ao gerar o quiz.' }
  }

  const questions: QuestionDraft[] = (data.questions ?? []).map((q) => ({
    id: uid(),
    type: 'multiple',
    prompt: q.prompt,
    time_limit: 20,
    points: 1000,
    image_url: null,
    answers: q.options.map((label, i) => ({ id: uid(), label, is_correct: i === q.correctIndex })),
  }))

  return { title: data.title ?? '', questions, error: null }
}
