import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'

// A partir de um enunciado (e opcionalmente a resposta certa), a IA cria
// 4 alternativas (com uma correta) + uma explicação curta.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'A chave da IA (DEEPSEEK_API_KEY) não está configurada.' })

  const { prompt, correct } = (req.body ?? {}) as { prompt?: string; correct?: string }
  const p = (prompt ?? '').trim()
  if (p.length < 5) return res.status(400).json({ error: 'Escreva o enunciado da pergunta primeiro.' })

  const system =
    'Você é um professor que cria questões de múltipla escolha em português do Brasil. ' +
    'Para o enunciado dado, produza EXATAMENTE 4 alternativas curtas, com apenas UMA correta e 3 ' +
    'distratores plausíveis (nada absurdo, nada repetido). ' +
    (correct && correct.trim()
      ? `A resposta correta deve ser: "${correct.trim()}". `
      : 'Escolha você a resposta correta. ') +
    'Responda SEMPRE só em JSON válido: {"options":[string,string,string,string],"correctIndex":number,"explanation":string}. ' +
    'explanation é uma frase curta explicando por que a correta está certa.'

  try {
    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Enunciado: ${p}` },
        ],
      }),
    })
    if (!resp.ok) {
      const msg = resp.status === 402 ? 'A conta da IA está sem créditos (402).' : `A IA retornou erro ${resp.status}.`
      return res.status(502).json({ error: msg })
    }
    const data = (await resp.json()) as { choices?: { message?: { content?: string } }[] }
    const content = data.choices?.[0]?.message?.content
    if (!content) return res.status(502).json({ error: 'A IA não retornou um resultado válido.' })

    let parsed: { options?: string[]; correctIndex?: number; explanation?: string }
    try {
      parsed = JSON.parse(content)
    } catch {
      return res.status(502).json({ error: 'A IA não retornou um JSON válido.' })
    }
    const options = (parsed.options ?? []).map((o) => String(o)).slice(0, 4)
    while (options.length < 4) options.push('')
    if (options.filter((o) => o.trim()).length < 2) {
      return res.status(502).json({ error: 'A IA não conseguiu gerar as alternativas.' })
    }
    const correctIndex = Math.min(3, Math.max(0, Number(parsed.correctIndex) || 0))
    return res.status(200).json({ options, correctIndex, explanation: (parsed.explanation ?? '').toString().slice(0, 400) })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao chamar a IA.' })
  }
}
