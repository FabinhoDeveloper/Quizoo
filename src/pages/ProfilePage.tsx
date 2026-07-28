import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/quizoo-logo.png'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/storage'
import { PRESET_AVATARS, avatarBg } from '../lib/avatars'
import { Avatar } from '../components/Avatar'

export function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!active) return
        setUsername(data?.username ?? (user.user_metadata?.username as string) ?? '')
        setAvatar(data?.avatar_url ?? null)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  async function handlePhoto(file: File | undefined) {
    if (!file) return
    setError(null)
    setUploading(true)
    const { url, error } = await uploadImage(file, 'avatars')
    setUploading(false)
    if (error || !url) {
      setError(error ?? 'Não foi possível enviar a foto.')
      return
    }
    setAvatar(url)
  }

  async function handleSave() {
    if (!user) return
    setError(null)
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() || null, avatar_url: avatar })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="font-display font-semibold text-body text-lg">Carregando perfil…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <nav className="max-w-[720px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/">
          <img src={logo} alt="Quizoo" className="h-11 sm:h-[54px] w-auto block" />
        </Link>
        <Link to="/app" className="font-bold text-[15px] text-nav-link hover:text-purple-dark">
          ← Meus quizzes
        </Link>
      </nav>

      <main className="max-w-[560px] mx-auto px-4 sm:px-8 pt-4 pb-20">
        <h1 className="font-display font-semibold text-[30px] sm:text-[36px] text-heading mb-6">Seu perfil</h1>

        <div className="bg-white border-2 border-border rounded-[22px] p-6 sm:p-8">
          <div className="flex flex-col items-center mb-6">
            <Avatar avatar={avatar} name={username} size={96} />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void handlePhoto(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-3 text-[14px] font-bold text-purple hover:text-purple-dark disabled:opacity-60 cursor-pointer"
            >
              {uploading ? 'Enviando…' : '📷 Enviar minha foto'}
            </button>
          </div>

          <label className="block text-[13px] font-bold text-nav-link mb-1.5">Nome de exibição</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 30))}
            placeholder="Como quer ser chamado(a)"
            className="w-full rounded-[14px] border-2 border-border px-4 py-3 text-[16px] text-heading outline-none focus:border-purple mb-6"
          />

          <p className="text-[13px] font-bold text-nav-link mb-2">Ou escolha um avatar</p>
          <div className="grid grid-cols-8 gap-1.5 mb-6">
            {PRESET_AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`aspect-square rounded-full grid place-items-center text-[20px] border-2 transition ${
                  avatar === a ? 'border-purple scale-110' : 'border-transparent hover:border-border'
                }`}
                style={{ background: avatarBg(a) }}
                aria-label={`Avatar ${a}`}
              >
                {a}
              </button>
            ))}
          </div>

          {error && <p className="text-[14px] text-pink font-semibold mb-3">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="font-display font-semibold rounded-2xl px-7 py-3 text-[16px] text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Salvando…' : 'Salvar perfil'}
            </button>
            {savedAt && <span className="text-[14px] text-teal font-bold">Salvo {savedAt}</span>}
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="ml-auto font-display font-semibold text-body hover:text-heading cursor-pointer"
            >
              Voltar
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
