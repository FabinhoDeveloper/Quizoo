const audiences = [
  {
    bg: '#EEE2FF',
    tagColor: '#8E46F0',
    tag: 'Para educadores',
    titleColor: '#3A0E86',
    title: 'Transforme a aula em disputa',
    itemColor: '#4A2E86',
    checkColor: '#8E46F0',
    items: [
      'Revisões que a turma pede pra repetir',
      'Modelos por matéria e faixa etária',
      'Relatórios de desempenho por aluno',
    ],
  },
  {
    bg: '#DBF3FF',
    tagColor: '#0284C7',
    tag: 'Para jogadores & criadores',
    titleColor: '#064663',
    title: 'Entre e jogue na hora',
    itemColor: '#075985',
    checkColor: '#03B0FC',
    items: [
      'Só o PIN, sem cadastro para jogar',
      'Crie e compartilhe seus próprios quizzes',
      'Ranking, conquistas e revanche',
    ],
  },
]

export function Audiences() {
  return (
    <section className="max-w-[1180px] mx-auto px-8 pt-[70px] pb-10">
      <div className="grid grid-cols-2 max-[860px]:grid-cols-1 gap-5">
        {audiences.map((audience) => (
          <div className="rounded-[26px] p-11" style={{ background: audience.bg }} key={audience.tag}>
            <div
              className="font-display font-semibold text-sm bg-white inline-block px-3.5 py-1.5 rounded-full mb-5"
              style={{ color: audience.tagColor }}
            >
              {audience.tag}
            </div>
            <h3 className="font-display font-semibold text-[30px] mb-3.5" style={{ color: audience.titleColor }}>
              {audience.title}
            </h3>
            <ul className="flex flex-col gap-3">
              {audience.items.map((item) => (
                <li className="flex gap-3 text-[15.5px] font-semibold" style={{ color: audience.itemColor }} key={item}>
                  <span style={{ color: audience.checkColor }}>✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
