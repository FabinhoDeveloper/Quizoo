import { useRef, useState } from 'react'
import { ImagePlus, Link2, Sparkles, Search, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Question } from '../../types/quiz'
import { useQuizStore } from '../../store/useQuizStore'
import { uploadMedia } from '../../services/quizService'

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)
  return m ? m[1] : null
}

export function MediaUploader({ question }: { question: Question }) {
  const patchQuestion = useQuizStore((s) => s.patchQuestion)
  const fileRef = useRef<HTMLInputElement>(null)
  const [linkMode, setLinkMode] = useState(false)
  const [link, setLink] = useState('')

  const media = question.media

  async function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return
    const { url } = await uploadMedia(file)
    patchQuestion(question.id, { media: { type: 'image', url, startAt: 0, endAt: 0 } })
    toast.success('Imagem adicionada')
  }

  function applyLink() {
    const id = youtubeId(link)
    if (!id) {
      toast.error('Link do YouTube inválido')
      return
    }
    patchQuestion(question.id, { media: { type: 'video', url: id, startAt: 0, endAt: 0 } })
    setLinkMode(false)
    setLink('')
  }

  function clearMedia() {
    patchQuestion(question.id, { media: { type: 'none', url: '', startAt: 0, endAt: 0 } })
  }

  // Estado preenchido — imagem
  if (media.type === 'image') {
    return (
      <div className="group relative mx-auto aspect-video w-full max-w-[560px] overflow-hidden rounded-[12px] border border-[var(--border)]">
        <img src={media.url} alt="" className="h-full w-full object-contain bg-[var(--surface-2)]" />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold text-[#0f172a]"
          >
            <RefreshCw size={15} /> Trocar
          </button>
          <button
            type="button"
            onClick={clearMedia}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--danger)]"
          >
            <Trash2 size={15} /> Remover
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />
      </div>
    )
  }

  // Estado preenchido — vídeo do YouTube
  if (media.type === 'video') {
    return (
      <div className="mx-auto w-full max-w-[560px]">
        <div className="relative aspect-video overflow-hidden rounded-[12px] border border-[var(--border)]">
          <iframe
            src={`https://www.youtube.com/embed/${media.url}?start=${media.startAt}`}
            title="Vídeo"
            className="h-full w-full"
            allowFullScreen
          />
        </div>
        <div className="mt-2 flex items-center gap-3 text-[13px] text-[var(--text-muted)]">
          <label className="flex items-center gap-1.5">
            Início
            <input
              type="number"
              min={0}
              value={media.startAt}
              onChange={(e) => patchQuestion(question.id, { media: { ...media, startAt: Math.max(0, +e.target.value) } })}
              className="w-16 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[var(--text)]"
            />
            s
          </label>
          <button type="button" onClick={clearMedia} className="ml-auto inline-flex items-center gap-1.5 font-semibold text-[var(--danger)]">
            <Trash2 size={15} /> Remover
          </button>
        </div>
      </div>
    )
  }

  // Estado vazio — dropzone
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        void handleFile(e.dataTransfer.files?.[0])
      }}
      onPaste={(e) => {
        const item = [...e.clipboardData.items].find((it) => it.type.startsWith('image/'))
        if (item) void handleFile(item.getAsFile() ?? undefined)
      }}
      className="mx-auto grid aspect-video w-full max-w-[560px] place-items-center rounded-[12px] border-2 border-dashed border-[var(--border)] bg-[var(--surface-2)]/40"
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />
      {linkMode ? (
        <div className="flex w-full max-w-[380px] flex-col gap-2 px-4">
          <input
            autoFocus
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyLink()}
            placeholder="Cole o link do YouTube"
            className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] text-[var(--text)] outline-none focus:border-[var(--primary)]"
          />
          <div className="flex gap-2">
            <button type="button" onClick={applyLink} className="flex-1 rounded-[10px] bg-[var(--primary)] px-3 py-2 text-[13px] font-semibold text-white">
              Adicionar
            </button>
            <button type="button" onClick={() => setLinkMode(false)} className="rounded-[10px] px-3 py-2 text-[13px] font-semibold text-[var(--text-muted)]">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2 px-4 text-center">
          <DzButton icon={<ImagePlus size={16} />} label="Enviar imagem" onClick={() => fileRef.current?.click()} />
          <DzButton icon={<Link2 size={16} />} label="Link do YouTube" onClick={() => setLinkMode(true)} />
          <DzButton icon={<Search size={16} />} label="Banco de imagens" onClick={() => toast('Banco de imagens em breve')} />
          <DzButton icon={<Sparkles size={16} />} label="Gerar com IA" onClick={() => toast('Geração de imagem por IA em breve')} />
        </div>
      )}
    </div>
  )
}

function DzButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] font-semibold text-[var(--text)] shadow-[var(--shadow-sm)] transition-colors duration-150 hover:border-[var(--primary)] hover:text-[var(--primary)]"
    >
      {icon}
      {label}
    </button>
  )
}
