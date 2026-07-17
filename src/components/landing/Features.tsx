const features = [
  {
    icon: '⚡',
    bg: '#8E46F0',
    title: 'Tempo real de verdade',
    text: 'Placar e respostas atualizam na hora, sem travar mesmo com centenas de jogadores.',
  },
  {
    icon: '✎',
    bg: '#03B0FC',
    title: 'Editor simples',
    text: 'Crie um quiz completo em minutos. Múltipla escolha, verdadeiro/falso, enquetes e mais.',
  },
  {
    icon: '📊',
    bg: '#FE4881',
    title: 'Relatórios claros',
    text: 'Veja quem acertou o quê e onde a turma travou. Exporte com um clique.',
  },
  {
    icon: '👥',
    bg: '#01CFAB',
    title: 'Modo equipe',
    text: 'Individual ou em grupos. Perfeito para gincanas, treinamentos e eventos.',
  },
  {
    icon: '♿',
    bg: '#FEB703',
    iconColor: '#13034A',
    title: 'Acessível por padrão',
    text: 'Cor + forma em cada resposta, alto contraste e testes para daltonismo.',
  },
  {
    icon: '📱',
    bg: '#5A1F9E',
    title: 'Qualquer tela',
    text: 'Funciona no navegador do celular, tablet ou computador. Nada para instalar.',
  },
]

export function Features() {
  return (
    <section id="recursos" className="max-w-[1180px] mx-auto px-8 pt-[70px] pb-10">
      <div className="text-center mb-[52px]">
        <div className="inline-flex items-center gap-2 font-extrabold text-[13px] tracking-[0.14em] uppercase text-purple mb-3.5">
          Recursos
        </div>
        <h2 className="font-display font-semibold text-[44px] max-[640px]:text-[32px]">Por que escolher o Quizoo</h2>
      </div>
      <div className="grid grid-cols-3 max-[960px]:grid-cols-2 max-[640px]:grid-cols-1 gap-5">
        {features.map((feature) => (
          <div className="bg-white border-2 border-border rounded-[22px] p-[30px]" key={feature.title}>
            <div
              className="w-[46px] h-[46px] rounded-xl text-[22px] flex items-center justify-center mb-[18px]"
              style={{ background: feature.bg, color: feature.iconColor ?? '#fff' }}
            >
              {feature.icon}
            </div>
            <h3 className="font-display font-semibold text-xl mb-2">{feature.title}</h3>
            <p className="text-[14.5px] text-body leading-[1.6]">{feature.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
