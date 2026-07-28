import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { GameMockup } from './GameMockup'

export function Hero() {
  const navigate = useNavigate()

  return (
    <header className="relative px-8 pt-11 pb-[90px]">
      <span className="absolute top-6 right-[4%] text-[30px] text-yellow max-[860px]:hidden">★</span>
      <span className="absolute top-[230px] right-[1.5%] text-[26px] text-teal max-[860px]:hidden">✓</span>
      <span className="absolute bottom-20 right-[6%] text-[22px] text-blue max-[860px]:hidden">▲</span>
      <span className="absolute bottom-10 right-[2.5%] text-[26px] text-purple max-[860px]:hidden">●</span>

      <div className="max-w-[1180px] mx-auto grid grid-cols-[1.05fr_0.95fr] max-[960px]:grid-cols-1 gap-14 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-lilac text-purple-dark font-extrabold text-[13px] tracking-[0.06em] uppercase px-4 py-2 rounded-full">
            Perguntas em tempo real
          </div>
          <h1 className="font-display font-semibold text-[66px] max-[640px]:text-[42px] leading-[1.02] mt-[22px] text-heading">
            Aprender virou
            <br />
            <span className="text-purple">jogo</span> de turma.
          </h1>
          <p className="font-body font-semibold text-[19px] leading-[1.6] text-body-strong mt-[22px] max-w-[480px]">
            Crie quizzes coloridos, dispute ao vivo e veja todos participando, na sala de aula, no evento ou no
            sofá. <strong>Pergunte. Jogue. Aprenda.</strong>
          </p>
          <div className="flex flex-wrap gap-3.5 mt-8">
            <Button variant="primary" onClick={() => navigate('/login')}>
              Criar um quiz grátis
            </Button>
            <Button variant="secondary" onClick={() => navigate('/join')}>
              Entrar com PIN
            </Button>
          </div>
        </div>

        <GameMockup />
      </div>
    </header>
  )
}
