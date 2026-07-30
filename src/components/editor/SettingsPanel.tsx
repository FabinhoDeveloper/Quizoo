import { Copy } from 'lucide-react'
import type { PointsMode, Question, QuestionType } from '../../types/quiz'
import { QUESTION_TYPE_META } from '../../types/quiz'
import { useQuizStore } from '../../store/useQuizStore'
import { PanelLabel, Switch, Tooltip } from './primitives'

const TIMES: (number | null)[] = [5, 10, 20, 30, 60, 90, 120, 240, null]
const POINTS: { mode: PointsMode; label: string; tip: string }[] = [
  { mode: 'standard', label: 'Padrão', tip: 'Pontos normais, com bônus por velocidade' },
  { mode: 'double', label: 'Dobro', tip: 'Vale o dobro dos pontos' },
  { mode: 'none', label: 'Sem pontos', tip: 'Não conta pontos (bom para enquete)' },
]

export function SettingsPanel({ question }: { question: Question }) {
  const setType = useQuizStore((s) => s.setType)
  const patchQuestion = useQuizStore((s) => s.patchQuestion)
  const setPoints = useQuizStore((s) => s.setPoints)
  const duplicate = useQuizStore((s) => s.duplicateQuestion)

  const meta = QUESTION_TYPE_META[question.type]

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] p-5">
      <div>
        <PanelLabel>Tipo de pergunta</PanelLabel>
        <select
          value={question.type}
          onChange={(e) => setType(question.id, e.target.value as QuestionType)}
          className="mt-1.5 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[14px] font-medium text-[var(--text)] outline-none focus:border-[var(--primary)]"
        >
          {(Object.keys(QUESTION_TYPE_META) as QuestionType[]).map((t) => (
            <option key={t} value={t}>
              {QUESTION_TYPE_META[t].label} — {QUESTION_TYPE_META[t].short}
            </option>
          ))}
        </select>
      </div>

      <div>
        <PanelLabel>Tempo limite</PanelLabel>
        <select
          value={question.timeLimitSec === null ? 'none' : String(question.timeLimitSec)}
          onChange={(e) =>
            patchQuestion(question.id, { timeLimitSec: e.target.value === 'none' ? null : Number(e.target.value) })
          }
          className="mt-1.5 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[14px] font-medium text-[var(--text)] outline-none focus:border-[var(--primary)]"
        >
          {TIMES.map((t) => (
            <option key={String(t)} value={t === null ? 'none' : String(t)}>
              {t === null ? 'Sem tempo' : `${t} segundos`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <PanelLabel>Pontuação</PanelLabel>
        <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-[10px] bg-[var(--surface-2)] p-1">
          {POINTS.map((p) => (
            <Tooltip key={p.mode} content={p.tip}>
              <button
                type="button"
                onClick={() => setPoints(question.id, p.mode)}
                className="w-full rounded-[8px] px-2 py-2 text-[13px] font-semibold transition-colors duration-150"
                style={{
                  background: question.pointsMode === p.mode ? 'var(--surface)' : 'transparent',
                  color: question.pointsMode === p.mode ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: question.pointsMode === p.mode ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {p.label}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {question.type === 'quiz' && (
        <div className="flex items-center justify-between">
          <div>
            <PanelLabel>Respostas</PanelLabel>
            <span className="mt-0.5 block text-[13px] font-medium text-[var(--text)]">Permitir múltiplas corretas</span>
          </div>
          <Switch
            checked={question.multipleCorrect}
            onChange={(v) => patchQuestion(question.id, { multipleCorrect: v })}
            label="Permitir múltiplas corretas"
          />
        </div>
      )}

      {meta.hasCorrect && (
        <div>
          <PanelLabel>Explicação pós-resposta</PanelLabel>
          <textarea
            value={question.explanation}
            onChange={(e) => patchQuestion(question.id, { explanation: e.target.value })}
            placeholder="Explique a resposta correta (aparece para o jogador depois)"
            rows={3}
            className="mt-1.5 w-full resize-none rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus:border-[var(--primary)]"
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => duplicate(question.id)}
        className="mt-auto flex items-center justify-center gap-1.5 rounded-[10px] border border-[var(--border)] px-4 py-2.5 text-[14px] font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
      >
        <Copy size={15} /> Duplicar esta pergunta
      </button>
    </aside>
  )
}
