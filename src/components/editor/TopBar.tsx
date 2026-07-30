import { useEffect, useState } from 'react'
import {
  ArrowLeft, Check, Loader2, Undo2, Redo2, Moon, Sun, Keyboard, Palette,
  Settings2, Play, MoreHorizontal, Download, Upload, Copy, Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuizStore } from '../../store/useQuizStore'
import { IconButton, Menu, MenuItem, Tooltip } from './primitives'

export function TopBar({ onBack, onPreview, onHelp }: { onBack: () => void; onPreview: () => void; onHelp: () => void }) {
  const quiz = useQuizStore((s) => s.quiz)
  const setTitle = useQuizStore((s) => s.setTitle)
  const saveState = useQuizStore((s) => s.saveState)
  const dark = useQuizStore((s) => s.dark)
  const toggleDark = useQuizStore((s) => s.toggleDark)
  const save = useQuizStore((s) => s.save)
  const undo = useQuizStore((s) => s.undo)
  const redo = useQuizStore((s) => s.redo)
  const canUndo = useQuizStore((s) => s.past.length > 0)
  const canRedo = useQuizStore((s) => s.future.length > 0)

  // "Salvo há instantes" some após 3s
  const [showSaved, setShowSaved] = useState(false)
  useEffect(() => {
    if (saveState === 'saved') {
      setShowSaved(true)
      const t = setTimeout(() => setShowSaved(false), 3000)
      return () => clearTimeout(t)
    }
  }, [saveState])

  function exportJson() {
    const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${quiz.title || 'quiz'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4">
      {/* Esquerda */}
      <IconButton label="Voltar" onClick={onBack}>
        <ArrowLeft size={18} />
      </IconButton>
      <span className="hidden select-none text-[15px] font-extrabold tracking-tight text-[var(--primary)] sm:block">Quizoo</span>

      <div className="relative ml-1 flex-1 max-w-[420px]">
        <input
          value={quiz.title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nomeie seu quiz..."
          className="w-full rounded-[8px] border border-transparent bg-transparent px-2 py-1.5 text-[15px] font-semibold text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-muted)] hover:bg-[var(--surface-2)] focus:border-[var(--border)] focus:bg-[var(--surface)]"
        />
        {!quiz.title.trim() && (
          <span className="ml-2 rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--warning)]">
            Título obrigatório
          </span>
        )}
      </div>

      {/* Centro: autosave */}
      <div className="hidden min-w-[130px] items-center justify-center gap-1.5 text-[13px] font-medium text-[var(--text-muted)] md:flex">
        {saveState === 'saving' ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Salvando...
          </>
        ) : showSaved ? (
          <>
            <Check size={14} className="text-[var(--success)]" /> Salvo há instantes
          </>
        ) : null}
      </div>

      {/* Direita */}
      <div className="flex items-center gap-1">
        <Tooltip content="Desfazer (Ctrl+Z)">
          <IconButton label="Desfazer" onClick={undo} disabled={!canUndo}><Undo2 size={17} /></IconButton>
        </Tooltip>
        <Tooltip content="Refazer (Ctrl+Shift+Z)">
          <IconButton label="Refazer" onClick={redo} disabled={!canRedo}><Redo2 size={17} /></IconButton>
        </Tooltip>
        <Tooltip content="Atalhos (?)">
          <IconButton label="Atalhos" onClick={onHelp}><Keyboard size={17} /></IconButton>
        </Tooltip>
        <IconButton label={dark ? 'Modo claro' : 'Modo escuro'} onClick={toggleDark}>
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </IconButton>
        <IconButton label="Tema" onClick={() => toast('Painel de temas em breve')}><Palette size={17} /></IconButton>
        <IconButton label="Configurações" onClick={() => toast('Configurações do quiz em breve')}><Settings2 size={17} /></IconButton>

        <button
          type="button"
          onClick={onPreview}
          className="ml-1 hidden items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-3 py-2 text-[14px] font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] sm:flex"
        >
          <Play size={15} /> Pré-visualizar
        </button>
        <button
          type="button"
          onClick={() => void save().then(() => toast.success('Quiz salvo'))}
          className="rounded-[10px] bg-[var(--primary)] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          Salvar
        </button>

        <Menu
          trigger={<span className="grid h-9 w-9 place-items-center rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><MoreHorizontal size={18} /></span>}
        >
          {(close) => (
            <>
              <MenuItem onClick={() => { exportJson(); close() }}><Download size={15} /> Exportar JSON</MenuItem>
              <MenuItem onClick={() => { toast('Importar CSV em breve'); close() }}><Upload size={15} /> Importar CSV</MenuItem>
              <MenuItem onClick={() => { toast('Duplicar quiz em breve'); close() }}><Copy size={15} /> Duplicar quiz</MenuItem>
              <MenuItem danger onClick={() => { toast('Excluir quiz em breve'); close() }}><Trash2 size={15} /> Excluir quiz</MenuItem>
            </>
          )}
        </Menu>
      </div>
    </header>
  )
}
