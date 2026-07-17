import logo from '../../assets/quizoo-logo.png'

export function Footer() {
  return (
    <footer className="bg-white border-t-2 border-border pt-[52px] pb-10">
      <div className="max-w-[1180px] mx-auto px-8 grid grid-cols-[1.4fr_1fr_1fr_1fr] max-[760px]:grid-cols-2 gap-8">
        <div>
          <img src={logo} alt="Quizoo" className="h-14 w-auto block mb-3" />
          <p className="text-sm text-muted max-w-[240px] leading-[1.6]">
            Pergunte. Jogue. Aprenda. A plataforma de perguntas em tempo real feita para todos.
          </p>
        </div>
        <div>
          <div className="font-extrabold text-xs tracking-[0.1em] uppercase text-muted-2 mb-3.5">Produto</div>
          <div className="flex flex-col gap-2.5 font-semibold text-sm">
            <a href="#recursos" className="text-nav-link hover:text-purple-dark">
              Recursos
            </a>
            <a href="#como" className="text-nav-link hover:text-purple-dark">
              Como funciona
            </a>
            <a href="#" className="text-nav-link hover:text-purple-dark">
              Preços
            </a>
          </div>
        </div>
        <div>
          <div className="font-extrabold text-xs tracking-[0.1em] uppercase text-muted-2 mb-3.5">Recursos</div>
          <div className="flex flex-col gap-2.5 font-semibold text-sm">
            <a href="#" className="text-nav-link hover:text-purple-dark">
              Modelos
            </a>
            <a href="#acessibilidade" className="text-nav-link hover:text-purple-dark">
              Acessibilidade
            </a>
            <a href="#faq" className="text-nav-link hover:text-purple-dark">
              Ajuda
            </a>
          </div>
        </div>
        <div>
          <div className="font-extrabold text-xs tracking-[0.1em] uppercase text-muted-2 mb-3.5">Empresa</div>
          <div className="flex flex-col gap-2.5 font-semibold text-sm">
            <a href="#" className="text-nav-link hover:text-purple-dark">
              Sobre
            </a>
            <a href="#" className="text-nav-link hover:text-purple-dark">
              Contato
            </a>
            <a href="#" className="text-nav-link hover:text-purple-dark">
              Privacidade
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-[1180px] mx-auto px-8 mt-9 pt-6 border-t-2 border-border text-[13px] text-muted-2 font-bold">
        © 2026 Quizoo. Todos os direitos reservados.
      </div>
    </footer>
  )
}
