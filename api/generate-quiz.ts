import type { VercelRequest, VercelResponse } from '@vercel/node'

type Difficulty = 'facil' | 'medio' | 'dificil'

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: 'nível FÁCIL (perguntas diretas, de memorização de fatos básicos do material)',
  medio: 'nível INTERMEDIÁRIO (exigem compreensão e relacionar ideias do material)',
  dificil: 'nível DIFÍCIL (exigem análise, aplicação e raciocínio mais profundo sobre o material)',
}

// DeepSeek é compatível com a API da OpenAI (chat/completions).
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'

/** Busca o texto de uma URL. Wikipédia usa a API oficial (texto limpo). */
async function fetchUrlText(rawUrl: string): Promise<{ text: string; error?: string }> {
  let u: URL
  try {
    u = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
  } catch {
    return { text: '', error: 'URL inválida.' }
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { text: '', error: 'URL inválida.' }

  try {
    // Wikipédia: pega o texto puro do artigo via API.
    const wiki = u.hostname.match(/^([a-z]+)\.wikipedia\.org$/i)
    if (wiki && u.pathname.startsWith('/wiki/')) {
      const lang = wiki[1]
      const title = decodeURIComponent(u.pathname.replace('/wiki/', ''))
      const api = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}`
      const r = await fetch(api, { headers: { 'User-Agent': 'Quizoo/1.0 (quiz generator)' } })
      const j = (await r.json()) as { query?: { pages?: Record<string, { extract?: string }> } }
      const pages = j.query?.pages ?? {}
      const extract = Object.values(pages)[0]?.extract ?? ''
      if (extract.trim().length > 40) return { text: extract }
      // se não veio, cai no fetch genérico abaixo
    }

    const r = await fetch(u.toString(), { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Quizoo/1.0)' } })
    if (!r.ok) return { text: '', error: `Não consegui acessar a página (${r.status}).` }
    const html = await r.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#\d+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return { text }
  } catch {
    return { text: '', error: 'Não consegui acessar essa URL.' }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' })
  }
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'A chave da IA (DEEPSEEK_API_KEY) não está configurada no servidor.' })
  }

  const { material, url, difficulty, count } = (req.body ?? {}) as {
    material?: string
    url?: string
    difficulty?: Difficulty
    count?: number
  }

  // Se veio uma URL, busca o texto dela no servidor (evita CORS no navegador).
  let sourceText = material ?? ''
  if (url && url.trim()) {
    const fetched = await fetchUrlText(url.trim())
    if (fetched.error) return res.status(400).json({ error: fetched.error })
    sourceText = fetched.text
  }

  const text = sourceText.slice(0, 120000).trim()
  if (text.length < 40) {
    return res.status(400).json({
      error: url ? 'Não encontrei texto suficiente nessa página.' : 'O material enviado está vazio ou muito curto.',
    })
  }
  const diff: Difficulty = difficulty && difficulty in DIFFICULTY_LABEL ? difficulty : 'medio'
  const n = Math.min(20, Math.max(1, Number(count) || 5))

  const system =
    'Você é um professor especialista em criar quizzes de múltipla escolha em português do Brasil, ' +
    'a partir de um material didático. Cada pergunta tem exatamente 4 alternativas, com apenas UMA correta. ' +
    'As perguntas devem ser respondíveis usando o material fornecido. Evite pegadinhas ambíguas. ' +
    'Responda SEMPRE em JSON válido, sem texto extra, no formato: ' +
    '{"title": string, "questions": [{"prompt": string, "options": [string, string, string, string], "correctIndex": number}]}. ' +
    'O campo correctIndex é o índice (0 a 3) da alternativa correta.'

  const userMsg =
    `Crie ${n} perguntas de ${DIFFICULTY_LABEL[diff]} a partir do material abaixo. ` +
    `Cada pergunta deve ter exatamente 4 alternativas e um único índice correto (0 a 3). ` +
    `Responda apenas com o objeto JSON pedido.\n\n=== MATERIAL ===\n${text}`

  try {
    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMsg },
        ],
      }),
    })

    if (!resp.ok) {
      const detail = await resp.text().catch(() => '')
      const msg =
        resp.status === 401
          ? 'Chave da IA inválida ou sem permissão (401).'
          : resp.status === 402
            ? 'A conta da IA está sem créditos (402).'
            : `A IA retornou erro ${resp.status}.`
      return res.status(502).json({ error: msg, detail: detail.slice(0, 300) })
    }

    const data = (await resp.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return res.status(502).json({ error: 'A IA não retornou um resultado válido.' })
    }

    let parsed: {
      title?: string
      questions?: { prompt: string; options: string[]; correctIndex: number }[]
    }
    try {
      parsed = JSON.parse(content)
    } catch {
      return res.status(502).json({ error: 'A IA não retornou um JSON válido.' })
    }

    // Normaliza: garante 4 alternativas e índice válido
    const questions = (parsed.questions ?? [])
      .filter((q) => q.prompt && Array.isArray(q.options))
      .map((q) => {
        const options = q.options.slice(0, 4)
        while (options.length < 4) options.push('')
        const correctIndex = Math.min(3, Math.max(0, Number(q.correctIndex) || 0))
        return { prompt: q.prompt, options, correctIndex }
      })
      .filter((q) => q.options.filter((o) => o.trim()).length >= 2)

    if (questions.length === 0) {
      return res.status(502).json({ error: 'A IA não conseguiu gerar perguntas a partir deste material.' })
    }

    return res.status(200).json({ title: parsed.title ?? '', questions })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao chamar a IA.'
    return res.status(500).json({ error: message })
  }
}
