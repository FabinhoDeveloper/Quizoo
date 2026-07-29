import { supabase } from './supabase'

export type QuestionType = 'multiple' | 'truefalse' | 'typed' | 'poll'
export type FeedbackMode = 'immediate' | 'end'

export interface AnswerDraft {
  id: string
  label: string
  is_correct: boolean
}

export interface QuestionDraft {
  id: string
  type: QuestionType
  prompt: string
  time_limit: number
  points: number
  image_url: string | null
  multiple: boolean // múltipla escolha com VÁRIAS corretas
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

export function newQuestion(type: QuestionType = 'multiple'): QuestionDraft {
  // Tempo padrão por tipo: V/F é rápido; digitar precisa de mais tempo.
  const defaultTime = type === 'truefalse' ? 15 : type === 'typed' ? 30 : 20
  const base = { id: uid(), type, prompt: '', time_limit: defaultTime, points: 1000, image_url: null, multiple: false }
  if (type === 'truefalse') {
    return {
      ...base,
      answers: [
        { id: uid(), label: 'Verdadeiro', is_correct: true },
        { id: uid(), label: 'Falso', is_correct: false },
      ],
    }
  }
  if (type === 'typed') {
    // Para "digite a resposta", cada answer é uma resposta ACEITA (todas is_correct).
    return { ...base, answers: [{ id: uid(), label: '', is_correct: true }] }
  }
  if (type === 'poll') {
    // Enquete: sem resposta certa (nenhuma is_correct).
    return {
      ...base,
      answers: [
        { id: uid(), label: '', is_correct: false },
        { id: uid(), label: '', is_correct: false },
        { id: uid(), label: '', is_correct: false },
        { id: uid(), label: '', is_correct: false },
      ],
    }
  }
  return {
    ...base,
    answers: [
      { id: uid(), label: '', is_correct: true },
      { id: uid(), label: '', is_correct: false },
      { id: uid(), label: '', is_correct: false },
      { id: uid(), label: '', is_correct: false },
    ],
  }
}

export function emptyQuestion(): QuestionDraft {
  return newQuestion('multiple')
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
  quiz: {
    id: string
    title: string
    description: string | null
    is_published: boolean
    feedback_mode: FeedbackMode
    theme: string
  } | null
  questions: QuestionDraft[]
  error: string | null
}> {
  const { data: quiz, error: qErr } = await supabase
    .from('quizzes')
    .select('id, title, description, is_published, feedback_mode')
    .eq('id', quizId)
    .single()
  if (qErr) return { quiz: null, questions: [], error: qErr.message }

  // theme é buscado à parte e tolera a coluna ainda não existir (migration pendente)
  let theme = 'default'
  const themeRes = await supabase.from('quizzes').select('theme').eq('id', quizId).single()
  if (!themeRes.error && themeRes.data) theme = (themeRes.data as { theme?: string }).theme ?? 'default'
  const quizOut = { ...(quiz as Record<string, unknown>), theme } as {
    id: string
    title: string
    description: string | null
    is_published: boolean
    feedback_mode: FeedbackMode
    theme: string
  }

  const { data: questions, error: qsErr } = await supabase
    .from('questions')
    .select('id, type, prompt, time_limit, points, position, image_url, multiple, answers(id, label, is_correct, position)')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true })
  if (qsErr) return { quiz: quizOut, questions: [], error: qsErr.message }

  const drafts: QuestionDraft[] = (questions ?? []).map((q) => ({
    id: q.id,
    type: (q.type ?? 'multiple') as QuestionType,
    prompt: q.prompt,
    time_limit: q.time_limit,
    points: q.points,
    image_url: q.image_url ?? null,
    multiple: q.multiple ?? false,
    answers: (q.answers ?? [])
      .sort((a, b) => a.position - b.position)
      .map((a) => ({ id: a.id, label: a.label, is_correct: a.is_correct })),
  }))

  return { quiz: quizOut, questions: drafts, error: null }
}

/** Salva o quiz: atualiza o cabeçalho e regrava todas as perguntas/respostas. */
export async function saveQuiz(
  quizId: string,
  header: { title: string; description: string; feedback_mode?: FeedbackMode; theme?: string },
  questions: QuestionDraft[],
): Promise<{ error: string | null }> {
  const up = await supabase
    .from('quizzes')
    .update({
      title: header.title,
      description: header.description,
      feedback_mode: header.feedback_mode ?? 'immediate',
      updated_at: new Date().toISOString(),
    })
    .eq('id', quizId)
  if (up.error) return { error: up.error.message }

  // theme à parte: tolera a coluna ainda não existir (migration pendente)
  await supabase.from('quizzes').update({ theme: header.theme ?? 'default' }).eq('id', quizId)

  const del = await supabase.from('questions').delete().eq('quiz_id', quizId)
  if (del.error) return { error: del.error.message }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const { data: qRow, error: qErr } = await supabase
      .from('questions')
      .insert({ quiz_id: quizId, position: i, type: q.type, prompt: q.prompt, time_limit: q.time_limit, points: q.points, image_url: q.image_url, multiple: q.type === 'multiple' ? q.multiple : false })
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

// ---------- Biblioteca pública ----------

export interface PublicQuiz {
  id: string
  title: string
  description: string | null
  question_count: number
  author: string
}

/** Publica ou despublica um quiz (torna-o visível na biblioteca pública). */
export async function setPublished(quizId: string, isPublished: boolean): Promise<{ error: string | null }> {
  const { error } = await supabase.from('quizzes').update({ is_published: isPublished }).eq('id', quizId)
  return { error: error ? error.message : null }
}

/** Lista os quizzes publicados (visíveis a todos), com autor e nº de perguntas. */
export async function listPublicQuizzes(): Promise<{ data: PublicQuiz[]; error: string | null }> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('id, title, description, owner, questions(count)')
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(60)
  if (error) return { data: [], error: error.message }

  const owners = [...new Set((data ?? []).map((q) => q.owner))]
  const nameById = new Map<string, string>()
  if (owners.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', owners)
    ;(profiles ?? []).forEach((p) => nameById.set(p.id, p.username ?? 'Anônimo'))
  }

  const mapped: PublicQuiz[] = (data ?? []).map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    question_count: Array.isArray(q.questions) ? (q.questions[0]?.count ?? 0) : 0,
    author: nameById.get(q.owner) ?? 'Anônimo',
  }))
  return { data: mapped, error: null }
}

/** Duplica um quiz (público ou próprio) para a conta do usuário. Devolve o id da cópia. */
export async function cloneQuiz(sourceQuizId: string, ownerId: string): Promise<{ id: string | null; error: string | null }> {
  const { quiz, questions, error } = await getQuizForEdit(sourceQuizId)
  if (error || !quiz) return { id: null, error: error ?? 'Quiz não encontrado.' }

  const { id, error: createErr } = await createQuiz(ownerId)
  if (createErr || !id) return { id: null, error: createErr ?? 'Não foi possível criar a cópia.' }

  const { error: saveErr } = await saveQuiz(
    id,
    { title: `${quiz.title} (cópia)`, description: quiz.description ?? '', feedback_mode: quiz.feedback_mode, theme: quiz.theme },
    questions,
  )
  if (saveErr) return { id: null, error: saveErr }
  return { id, error: null }
}
