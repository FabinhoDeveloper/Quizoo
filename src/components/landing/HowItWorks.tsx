const steps = [
  {
    color: '#8E46F0',
    bg: '#EEE2FF',
    title: 'Monte seu quiz',
    text: 'Escreva perguntas, adicione imagens e defina o tempo. Ou parta de um modelo pronto.',
  },
  {
    color: '#03B0FC',
    bg: '#DBF3FF',
    title: 'Compartilhe o PIN',
    text: 'Projete o código na tela. Os jogadores entram pelo celular em segundos, sem cadastro.',
  },
  {
    color: '#01CFAB',
    bg: '#D6F7F0',
    title: 'Jogue ao vivo',
    text: 'Respostas em tempo real, ranking a cada rodada e aquele clima de comemoração no fim.',
  },
]

export function HowItWorks() {
  return (
    <section id="como" className="max-w-[1180px] mx-auto px-8 pt-[70px] pb-10 text-center">
      <div className="mb-[52px]">
        <div className="inline-flex items-center gap-2 font-extrabold text-[13px] tracking-[0.14em] uppercase text-purple mb-3.5">
          Como funciona
        </div>
        <h2 className="font-display font-semibold text-[44px] max-[640px]:text-[32px] mb-3">
          Do zero ao jogo em 3 passos
        </h2>
        <p className="text-[17px] text-body max-w-[560px] mx-auto leading-[1.6]">
          Sem instalar nada. O anfitrião cria, a turma entra pelo PIN e a disputa começa.
        </p>
      </div>
      <div className="grid grid-cols-3 max-[860px]:grid-cols-1 gap-6 text-left">
        {steps.map((step, i) => (
          <div className="bg-white border-2 border-border rounded-[24px] p-8" key={step.title}>
            <div
              className="w-[52px] h-[52px] rounded-2xl font-display font-semibold text-[26px] flex items-center justify-center mb-5"
              style={{ background: step.bg, color: step.color }}
            >
              {i + 1}
            </div>
            <h3 className="font-display font-semibold text-[23px] mb-2">{step.title}</h3>
            <p className="text-[15px] text-body leading-[1.6]">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
