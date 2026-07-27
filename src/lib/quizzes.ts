import { supabase } from './supabase'

export interface AnswerDraft {
  id: string
  label: string
  is_correct: boolean
}

export interface QuestionDraft {
  id: string
  prompt: string
  time_limit: number
  points: number
  answers: AnswerDraft[]
}

export interface QuizSummary {
  id: string
  title: string
  description: string | null
  is_published: boolean
  updated_at: string
  question_count: number
}

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

export function emptyAnswer(): AnswerDraft {
  return { id: uid(), label: '', is_correct: false }
}

export function emptyQuestion(): QuestionDraft {
  return {
    id: uid(),
    prompt: '',
    time_limit: 20,
    points: 1000,
    answers: [
      { id: uid(), label: '', is_correct: true },
      { id: uid(), label: '', is_correct: false },
      { id: uid(), label: '', is_correct: false },
      { id: uid(), label: '', is_correct: false },
    ],
  }
}

/** Lista os quizzes do usuário logado, com a contagem de perguntas. */
export async function listQuizzes(): Promise<{ data: QuizSummary[]; error: string | null }> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('id, title, description, is_published, updated_at, questions(count)')
    .order('updated_at', { ascending: false })

  if (error) return { data: [], error: error.message }

  const mapped: QuizSummary[] = (data ?? []).map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    is_published: q.is_published,
    updated_at: q.updated_at,
    // supabase retorna [{ count }] para o agregado aninhado
    question_count: Array.isArray(q.questions) ? (q.questions[0]?.count ?? 0) : 0,
  }))
  return { data: mapped, error: null }
}

/** Cria um quiz vazio e devolve o id. */
export async function createQuiz(ownerId: string): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({ owner: ownerId, title: 'Quiz sem título' })
    .select('id')
    .single()
  if (error) return { id: null, error: error.message }
  return { id: data.id, error: null }
}

/** Carrega um quiz com todas as perguntas e respostas, prontas para edição. */
export async function getQuizForEdit(quizId: string): Promise<{
  quiz: { id: string; title: string; description: string | null } | null
  questions: QuestionDraft[]
  error: string | null
}> {
  const { data: quiz, error: qErr } = await supabase
    .from('quizzes')
    .select('id, title, description')
    .eq('id', quizId)
    .single()
  if (qErr) return { quiz: null, questions: [], error: qErr.message }

  const { data: questions, error: qsErr } = await supabase
    .from('questions')
    .select('id, prompt, time_limit, points, position, answers(id, label, is_correct, position)')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true })
  if (qsErr) return { quiz, questions: [], error: qsErr.message }

  const drafts: QuestionDraft[] = (questions ?? []).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    time_limit: q.time_limit,
    points: q.points,
    answers: (q.answers ?? [])
      .sort((a, b) => a.position - b.position)
      .map((a) => ({ id: a.id, label: a.label, is_correct: a.is_correct })),
  }))

  return { quiz, questions: drafts, error: null }
}

/** Salva o quiz: atualiza o cabeçalho e regrava todas as perguntas/respostas. */
export async function saveQuiz(
  quizId: string,
  header: { title: string; description: string },
  questions: QuestionDraft[],
): Promise<{ error: string | null }> {
  const up = await supabase
    .from('quizzes')
    .update({ title: header.title, description: header.description, updated_at: new Date().toISOString() })
    .eq('id', quizId)
  if (up.error) return { error: up.error.message }

  const del = await supabase.from('questions').delete().eq('quiz_id', quizId)
  if (del.error) return { error: del.error.message }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const { data: qRow, error: qErr } = await supabase
      .from('questions')
      .insert({ quiz_id: quizId, position: i, prompt: q.prompt, time_limit: q.time_limit, points: q.points })
      .select('id')
      .single()
    if (qErr) return { error: qErr.message }

    const rows = q.answers
      .filter((a) => a.label.trim() !== '')
      .map((a, idx) => ({ question_id: qRow.id, position: idx, label: a.label, is_correct: a.is_correct }))
    if (rows.length) {
      const insErr = (await supabase.from('answers').insert(rows)).error
      if (insErr) return { error: insErr.message }
    }
  }
  return { error: null }
}

export async function deleteQuiz(quizId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId)
  return { error: error ? error.message : null }
}
