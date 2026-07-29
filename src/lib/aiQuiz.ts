import type { QuestionDraft } from './quizzes'

export type Difficulty = 'facil' | 'medio' | 'dificil'

interface ApiQuestion {
  prompt: string
  options: string[]
  correctIndex: number
}

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

/** Segundos de resposta em 'auto': quanto maior a pergunta, mais tempo. */
export type TimeOption = number | 'auto'

function autoTime(prompt: string, options: string[]): number {
  const chars = prompt.length + options.reduce((s, o) => s + o.length, 0)
  if (chars < 70) return 15
  if (chars < 130) return 20
  if (chars < 200) return 30
  if (chars < 300) return 45
  return 60
}

/** Chama a IA (função serverless) para gerar perguntas a partir de material OU de uma URL. */
export async function generateQuizFromMaterial(
  source: { material?: string; url?: string },
  difficulty: Difficulty,
  count: number,
  time: TimeOption = 'auto',
): Promise<{ title: string; questions: QuestionDraft[]; error: string | null }> {
  let res: Response
  try {
    res = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material: source.material, url: source.url, difficulty, count }),
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
    time_limit: time === 'auto' ? autoTime(q.prompt, q.options) : time,
    points: 1000,
    image_url: null,
    answers: q.options.map((label, i) => ({ id: uid(), label, is_correct: i === q.correctIndex })),
  }))

  return { title: data.title ?? '', questions, error: null }
}
