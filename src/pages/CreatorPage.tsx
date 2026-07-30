import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Layers, SlidersHorizontal, X } from 'lucide-react'
import '../styles/tokens.css'
import { useQuizStore } from '../store/useQuizStore'
import { createQuestion } from '../data/mockQuiz'
import { useAutosave } from '../hooks/useAutosave'
import { useEditorShortcuts } from '../hooks/useEditorShortcuts'
import { TopBar } from '../components/editor/TopBar'
import { SlideSidebar } from '../components/editor/SlideSidebar'
import { QuestionCanvas } from '../components/editor/QuestionCanvas'
import { SettingsPanel } from '../components/editor/SettingsPanel'
import { ValidationBar } from '../components/editor/ValidationBar'
import { PreviewModal } from '../components/editor/PreviewModal'
import { ShortcutsModal } from '../components/editor/ShortcutsModal'

const TEMPLATES: { key: string; label: string; make: () => ReturnType<typeof createQuestion>[] }[] = [
  { key: 'quick', label: '⚡ Quiz rápido', make: () => Array.from({ length: 5 }, () => createQuestion('quiz')) },
  { key: 'exam', label: '📝 Prova', make: () => Array.from({ length: 10 }, () => createQuestion('quiz')) },
  { key: 'poll', label: '🗳️ Enquete de turma', make: () => Array.from({ length: 3 }, () => createQuestion('poll')) },
]

export function CreatorPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()

  const quiz = useQuizStore((s) => s.quiz)
  const activeId = useQuizStore((s) => s.activeId)
  const dark = useQuizStore((s) => s.dark)
  const load = useQuizStore((s) => s.load)
  const patchQuiz = useQuizStore((s) => s.patchQuiz)
  const setActive = useQuizStore((s) => s.setActive)

  const [preview, setPreview] = useState(false)
  const [help, setHelp] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [mobilePanel, setMobilePanel] = useState(false)

  useEffect(() => {
    void load(quizId)
  }, [quizId, load])

  useAutosave()
  useEditorShortcuts(() => setHelp(true))

  const active = quiz.questions.find((q) => q.id === activeId) ?? quiz.questions[0]
  const isFresh = quiz.questions.length === 1 && !quiz.questions[0].text.trim() && !quiz.title.trim()

  function applyTemplate(make: () => ReturnType<typeof createQuestion>[]) {
    const qs = make()
    patchQuiz({ questions: qs })
    setActive(qs[0].id)
  }

  return (
    <div className={`creator-root ${dark ? 'dark' : ''} flex h-screen flex-col`} style={{ background: 'var(--bg)' }}>
      <Toaster
        position="bottom-center"
        toastOptions={{ style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 14 } }}
      />
      <TopBar onBack={() => navigate('/app')} onPreview={() => setPreview(true)} onHelp={() => setHelp(true)} />

      <div className="flex min-h-0 flex-1">
        {/* Sidebar (desktop) */}
        <div className="hidden lg:flex">
          <SlideSidebar />
        </div>

        {/* Canvas */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isFresh && (
              <div className="mx-auto mt-6 flex w-full max-w-[720px] flex-wrap items-center justify-center gap-2 px-4">
                <span className="text-[13px] font-medium text-[var(--text-muted)]">Começar com um modelo:</span>
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => applyTemplate(t.make)}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[13px] font-semibold text-[var(--text)] shadow-[var(--shadow-sm)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {active && <QuestionCanvas question={active} />}
          </div>
          <ValidationBar />
        </main>

        {/* Painel (desktop) */}
        <div className="hidden lg:flex">{active && <SettingsPanel question={active} />}</div>
      </div>

      {/* Barra mobile */}
      <div className="flex items-center justify-around border-t border-[var(--border)] bg-[var(--surface)] p-2 lg:hidden">
        <button type="button" onClick={() => setMobileSidebar(true)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text)]">
          <Layers size={16} /> Slides
        </button>
        <button type="button" onClick={() => setMobilePanel(true)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text)]">
          <SlidersHorizontal size={16} /> Configurações
        </button>
      </div>

      {/* Drawers mobile */}
      {mobileSidebar && (
        <MobileDrawer side="left" onClose={() => setMobileSidebar(false)}>
          <SlideSidebar />
        </MobileDrawer>
      )}
      {mobilePanel && active && (
        <MobileDrawer side="right" onClose={() => setMobilePanel(false)}>
          <SettingsPanel question={active} />
        </MobileDrawer>
      )}

      <PreviewModal open={preview} onClose={() => setPreview(false)} />
      <ShortcutsModal open={help} onClose={() => setHelp(false)} />
    </div>
  )
}

function MobileDrawer({ side, onClose, children }: { side: 'left' | 'right'; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`absolute top-0 bottom-0 ${side === 'left' ? 'left-0' : 'right-0'} max-w-[85vw]`}>
        <button type="button" onClick={onClose} aria-label="Fechar" className="absolute -right-10 top-3 grid h-8 w-8 place-items-center rounded-full bg-[var(--surface)] text-[var(--text)]">
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  )
}
