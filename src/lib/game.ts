import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { QuestionType } from './quizzes'

export type GameStatus = 'lobby' | 'question' | 'reveal' | 'ended'

/** Normaliza texto para comparar respostas digitadas (minúsculas, sem acento/pontuação). */
export function normalizeText(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface OptionPayload {
  id: string
  label: string
  index: number
}

export interface QuestionPayload {
  questionId: string
  type: QuestionType
  position: number
  total: number
  prompt: string
  imageUrl?: string | null
  options: OptionPayload[]
  timeLimit: number
  points: number
  startedAt: string
}

export interface LeaderRow {
  playerId: string
  nickname: string
  score: number
  avatar?: string | null
}

export interface RevealPayload {
  correctAnswerId: string | null
  acceptedAnswers?: string[]
  pollCounts?: { label: string; count: number }[]
  leaderboard: LeaderRow[]
  final?: boolean
}

export interface GameRow {
  id: string
  quiz_id: string
  host: string
  pin: string
  status: GameStatus
  current_position: number
  current_payload: QuestionPayload | null
  reveal: RevealPayload | null
  feedback_mode: 'immediate' | 'end'
}

/** Pergunta completa do lado do host — inclui a resposta certa, NUNCA enviada aos jogadores. */
export interface HostQuestion {
  id: string
  type: QuestionType
  prompt: string
  time_limit: number
  points: number
  image_url?: string | null
  options: { id: string; label: string; is_correct: boolean }[]
}

export interface Player {
  id: string
  nickname: string
  score: number
  avatar?: string | null
}

const genPin = () => String(Math.floor(100000 + Math.random() * 900000))

/** Cria uma partida a partir de um quiz e devolve o PIN e as perguntas (com gabarito, para o host). */
export async function hostGame(
  quizId: string,
  hostId: string,
): Promise<{ gameId: string; pin: string; questions: HostQuestion[]; error: string | null }> {
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, type, prompt, time_limit, points, position, image_url, answers(id, label, is_correct, position)')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true })
  if (qErr) return { gameId: '', pin: '', questions: [], error: qErr.message }
  if (!questions || questions.length === 0)
    return { gameId: '', pin: '', questions: [], error: 'Este quiz ainda não tem perguntas.' }

  const { data: quizRow } = await supabase.from('quizzes').select('feedback_mode').eq('id', quizId).single()
  const feedbackMode = (quizRow?.feedback_mode ?? 'immediate') as 'immediate' | 'end'

  const hostQuestions: HostQuestion[] = questions.map((q) => ({
    id: q.id,
    type: (q.type ?? 'multiple') as QuestionType,
    prompt: q.prompt,
    time_limit: q.time_limit,
    points: q.points,
    image_url: q.image_url ?? null,
    options: (q.answers ?? [])
      .filter((a) => a.label?.trim())
      .sort((a, b) => a.position - b.position)
      .map((a) => ({ id: a.id, label: a.label, is_correct: a.is_correct })),
  }))

  // tenta alguns PINs até achar um livre
  for (let attempt = 0; attempt < 6; attempt++) {
    const pin = genPin()
    const { data, error } = await supabase
      .from('games')
      .insert({ quiz_id: quizId, host: hostId, pin, status: 'lobby', current_position: -1, feedback_mode: feedbackMode })
      .select('id')
      .single()
    if (!error && data) return { gameId: data.id, pin, questions: hostQuestions, error: null }
    if (error && !error.message.toLowerCase().includes('duplicate')) {
      return { gameId: '', pin: '', questions: [], error: error.message }
    }
  }
  return { gameId: '', pin: '', questions: [], error: 'Não foi possível gerar um PIN. Tente de novo.' }
}

/** Recarrega as perguntas (com gabarito) de um quiz — usado pelo host ao abrir/atualizar a página. */
export async function loadHostQuestions(quizId: string): Promise<HostQuestion[]> {
  const { data } = await supabase
    .from('questions')
    .select('id, type, prompt, time_limit, points, position, image_url, answers(id, label, is_correct, position)')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true })
  return (data ?? []).map((q) => ({
    id: q.id,
    type: (q.type ?? 'multiple') as QuestionType,
    prompt: q.prompt,
    time_limit: q.time_limit,
    points: q.points,
    image_url: q.image_url ?? null,
    options: (q.answers ?? [])
      .filter((a) => a.label?.trim())
      .sort((a, b) => a.position - b.position)
      .map((a) => ({ id: a.id, label: a.label, is_correct: a.is_correct })),
  }))
}

/** Busca as respostas enviadas por todos os jogadores para uma pergunta específica. */
export async function fetchQuestionAnswers(
  gameId: string,
  questionId: string,
): Promise<{ player_id: string; answer_id: string | null; response_ms: number; typed_text: string | null }[]> {
  const { data } = await supabase
    .from('game_answers')
    .select('player_id, answer_id, response_ms, typed_text')
    .eq('game_id', gameId)
    .eq('question_id', questionId)
  return data ?? []
}

/** Todas as respostas enviadas na partida (para relatórios). */
export async function fetchAllGameAnswers(
  gameId: string,
): Promise<{ player_id: string; question_id: string; answer_id: string | null; typed_text: string | null }[]> {
  const { data } = await supabase
    .from('game_answers')
    .select('player_id, question_id, answer_id, typed_text')
    .eq('game_id', gameId)
  return data ?? []
}

