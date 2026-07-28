import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/quizoo-logo.png'
import { useAuth } from '../context/AuthContext'
import { extractPdfText } from '../lib/pdfExtract'
import { generateQuizFromMaterial, type Difficulty } from '../lib/aiQuiz'
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
  const [difficulty, setDifficulty] = useState<Difficulty>('medio')
  const [count, setCount] = useState(10)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setFileName(file.name)
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
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
    } else {
      const text = await file.text()
      setMaterial(text)
      setStatus(`Arquivo lido: ${text.length.toLocaleString('pt-BR')} caracteres.`)
    }
  }

  async function handleGenerate() {
    if (!user) return
    if (material.trim().length < 40) {
      setError('Envie um PDF com texto ou cole o material (pelo menos algumas frases).')
      return
    }
    setError(null)
    setBusy(true)
    setStatus('A IA está criando as perguntas… (pode levar alguns segundos)')

    const { title, questions, error: genErr } = await generateQuizFromMaterial(material, difficulty, count)
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
          Envie um PDF (páginas de livro, apostila) ou cole o texto. A IA cria as perguntas pra você.
        </p>

        {/* Upload */}
        <label className="block bg-white border-2 border-dashed border-purple/40 rounded-[20px] p-7 text-center cursor-pointer hover:bg-lilac/30 transition-colors">
          <input
            type="file"
            accept="application/pdf,.pdf,.txt,.md"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="text-4xl mb-2">📄</div>
          <div className="font-display font-semibold text-heading">
            {fileName || 'Clique para enviar um PDF ou texto'}
          </div>
          <div className="text-[13px] text-muted mt-1">PDF, TXT ou MD</div>
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
