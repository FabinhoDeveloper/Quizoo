import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/quizoo-logo.png'
import { useAuth } from '../context/AuthContext'
import { cloneQuiz, listPublicQuizzes, type PublicQuiz } from '../lib/quizzes'

export function ExplorePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState<PublicQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cloningId, setCloningId] = useState<string | null>(null)

  useEffect(() => {
    listPublicQuizzes().then(({ data, error }) => {
      setQuizzes(data)
      setError(error)
      setLoading(false)
    })
  }, [])

  async function handleUse(quizId: string) {
    if (!user) {
      navigate('/login')
      return
    }
    setCloningId(quizId)
    const { id, error } = await cloneQuiz(quizId, user.id)
    setCloningId(null)
    if (error || !id) {
      setError(error ?? 'Não foi possível usar este quiz.')
      return
    }
    navigate(`/quiz/${id}`)
  }

  return (
    <div className="min-h-screen">
      <nav className="max-w-[1000px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/">
          <img src={logo} alt="Quizoo" className="h-11 sm:h-[54px] w-auto block" />
        </Link>
        <Link
          to={user ? '/app' : '/login'}
          className="font-display font-semibold rounded-[14px] px-4 sm:px-[22px] py-2 sm:py-[9px] text-[15px] text-purple bg-white border-[2.5px] border-purple hover:bg-[#F3EBFF]"
        >
          {user ? 'Meu painel' : 'Entrar'}
        </Link>
      </nav>

      <main className="max-w-[1000px] mx-auto px-4 sm:px-8 pt-4 pb-20">
        <h1 className="font-display font-semibold text-[30px] sm:text-[40px] text-heading">Explorar quizzes</h1>
        <p className="text-body text-[15px] mt-1 mb-7">
          Quizzes prontos da comunidade. Achou um bom? Clique em <strong>Usar este quiz</strong> pra copiar pra sua conta.
        </p>

        {error && (
          <p className="mb-4 text-[14px] text-pink font-semibold bg-pink/10 border border-pink/30 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-body font-semibold py-10 text-center">Carregando…</p>
        ) : quizzes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-border rounded-[26px] p-12 text-center">
            <img src={logo} alt="Quizoo" className="h-12 w-auto mx-auto mb-5 opacity-90" />
            <h2 className="font-display font-semibold text-[22px] text-heading mb-2">Ainda não há quizzes públicos</h2>
            <p className="text-body text-[15px]">Publique um quiz seu no editor pra ele aparecer aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map((q) => (
              <div key={q.id} className="bg-white border-2 border-border rounded-[20px] p-5 flex flex-col">
                <h3 className="font-display font-semibold text-[19px] text-heading">{q.title}</h3>
                <p className="text-[14px] text-muted mt-1">
                  por {q.author} · {q.question_count} {q.question_count === 1 ? 'pergunta' : 'perguntas'}
                </p>
                {q.description && <p className="text-[14px] text-body mt-2 line-clamp-2">{q.description}</p>}
                <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                  <Link
                    to={`/solo/${q.id}`}
                    className="font-display font-semibold rounded-[12px] px-5 py-2.5 text-[14px] text-teal bg-teal-light hover:brightness-95 cursor-pointer"
                  >
                    Praticar
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleUse(q.id)}
                    disabled={cloningId === q.id}
                    className="font-display font-semibold rounded-[12px] px-5 py-2.5 text-[14px] text-white bg-purple shadow-[0_4px_0_#3A0E86] hover:translate-y-0.5 disabled:opacity-60 cursor-pointer"
                  >
                    {cloningId === q.id ? 'Copiando…' : 'Usar este quiz'}
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
