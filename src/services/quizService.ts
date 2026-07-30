import type { Quiz } from '../types/quiz'

// Camada de dados isolada. Hoje persiste no localStorage (in-memory-like);
// troque o corpo destas funções por chamadas de API/Supabase depois.

const KEY = (id: string) => `quizoo_creator_${id}`
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function saveQuiz(quiz: Quiz): Promise<{ ok: true; updatedAt: string }> {
  await delay(350) // simula latência de rede
  const updatedAt = new Date().toISOString()
  const toSave = { ...quiz, updatedAt }
  try {
    localStorage.setItem(KEY(quiz.id), JSON.stringify(toSave))
  } catch {
    /* cota cheia: ignora, o estado segue em memória */
  }
  return { ok: true, updatedAt }
}

export async function loadQuiz(id: string): Promise<Quiz | null> {
  await delay(150)
  try {
    const raw = localStorage.getItem(KEY(id))
    return raw ? (JSON.parse(raw) as Quiz) : null
  } catch {
    return null
  }
}

/** "Upload" de mídia: por enquanto devolve um data URL local. */
export async function uploadMedia(file: File): Promise<{ url: string }> {
  await delay(200)
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return { url }
}
