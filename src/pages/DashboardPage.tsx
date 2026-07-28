import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/quizoo-logo.png'
import { useAuth } from '../context/AuthContext'
import { createQuiz, deleteQuiz, listQuizzes, type QuizSummary } from '../lib/quizzes'
import { hostGame } from '../lib/game'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const username = (user?.user_metadata?.username as string | undefined) ?? user?.email

  const [quizzes, setQuizzes] = useState<QuizSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function refresh() {
    const { data, error } = await listQuizzes()
    setQuizzes(data)
    setError(error)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleCreate() {
    if (!user) return
    setCreating(true)
    const { id, error } = await createQuiz(user.id)
    setCreating(false)
    if (error || !id) {
      setError(error ?? 'Não foi possível criar o quiz.')
      return
    }
    navigate(`/quiz/${id}`)
  }

  async function handlePlay(quizId: string) {
    if (!user) return
    const { gameId, error } = await hostGame(quizId, user.id)
    if (error || !gameId) {
      setError(error ?? 'Não foi possível iniciar o jogo.')
      return
    }
    navigate(`/host/${gameId}`)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir o quiz "${title}"? Isso não pode ser desfeito.`)) return
    const { error } = await deleteQuiz(id)
    if (error) {
      setError(error)
      return
    }
    setQuizzes((qs) => qs.filter((q) => q.id !== id))
  }

  return (
    <div className="min-h-screen">
      <nav className="max-w-[1000px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/">
          <img src={logo} alt="Quizoo" className="h-11 sm:h-[54px] w-auto block" />
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="font-bold text-[15px] text-nav-link hidden sm:inline">Olá, {username}</span>
          <button
            type="button"
            onClick={signOut}
            className="font-display font-semibold rounded-[14px] px-4 sm:px-[22px] py-2 sm:py-[9px] text-[15px] text-purple bg-white border-[2.5px] border-purple hover:bg-[#F3EBFF] cursor-pointer"
          >
            Sair
          </button>
        </div>
      </nav>

      <main className="max-w-[1000px] mx-auto px-4 sm:px-8 pt-4 pb-20">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-7">
          <div>
            <h1 className="font-display font-semibold text-[30px] sm:text-[40px] text-heading">Meus quizzes</h1>
            <p className="text-body text-[15px] mt-1">Crie um novo quiz ou continue editando.</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/create-ai"
              className="font-display font-semibold rounded-2xl px-5 py-3 text-[16px] text-purple bg-lilac hover:bg-[#e2d2ff] cursor-pointer"
            >
              ✨ Gerar com IA
            </Link>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="font-display font-semibold rounded-2xl px-6 py-3 text-[16px] text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 hover:shadow-[0_3px_0_#3A0E86] transition-[transform,box-shadow] disabled:opacity-60 cursor-pointer"
            >
              {creating ? 'Criando…' : '+ Criar quiz'}
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-[14px] text-pink font-semibold bg-pink/10 border border-pink/30 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-body font-semibold py-10 text-center">Carregando…</p>
        ) : quizzes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-border rounded-[26px] p-12 text-center">
            <div className="text-5xl mb-4">🦉</div>
            <h2 className="font-display font-semibold text-[22px] text-heading mb-2">Nenhum quiz ainda</h2>
            <p className="text-body text-[15px] mb-6">Que tal criar o seu primeiro? Leva menos de um minuto.</p>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="font-display font-semibold rounded-2xl px-7 py-3 text-[16px] text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 cursor-pointer disabled:opacity-60"
            >
              {creating ? 'Criando…' : 'Criar meu primeiro quiz'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map((q) => (
              <div key={q.id} className="bg-white border-2 border-border rounded-[20px] p-5 flex flex-col">
                <h3 className="font-display font-semibold text-[19px] text-heading">{q.title}</h3>
                <p className="text-[14px] text-muted mt-1 mb-4">
                  {q.question_count} {q.question_count === 1 ? 'pergunta' : 'perguntas'}
                </p>
                <div className="mt-auto flex items-center gap-2.5">
                  <Link
                    to={`/quiz/${q.id}`}
                    className="font-display font-semibold rounded-[12px] px-4 py-2 text-[14px] text-purple bg-lilac hover:bg-[#e2d2ff] cursor-pointer"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => handlePlay(q.id)}
                    disabled={q.question_count === 0}
                    title={q.question_count === 0 ? 'Adicione perguntas primeiro' : 'Hospedar um jogo ao vivo'}
                    className="font-display font-semibold rounded-[12px] px-4 py-2 text-[14px] text-ink bg-yellow hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Jogar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(q.id, q.title)}
                    className="ml-auto text-[13px] font-bold text-muted hover:text-pink cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
