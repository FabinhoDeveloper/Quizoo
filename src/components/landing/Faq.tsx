const faqs = [
  {
    q: 'O Quizoo é gratuito?',
    a: 'Sim. Você cria e joga quizzes de graça. Planos pagos liberam relatórios avançados e turmas maiores.',
  },
  {
    q: 'Preciso instalar algo?',
    a: 'Não. Tudo roda no navegador. Jogadores entram digitando o PIN, sem app, sem cadastro.',
  },
  {
    q: 'Quantas pessoas podem jogar juntas?',
    a: 'De uma turma pequena a eventos com centenas de participantes ao mesmo tempo.',
  },
  {
    q: 'Como o Quizoo cuida da acessibilidade?',
    a: 'Cada resposta usa cor e forma, o contraste é alto e as cores foram testadas para daltonismo.',
  },
]

export function Faq() {
  return (
    <section id="faq" className="max-w-[820px] mx-auto px-8 pt-20 pb-10">
      <h2 className="font-display font-semibold text-[40px] text-center mb-9">Perguntas frequentes</h2>
      <div className="flex flex-col gap-3.5">
        {faqs.map((faq) => (
          <div className="bg-white border-2 border-border rounded-[18px] px-7 py-6" key={faq.q}>
            <h3 className="font-display font-semibold text-lg mb-2">{faq.q}</h3>
            <p className="text-[15px] text-body leading-[1.6]">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