export async function getGame(gameId: string): Promise<{ game: GameRow | null; error: string | null }> {
  const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single()
  return { game: (data as GameRow) ?? null, error: error ? error.message : null }
}

export async function getPlayers(gameId: string): Promise<Player[]> {
  const { data } = await supabase
    .from('game_players')
    .select('id, nickname, score, avatar')
    .eq('game_id', gameId)
    .order('joined_at', { ascending: true })
  return (data as Player[]) ?? []
}

/** Jogador entra numa partida pelo PIN (só durante o lobby). */
export async function joinGame(
  pin: string,
  nickname: string,
  avatar?: string | null,
): Promise<{ gameId: string; playerId: string; error: string | null }> {
  const { data: game, error } = await supabase
    .from('games')
    .select('id, status')
    .eq('pin', pin)
    .maybeSingle()
  if (error) return { gameId: '', playerId: '', error: error.message }
  if (!game) return { gameId: '', playerId: '', error: 'PIN não encontrado.' }
  if (game.status !== 'lobby') return { gameId: '', playerId: '', error: 'Este jogo já começou.' }

  const playerId = crypto.randomUUID()
  const { error: insErr } = await supabase
    .from('game_players')
    .insert({ id: playerId, game_id: game.id, nickname: nickname.trim().slice(0, 20) || 'Jogador', avatar: avatar ?? null })
  if (insErr) return { gameId: '', playerId: '', error: insErr.message }
  return { gameId: game.id, playerId, error: null }
}

export async function submitAnswer(
  gameId: string,
  playerId: string,
  questionId: string,
  answerId: string | null,
  responseMs: number,
  typedText?: string,
) {
  await supabase.from('game_answers').insert({
    game_id: gameId,
    player_id: playerId,
    question_id: questionId,
    answer_id: answerId,
    response_ms: responseMs,
    typed_text: typedText ?? null,
  })
}

// ---------- Controles do host (escrevem no games row, fonte da verdade) ----------

function sanitize(q: HostQuestion, position: number, total: number): QuestionPayload {
  return {
    questionId: q.id,
    type: q.type,
    position,
    total,
    prompt: q.prompt,
    imageUrl: q.image_url ?? null,
    timeLimit: q.time_limit,
    points: q.points,
    startedAt: new Date().toISOString(),
    // Em "digite a resposta" não mandamos alternativas (o aluno digita).
    options: q.type === 'typed' ? [] : q.options.map((o, i) => ({ id: o.id, label: o.label, index: i })),
  }
}

export async function hostShowQuestion(gameId: string, q: HostQuestion, position: number, total: number) {
  await supabase
    .from('games')
    .update({
      status: 'question',
      current_position: position,
      current_payload: sanitize(q, position, total),
      reveal: null,
    })
    .eq('id', gameId)
}

export async function hostReveal(
  gameId: string,
  correctAnswerId: string | null,
  leaderboard: LeaderRow[],
  extra?: { acceptedAnswers?: string[]; pollCounts?: { label: string; count: number }[] },
) {
  await supabase
    .from('games')
    .update({
      status: 'reveal',
      reveal: { correctAnswerId, acceptedAnswers: extra?.acceptedAnswers, pollCounts: extra?.pollCounts, leaderboard },
    })
    .eq('id', gameId)
}

export async function hostEnd(gameId: string, leaderboard: LeaderRow[]) {
  await supabase
    .from('games')
    .update({ status: 'ended', reveal: { correctAnswerId: null, leaderboard, final: true } })
    .eq('id', gameId)
}

export async function persistScores(players: LeaderRow[]) {
  await Promise.all(players.map((p) => supabase.from('game_players').update({ score: p.score }).eq('id', p.playerId)))
}

export function awardPoints(correct: boolean, points: number, responseMs: number, timeLimitMs: number): number {
  if (!correct) return 0
  const frac = Math.min(1, Math.max(0, responseMs / timeLimitMs))
  return Math.round(points * (1 - 0.5 * frac))
}

// ---------- Assinaturas de tempo real ----------

export function openGameChannel(
  gameId: string,
  handlers: {
    onGame?: (g: GameRow) => void
    onPlayerJoin?: (p: Player) => void
    onAnswer?: (a: { player_id: string; question_id: string; answer_id: string | null; response_ms: number }) => void
  },
): RealtimeChannel {
  const channel = supabase.channel(`game-${gameId}-${Math.random().toString(36).slice(2, 7)}`)

  if (handlers.onGame) {
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
      (payload) => handlers.onGame!(payload.new as GameRow),
    )
  }
  if (handlers.onPlayerJoin) {
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'game_players', filter: `game_id=eq.${gameId}` },
      (payload) => {
        const r = payload.new as { id: string; nickname: string; score: number; avatar: string | null }
        handlers.onPlayerJoin!({ id: r.id, nickname: r.nickname, score: r.score ?? 0, avatar: r.avatar ?? null })
      },
    )
  }
  if (handlers.onAnswer) {
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'game_answers', filter: `game_id=eq.${gameId}` },
      (payload) =>
        handlers.onAnswer!(
          payload.new as { player_id: string; question_id: string; answer_id: string | null; response_ms: number },
        ),
    )
  }

  channel.subscribe()
  return channel
}

export function closeChannel(channel: RealtimeChannel | null) {
  if (channel) supabase.removeChannel(channel)
}
