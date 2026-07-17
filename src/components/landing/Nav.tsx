import logo from '../../assets/quizoo-logo.png'
import { Button } from '../ui/Button'

const navLinks = [
  { href: '#como', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#acessibilidade', label: 'Acessibilidade' },
  { href: '#faq', label: 'FAQ' },
]

export function Nav() {
  return (
    <nav className="max-w-[1180px] mx-auto px-8 py-[22px] flex items-center justify-between">
      <img src={logo} alt="Quizoo" className="h-[54px] w-auto block" />
      <div className="flex items-center gap-8">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="max-[860px]:hidden font-bold text-[15px] text-nav-link hover:text-purple-dark"
          >
            {link.label}
          </a>
        ))}
        <Button variant="outline">Entrar</Button>
      </div>
    </nav>
  )
}
