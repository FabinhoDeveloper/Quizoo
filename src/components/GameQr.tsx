import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * QR code que leva o jogador direto à tela de entrar com o PIN já preenchido.
 * Clicar amplia em tela cheia (pra turma inteira escanear de longe).
 */
export function GameQr({ pin }: { pin: string }) {
  const [url, setUrl] = useState('')
  const [big, setBig] = useState('')
  const [open, setOpen] = useState(false)

  const joinUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/join?pin=${pin}` : `https://quizoo.com.br/join?pin=${pin}`

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { width: 320, margin: 1, color: { dark: '#13034a', light: '#ffffff' } })
      .then(setUrl)
      .catch(() => setUrl(''))
    QRCode.toDataURL(joinUrl, { width: 900, margin: 2, color: { dark: '#13034a', light: '#ffffff' } })
      .then(setBig)
      .catch(() => setBig(''))
  }, [joinUrl])

  // fecha com ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!url) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Clique para ampliar o QR code"
        className="inline-flex flex-col items-center gap-1.5 bg-white border-2 border-border rounded-[18px] p-3 hover:border-purple/50 transition cursor-pointer"
      >
        <img src={url} alt="QR code para entrar no jogo" className="w-[132px] h-[132px]" />
        <span className="text-[12px] font-bold text-muted">📷 Escaneie para entrar</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-ink/95 grid place-items-center p-4 cursor-zoom-out"
          onClick={() => setOpen(false)}
        >
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={big || url}
              alt="QR code para entrar no jogo"
              className="bg-white rounded-[24px] p-4 w-[min(80vw,80vh)] h-[min(80vw,80vh)] object-contain mx-auto"
            />
            <p className="font-display font-semibold text-white text-[28px] sm:text-[40px] mt-6 tracking-[0.1em]">
              PIN {pin}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 font-display font-semibold rounded-2xl px-8 py-3 text-[17px] text-ink bg-white hover:bg-cream cursor-pointer"
            >
              Fechar ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
