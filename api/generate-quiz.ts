import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

type Difficulty = 'facil' | 'medio' | 'dificil'

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: 'nível FÁCIL (perguntas diretas, de memorização de fatos básicos do material)',
  medio: 'nível INTERMEDIÁRIO (exigem compreensão e relacionar ideias do material)',
  dificil: 'nível DIFÍCIL (exigem análise, aplicação e raciocínio mais profundo sobre o material)',
}

const schema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Um título curto para o quiz baseado no tema do material.' },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'O enunciado da pergunta.' },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: 'Exatamente 4 alternativas.',
          },
          correctIndex: { type: 'integer', description: 'Índice (0 a 3) da alternativa correta.' },
        },
        required: ['prompt', 'options', 'correctIndex'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'questions'],
  additionalProperties: false,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'A chave da IA (ANTHROPIC_API_KEY) não está configurada no servidor.' })
  }

  const { material, difficulty, count } = (req.body ?? {}) as {
    material?: string
    difficulty?: Difficulty
    count?: number
  }

  const text = (material ?? '').slice(0, 200000).trim()
  if (text.length < 40) {
    return res.status(400).json({ error: 'O material enviado está vazio ou muito curto.' })
  }
  const diff: Difficulty = difficulty && difficulty in DIFFICULTY_LABEL ? difficulty : 'medio'
  const n = Math.min(20, Math.max(1, Number(count) || 5))

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 8000,
      output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
      system:
        'Você é um professor especialista em criar quizzes de múltipla escolha em português do Brasil, ' +
        'a partir de um material didático. Cada pergunta tem exatamente 4 alternativas, com apenas UMA correta. ' +
        'As perguntas devem ser respondíveis usando o material fornecido. Evite pegadinhas ambíguas.',
      messages: [
        {
          role: 'user',
          content:
            `Crie ${n} perguntas de ${DIFFICULTY_LABEL[diff]} a partir do material abaixo. ` +
            `Cada pergunta deve ter exatamente 4 alternativas e um único índice correto (0 a 3). ` +
            `Responda apenas no formato JSON pedido.\n\n=== MATERIAL ===\n${text}`,
        },
      ],
    })

    if (response.stop_reason === 'refusal') {
      return res.status(400).json({ error: 'A IA recusou gerar a partir deste material.' })
    }

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return res.status(502).json({ error: 'A IA não retornou um resultado válido.' })
    }

    const parsed = JSON.parse(textBlock.text) as {
      title?: string
      questions?: { prompt: string; options: string[]; correctIndex: number }[]
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
