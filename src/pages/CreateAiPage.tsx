import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/quizoo-logo.png'
import { useAuth } from '../context/AuthContext'
import { extractPdfText } from '../lib/pdfExtract'
import { extractPptxText } from '../lib/pptxExtract'
import { generateQuizFromMaterial, type Difficulty, type TimeOption } from '../lib/aiQuiz'
import { createQuiz, saveQuiz } from '../lib/quizzes'

const DIFFICULTIES: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'facil', label: 'Fácil', hint: 'Memorização de fatos básicos' },
  { value: 'medio', label: 'Intermediário', hint: 'Compreensão e relações' },
  { value: 'dificil', label: 'Difícil', hint: 'Análise e raciocínio' },
]

export function CreateAiPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [fileName, setFileName] = useState('')
  const [material, setMaterial] = useState('')
  const [url, setUrl] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medio')
  const [count, setCount] = useState(10)
  const [timeOption, setTimeOption] = useState<TimeOption>('auto')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setFileName(file.name)
    const lower = file.name.toLowerCase()
    if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
      setBusy(true)
      setStatus('Lendo o PDF…')
      try {
        const text = await extractPdfText(file)
        setMaterial(text)
        setStatus(`PDF lido: ${text.length.toLocaleString('pt-BR')} caracteres.`)
      } catch {
        setError('Não consegui ler esse PDF. Ele pode ser só imagem/escaneado — cole o texto abaixo.')
        setStatus(null)
      } finally {
        setBusy(false)
      }
    } else if (lower.endsWith('.pptx')) {
      setBusy(true)
      setStatus('Lendo os slides…')
      try {
        const text = await extractPptxText(file)
        if (text.length < 20) throw new Error('vazio')
        setMaterial(text)
        setStatus(`Slides lidos: ${text.length.toLocaleString('pt-BR')} caracteres.`)
      } catch {
        setError('Não consegui ler esse arquivo de slides. Salve como .pptx ou cole o texto abaixo.')
        setStatus(null)
      } finally {
        setBusy(false)
      }
    } else {
      const text = await file.text()
      setMaterial(text)
      setStatus(`Arquivo lido: ${text.length.toLocaleString('pt-BR')} caracteres.`)
    }
  }

  async function handleGenerate() {
    if (!user) return
    const hasUrl = url.trim().length > 0
    if (!hasUrl && material.trim().length < 40) {
      setError('Cole um link, envie um PDF com texto, ou cole o material (pelo menos algumas frases).')
      return
    }
    setError(null)
    setBusy(true)
    setStatus(hasUrl ? 'Lendo a página e criando as perguntas…' : 'A IA está criando as perguntas… (pode levar alguns segundos)')

    const { title, questions, error: genErr } = await generateQuizFromMaterial(
      hasUrl ? { url: url.trim() } : { material },
      difficulty,
      count,
      timeOption,
    )
    if (genErr || questions.length === 0) {
      setBusy(false)
      setStatus(null)
      setError(genErr ?? 'Não foi possível gerar o quiz.')
      return
    }

    setStatus('Salvando o quiz…')
    const { id, error: createErr } = await createQuiz(user.id)
    if (createErr || !id) {
      setBusy(false)
      setError(createErr ?? 'Não foi possível criar o quiz.')
      return
    }
    const { error: saveErr } = await saveQuiz(id, { title: title || 'Quiz gerado por IA', description: '' }, questions)
    setBusy(false)
    if (saveErr) {
      setError(saveErr)
      return
    }
    navigate(`/quiz/${id}`)
  }

  return (
    <div className="min-h-screen">
      <nav className="max-w-[720px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/app">
          <img src={logo} alt="Quizoo" className="h-11 w-auto block" />
        </Link>
        <Link to="/app" className="font-display font-semibold text-body hover:text-heading">
          ← Voltar
        </Link>
      </nav>

      <main className="max-w-[720px] mx-auto px-4 sm:px-8 pt-4 pb-20">
        <div className="inline-flex items-center gap-2 bg-lilac text-purple-dark font-extrabold text-[12px] tracking-wide uppercase px-3 py-1.5 rounded-full mb-3">
          ✨ Gerar com IA
        </div>
        <h1 className="font-display font-semibold text-[30px] sm:text-[36px] text-heading">
          Vire seu material em quiz
        </h1>
        <p className="text-body text-[15px] mt-1 mb-7">
          Cole um link (site ou Wikipédia), envie um PDF, ou cole o texto. A IA cria as perguntas pra você.
        </p>

        {/* URL / Wikipédia */}
        <label className="block text-[13px] font-bold text-nav-link mb-1.5">Link de um site ou artigo da Wikipédia</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://pt.wikipedia.org/wiki/Fotossíntese"
          inputMode="url"
          className="w-full rounded-[14px] border-2 border-border px-4 py-3 text-[15px] text-heading outline-none focus:border-purple mb-3"
        />
        <div className="text-center text-[13px] text-muted mb-3">ou envie um arquivo</div>

        {/* Upload */}
        <label className="block bg-white border-2 border-dashed border-purple/40 rounded-[20px] p-7 text-center cursor-pointer hover:bg-lilac/30 transition-colors">
          <input
            type="file"
            accept="application/pdf,.pdf,.txt,.md,.pptx"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="text-4xl mb-2">📄</div>
          <div className="font-display font-semibold text-heading">
            {fileName || 'Clique para enviar um PDF, slides ou texto'}
          </div>
          <div className="text-[13px] text-muted mt-1">PDF, PPTX (slides), TXT ou MD</div>
        </label>

        <div className="text-center text-[13px] text-muted my-3">ou cole o material aqui</div>
        <textarea
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="Cole aqui o texto do material…"
          rows={5}
          className="w-full resize-y rounded-[14px] border-2 border-border px-4 py-3 text-[15px] text-heading outline-none focus:border-purple"
        />

        {/* Nível */}
        <h2 className="font-display font-semibold text-[17px] text-heading mt-7 mb-2">Nível das perguntas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              className={`rounded-[14px] border-2 px-4 py-3 text-left cursor-pointer transition-colors ${
                difficulty === d.value ? 'border-purple bg-lilac/50' : 'border-border bg-white hover:border-purple/40'
              }`}
            >
              <div className="font-display font-semibold text-heading">{d.label}</div>
              <div className="text-[12px] text-muted">{d.hint}</div>
            </button>
          ))}
        </div>

        {/* Quantidade */}
        <h2 className="font-display font-semibold text-[17px] text-heading mt-6 mb-2">Quantas perguntas</h2>
        <div className="flex gap-2.5">
          {[5, 10, 15].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={`rounded-[12px] border-2 px-5 py-2 font-display font-semibold cursor-pointer transition-colors ${
                count === n ? 'border-purple bg-lilac/50 text-purple-dark' : 'border-border bg-white text-heading'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Tempo por pergunta */}
        <h2 className="font-display font-semibold text-[17px] text-heading mt-6 mb-2">Tempo de cada pergunta</h2>
        <div className="flex flex-wrap gap-2.5">
          {([['auto', 'Automático'], [10, '10s'], [20, '20s'], [30, '30s'], [60, '60s'], [90, '90s']] as [TimeOption, string][]).map(
            ([val, label]) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setTimeOption(val)}
                className={`rounded-[12px] border-2 px-4 py-2 font-display font-semibold cursor-pointer transition-colors ${
                  timeOption === val ? 'border-purple bg-lilac/50 text-purple-dark' : 'border-border bg-white text-heading'
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
        <p className="text-[12px] text-muted mt-1.5">
          {timeOption === 'auto'
            ? 'Automático: perguntas maiores ganham mais tempo de resposta.'
            : 'Todas as perguntas terão esse tempo (dá pra ajustar depois no editor).'}
        </p>

        {status && !error && (
          <p className="mt-6 text-[14px] text-purple-dark font-semibold bg-lilac/40 rounded-xl px-4 py-3">{status}</p>
        )}
        {error && (
          <p className="mt-6 text-[14px] text-pink font-semibold bg-pink/10 border border-pink/30 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={busy}
          className="w-full mt-7 font-display font-semibold rounded-2xl px-8 py-4 text-[18px] text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 hover:shadow-[0_3px_0_#3A0E86] transition-[transform,box-shadow] disabled:opacity-60 cursor-pointer"
        >
          {busy ? 'Gerando…' : '✨ Gerar quiz com IA'}
        </button>
      </main>
    </div>
  )
}
