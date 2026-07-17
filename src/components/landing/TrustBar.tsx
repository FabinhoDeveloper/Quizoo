const trustNames = ['EscolaViva', 'Aprende+', 'TechCon', 'Colégio Ápice', 'QuizLab']

export function TrustBar() {
  return (
    <section className="bg-white border-t-2 border-b-2 border-border py-[26px]">
      <div className="max-w-[1180px] mx-auto px-8 flex items-center justify-between flex-wrap gap-5">
        <span className="font-extrabold text-[13px] tracking-[0.1em] uppercase text-muted-2">
          Usado em salas de aula e empresas
        </span>
        <div className="flex gap-10 items-center flex-wrap font-display font-semibold text-[19px] text-[#C3BCD6]">
          {trustNames.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
