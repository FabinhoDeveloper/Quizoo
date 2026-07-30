import { Dialog } from './primitives'

const SHORTCUTS: [string, string][] = [
  ['Ctrl + Enter', 'Nova pergunta'],
  ['Ctrl + D', 'Duplicar pergunta atual'],
  ['Ctrl + S', 'Salvar'],
  ['Ctrl + Z', 'Desfazer'],
  ['Ctrl + Shift + Z', 'Refazer'],
  ['Alt + 1 / 2 / 3 / 4', 'Marcar/desmarcar a resposta correta'],
  ['Tab', 'Navegar entre as respostas'],
  ['↑ / ↓', 'Trocar de slide (na lista)'],
  ['?', 'Abrir esta janela de atalhos'],
]

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} size="md">
      <div className="p-6">
        <h2 className="mb-4 text-[18px] font-bold text-[var(--text)]">Atalhos de teclado</h2>
        <div className="flex flex-col gap-1.5">
          {SHORTCUTS.map(([keys, desc]) => (
            <div key={keys} className="flex items-center justify-between gap-4 rounded-[8px] px-1 py-1.5">
              <span className="text-[14px] text-[var(--text)]">{desc}</span>
              <kbd className="rounded-[6px] border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[12px] font-semibold text-[var(--text-muted)]">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  )
}
