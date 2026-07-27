import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/quizoo-logo.png'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

type Mode = 'login' | 'signup'

export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (!isSupabaseConfigured) {
      setError('O banco de dados (Supabase) ainda não foi conectado. Configure as chaves para ativar o login.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/app')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        })
        if (error) throw error
        if (data.session) {
          navigate('/app')
        } else {
          setNotice('Conta criada! Confirme seu e-mail e depois faça login.')
          setMode('login')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 py-12">
      <div className="w-full max-w-[440px]">
        <Link to="/" className="flex justify-center mb-8">
          <img src={logo} alt="Quizoo" className="h-14 w-auto" />
        </Link>

        <div className="bg-white border-2 border-border rounded-[26px] px-9 py-10 shadow-[0_10px_40px_rgba(90,31,158,0.08)]">
          <h1 className="font-display font-semibold text-[28px] text-heading text-center mb-1">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}
          </h1>
          <p className="text-center text-body text-[15px] mb-7">
            {mode === 'login' ? 'Entre para criar e gerenciar seus quizzes.' : 'É grátis. Comece a criar em minutos.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <Field
                label="Nome de usuário"
                type="text"
                value={username}
                onChange={setUsername}
                placeholder="Seu nome"
                required
              />
            )}
            <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@email.com" required />
            <Field
              label="Senha"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Mínimo 6 caracteres"
              required
            />

            {error && <p className="text-[14px] text-pink font-semibold">{error}</p>}
            {notice && <p className="text-[14px] text-teal font-semibold">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="font-display font-semibold rounded-2xl px-[34px] py-[15px] text-[18px] text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 hover:shadow-[0_3px_0_#3A0E86] transition-[transform,box-shadow] duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-[14px] text-body mt-6">
            {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError(null)
                setNotice(null)
              }}
              className="text-purple font-bold hover:text-purple-dark"
            >
              {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
        </div>

        <p className="text-center text-[14px] text-muted mt-6">
          <Link to="/join" className="hover:text-purple font-semibold">
            É jogador? Entrar com um PIN →
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-bold text-[14px] text-nav-link">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-[14px] border-2 border-border px-4 py-3 text-[15px] text-heading outline-none focus:border-purple transition-colors"
      />
    </label>
  )
}
