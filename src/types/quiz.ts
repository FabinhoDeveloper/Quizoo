// Modelo de dados do editor de quiz (creator). Isolado da UI e do backend.

export type QuestionType =
  | 'quiz' // múltipla escolha
  | 'true_false' // verdadeiro ou falso
  | 'typed' // resposta digitada
  | 'poll' // enquete (sem resposta certa)
  | 'word_cloud' // nuvem de palavras
  | 'puzzle' // ordenar
  | 'slide' // slide informativo

export type PointsMode = 'standard' | 'double' | 'none'
export type MediaType = 'image' | 'video' | 'none'
export type Visibility = 'private' | 'public'

export interface QuizMedia {
  type: MediaType
  url: string
  startAt: number // vídeo: segundo de início
  endAt: number // vídeo: segundo de fim (0 = até o final)
}

export interface Answer {
  id: string
  text: string
  image: string | null
  isCorrect: boolean
  colorIndex: number // 0..3 → cor do card
}

export interface Question {
  id: string
  type: QuestionType
  text: string
  media: QuizMedia
  timeLimitSec: number | null // null = sem tempo
  pointsMode: PointsMode
  multipleCorrect: boolean
  explanation: string
  answers: Answer[]
}

export interface QuizTheme {
  palette: string
  background: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  coverImage: string | null
  theme: QuizTheme
  visibility: Visibility
  language: string
  tags: string[]
  createdAt: string
  updatedAt: string
  questions: Question[]
}

// Metadados por tipo de pergunta — usados no seletor do painel direito.
export const QUESTION_TYPE_META: Record<
  QuestionType,
  { label: string; short: string; hasAnswers: boolean; hasCorrect: boolean }
> = {
  quiz: { label: 'Quiz', short: 'Múltipla escolha', hasAnswers: true, hasCorrect: true },
  true_false: { label: 'Verdadeiro ou Falso', short: 'Duas opções', hasAnswers: true, hasCorrect: true },
  typed: { label: 'Resposta digitada', short: 'O jogador digita', hasAnswers: true, hasCorrect: true },
  poll: { label: 'Enquete', short: 'Sem resposta certa', hasAnswers: true, hasCorrect: false },
  word_cloud: { label: 'Nuvem de palavras', short: 'Respostas viram nuvem', hasAnswers: false, hasCorrect: false },
  puzzle: { label: 'Ordenar', short: 'Coloque na ordem certa', hasAnswers: true, hasCorrect: true },
  slide: { label: 'Slide informativo', short: 'Só conteúdo, sem resposta', hasAnswers: false, hasCorrect: false },
}
