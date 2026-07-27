import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'

export function Cta() {
  const navigate = useNavigate()

  return (
    <section className="max-w-[1180px] mx-auto px-8 pt-[60px] pb-[90px]">
      <div className="relative overflow-hidden bg-purple border-4 border-ink rounded-[32px] px-10 py-16 text-center shadow-[0_16px_0_#3A0E86]">
        <span className="absolute top-6 left-11 text-[28px] text-yellow max-[640px]:hidden">★</span>
        <span className="absolute bottom-[30px] right-[60px] text-[26px] text-teal max-[640px]:hidden">✓</span>
        <span className="absolute top-10 right-20 text-[22px] text-yellow max-[640px]:hidden">◆</span>

        <h2 className="font-display font-semibold text-[48px] max-[640px]:text-[34px] mb-3.5 text-white leading-[1.05]">
          Pronto para a primeira partida?
        </h2>
        <p className="text-lg text-[#E7DCFF] mx-auto mb-8 max-w-[480px] leading-[1.55]">
          Crie um quiz agora ou entre em um jogo com o PIN. Leva menos de um minuto.
        </p>
        <div className="flex flex-wrap gap-3.5 justify-center">
          <Button variant="ctaLight" onClick={() => navigate('/login')}>
            Criar um quiz grátis
          </Button>
          <Button variant="secondary" onClick={() => navigate('/join')}>
            Entrar com PIN
          </Button>
        </div>
      </div>
    </section>
  )
}
