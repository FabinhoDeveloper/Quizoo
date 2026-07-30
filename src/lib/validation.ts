import { QUESTION_TYPE_META, type Question, type Quiz } from '../types/quiz'

export interface QuestionValidation {
  questionId: string
  index: number
  issues: string[]
  ok: boolean
}

const filled = (q: Question) => q.answers.filter((a) => a.text.trim() !== '' || a.image)

/** Lista os problemas de uma pergunta (vazio = completa). */
export function validateQuestion(q: Question): string[] {
  const issues: string[] = []
  const meta = QUESTION_TYPE_META[q.type]

  if (q.type === 'slide') {
    if (!q.text.trim()) issues.push('Escreva o conteúdo do slide.')
    return issues
  }
  if (!q.text.trim()) issues.push('Escreva a pergunta.')

  if (q.type === 'word_cloud') return issues // só precisa do enunciado

  if (meta.hasAnswers) {
    const f = filled(q)
    if (q.type === 'typed') {
      if (f.length < 1) issues.push('Adicione ao menos uma resposta aceita.')
    } else if (f.length < 2) {
      issues.push('Preencha ao menos 2 respostas.')
    }
    if (meta.hasCorrect && q.type !== 'typed' && q.type !== 'puzzle') {
      if (!f.some((a) => a.isCorrect)) issues.push('Marque ao menos uma resposta correta.')
    }
  }
  return issues
}

export function validateQuiz(quiz: Quiz): {
  perQuestion: QuestionValidation[]
  incomplete: number
  titleMissing: boolean
  canPublish: boolean
} {
  const perQuestion = quiz.questions.map((q, index) => {
    const issues = validateQuestion(q)
    return { questionId: q.id, index, issues, ok: issues.length === 0 }
  })
  const incomplete = perQuestion.filter((v) => !v.ok).length
  const titleMissing = !quiz.title.trim()
  return { perQuestion, incomplete, titleMissing, canPublish: incomplete === 0 && !titleMissing && quiz.questions.length > 0 }
}
